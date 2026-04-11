import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors/app-error";
import { env } from "../../config/env";
import { logger } from "../../lib/logger";
import {
  ConfirmPaymentBody,
  CreatePaymentAttemptBody,
  RazorpayVerifyBody,
} from "./payments.types";
import {
  confirmReservationsByOrder,
  createOrderStatusHistory,
  createPaymentAttempt,
  findOrderForUser,
  findPaymentAttemptByOrderAndIdempotencyKey,
  findPaymentByProviderEventId,
  findPaymentByProviderOrderId,
  findPaymentByProviderPaymentId,
  findPaymentByIdWithOrder,
  findSuccessfulPaymentForOrder,
  updateOrderForPaymentSuccess,
  updatePayment,
} from "./payments.repository";
import {
  createRazorpayOrder,
  verifyRazorpayCheckoutSignature,
  verifyRazorpayWebhookSignature,
} from "./gateways/razorpay.gateway";
import { ORDER_STATUS, PAYMENT_STATUS } from "../orders/orders.types";
import {
  createInfluencerSale,
  incrementInfluencerEarnings,
} from "../influencers/influencers.repository";
import {
  createInvoiceInTx,
  generateInvoicePdf,
} from "../invoices/invoices.service";

const TX_OPTIONS = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  maxWait: 5000,
  timeout: 10000,
} as const;

const centsToDecimal = (cents: number) =>
  new Prisma.Decimal((cents / 100).toFixed(2));

const toCents = (value: Prisma.Decimal | number | null | undefined) => {
  if (value === null || value === undefined) return 0;
  const amount = typeof value === "number" ? value : value.toNumber();
  return Math.round(amount * 100);
};

const grandTotalCents = (order: {
  productTotal: Prisma.Decimal;
  shippingAmount: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  discountAmount: Prisma.Decimal;
}) =>
  toCents(order.productTotal) +
  toCents(order.shippingAmount) +
  toCents(order.taxAmount) -
  toCents(order.discountAmount);

const outstandingCents = (order: {
  productTotal: Prisma.Decimal;
  shippingAmount: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  discountAmount: Prisma.Decimal;
  totalPaid: Prisma.Decimal;
}) => {
  const grand = grandTotalCents(order);
  return grand - toCents(order.totalPaid);
};

const toPaymentAttemptResponse = (payment: {
  id: bigint;
  orderId: bigint;
  amount: Prisma.Decimal;
  currency: string;
  paymentProvider: string;
  paymentStatus: number;
  providerOrderId: string | null;
  createdAt: Date;
}) => ({
  id: payment.id.toString(),
  orderId: payment.orderId.toString(),
  paymentProvider: payment.paymentProvider,
  amount: payment.amount.toString(),
  currency: payment.currency,
  paymentStatus: payment.paymentStatus,
  paymentAttemptId: payment.id.toString(),
  razorpayOrderId: payment.providerOrderId,
  amountPaise: toCents(payment.amount),
  razorpayKeyId: env.RAZORPAY_KEY_ID,
  createdAt: payment.createdAt.toISOString(),
});

type PaymentAttemptRecord = Awaited<
  ReturnType<typeof prisma.payment.findUnique>
>;

export const createPendingPaymentAttemptForOrder = async (
  userId: string,
  orderId: bigint,
  idempotencyKey: string,
  body: CreatePaymentAttemptBody,
) => {
  const paymentProvider = (
    body.paymentProvider ?? env.PAYMENT_PROVIDER_DEFAULT
  ).toLowerCase();
  if (paymentProvider !== "razorpay") {
    throw new AppError(
      400,
      "Only razorpay payment provider is supported",
      "UNSUPPORTED_PAYMENT_PROVIDER",
    );
  }

  return prisma.$transaction(async (tx) => {
    const order = await findOrderForUser(tx, orderId, BigInt(userId));
    if (!order) {
      throw new AppError(404, "Order not found", "ORDER_NOT_FOUND");
    }

    if (order.orderStatus === ORDER_STATUS.CANCELLED) {
      throw new AppError(
        409,
        "Cannot create payment for cancelled order",
        "ORDER_CANCELLED",
      );
    }

    const existingByIdempotency =
      await findPaymentAttemptByOrderAndIdempotencyKey(
        tx,
        order.id,
        idempotencyKey,
      );
    if (existingByIdempotency) {
      return existingByIdempotency;
    }

    const existingSuccess = await findSuccessfulPaymentForOrder(tx, order.id);
    if (existingSuccess) {
      return existingSuccess;
    }

    const outstanding = outstandingCents(order);
    if (outstanding <= 0) {
      throw new AppError(
        409,
        "Order is already fully paid",
        "ORDER_ALREADY_PAID",
      );
    }

    return createPaymentAttempt(tx, {
      order: { connect: { id: order.id } },
      paymentProvider,
      paymentMethod: body.paymentMethod ?? null,
      paymentIntentId: body.providerIntentRef ?? null,
      idempotencyKey,
      amount: centsToDecimal(outstanding),
      paymentStatus: PAYMENT_STATUS.PENDING,
    });
  }, TX_OPTIONS);
};

const ensureRazorpayProviderOrderForPaymentRecord = async (
  payment: NonNullable<PaymentAttemptRecord>,
) => {
  if (payment.paymentProvider.toLowerCase() !== "razorpay") {
    throw new AppError(
      400,
      "Only razorpay payment provider is supported",
      "UNSUPPORTED_PAYMENT_PROVIDER",
    );
  }

  if (payment.providerOrderId) {
    return toPaymentAttemptResponse(payment);
  }

  const receipt = `order-${payment.orderId.toString()}-pay-${payment.id.toString()}`;
  const razorpayOrder = await createRazorpayOrder({
    amountPaise: toCents(payment.amount),
    currency: payment.currency,
    receipt,
    notes: {
      orderId: payment.orderId.toString(),
      paymentId: payment.id.toString(),
    },
  });

  const updateResult = await prisma.payment.updateMany({
    where: { id: payment.id, providerOrderId: null },
    data: {
      providerOrderId: razorpayOrder.id,
      paymentIntentId: razorpayOrder.id,
    },
  });

  if (updateResult.count === 0) {
    const latest = await prisma.payment.findUnique({
      where: { id: payment.id },
    });
    if (!latest) {
      throw new AppError(404, "Payment not found", "PAYMENT_NOT_FOUND");
    }
    return toPaymentAttemptResponse(latest);
  }

  const updatedPayment = await prisma.payment.findUnique({
    where: { id: payment.id },
  });
  if (!updatedPayment) {
    throw new AppError(404, "Payment not found", "PAYMENT_NOT_FOUND");
  }

  return toPaymentAttemptResponse(updatedPayment);
};

export const ensureProviderOrderForPaymentAttempt = async (
  paymentId: bigint,
) => {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) {
    throw new AppError(404, "Payment not found", "PAYMENT_NOT_FOUND");
  }

  return ensureRazorpayProviderOrderForPaymentRecord(payment);
};

export const createPaymentForOrder = async (
  userId: string,
  orderId: bigint,
  idempotencyKey: string,
  body: CreatePaymentAttemptBody,
) => {
  const payment = await createPendingPaymentAttemptForOrder(
    userId,
    orderId,
    idempotencyKey,
    body,
  );

  return ensureRazorpayProviderOrderForPaymentRecord(payment);
};

export const confirmPaymentAttempt = async (
  paymentId: bigint,
  body: ConfirmPaymentBody,
) => {
  return prisma.$transaction(async (tx) => {
    const payment = await findPaymentByIdWithOrder(tx, paymentId);
    if (!payment) {
      throw new AppError(404, "Payment not found", "PAYMENT_NOT_FOUND");
    }

    if (
      payment.paymentStatus === PAYMENT_STATUS.SUCCESS ||
      payment.paymentStatus === PAYMENT_STATUS.FAILED
    ) {
      if (
        (body.providerEventId && !payment.providerEventId) ||
        (body.providerPaymentId && !payment.providerPaymentId) ||
        (body.providerOrderId && !payment.providerOrderId) ||
        (body.gatewayTransactionId && !payment.gatewayTransactionId)
      ) {
        return updatePayment(tx, payment.id, {
          providerEventId: body.providerEventId ?? undefined,
          providerPaymentId: body.providerPaymentId ?? undefined,
          providerOrderId: body.providerOrderId ?? undefined,
          gatewayTransactionId: body.gatewayTransactionId ?? undefined,
          providerSignature: body.providerSignature ?? undefined,
        });
      }
      return payment;
    }

    if (body.status === "FAILED") {
      return updatePayment(tx, payment.id, {
        paymentStatus: PAYMENT_STATUS.FAILED,
        failureReason: body.failureReason ?? null,
        providerEventId: body.providerEventId ?? null,
        providerPaymentId: body.providerPaymentId ?? undefined,
        providerOrderId: body.providerOrderId ?? undefined,
      });
    }

    const existingSuccess = await findSuccessfulPaymentForOrder(
      tx,
      payment.orderId,
    );
    if (existingSuccess && existingSuccess.id !== payment.id) {
      return payment;
    }

    const grand = grandTotalCents(payment.order);
    const paidSoFar = toCents(payment.order.totalPaid);
    const outstanding = grand - paidSoFar;
    if (outstanding <= 0) {
      return payment;
    }

    const paymentAmount = toCents(payment.amount);
    if (paymentAmount > outstanding) {
      throw new AppError(
        409,
        "Payment attempt amount exceeds current outstanding amount",
        "STALE_PAYMENT_ATTEMPT",
      );
    }

    const now = new Date();
    const updatedPayment = await updatePayment(tx, payment.id, {
      paymentStatus: PAYMENT_STATUS.SUCCESS,
      paidAt: now,
      gatewayTransactionId: body.gatewayTransactionId,
      providerEventId: body.providerEventId ?? null,
      providerPaymentId:
        body.providerPaymentId ?? body.gatewayTransactionId ?? undefined,
      providerOrderId: body.providerOrderId ?? undefined,
      providerSignature: body.providerSignature ?? undefined,
      failureReason: null,
    });

    const nextTotalPaid = paidSoFar + paymentAmount;
    const fullyPaid = nextTotalPaid >= grand;

    await updateOrderForPaymentSuccess(tx, payment.orderId, {
      totalPaid: { increment: centsToDecimal(paymentAmount) },
      paymentStatus: fullyPaid
        ? PAYMENT_STATUS.SUCCESS
        : payment.order.paymentStatus,
      orderStatus:
        payment.order.orderStatus === ORDER_STATUS.PLACED
          ? ORDER_STATUS.CONFIRMED
          : payment.order.orderStatus,
    });

    await confirmReservationsByOrder(tx, payment.orderId);

    if (payment.order.orderStatus === ORDER_STATUS.PLACED) {
      await createOrderStatusHistory(tx, {
        order: { connect: { id: payment.orderId } },
        oldStatus: ORDER_STATUS.PLACED,
        newStatus: ORDER_STATUS.CONFIRMED,
        note: "Payment confirmed",
      });
    }

    // ── Commission write ──────────────────────────────────────────────────────
    // Guards:
    //  1. Only when fully paid (partial-payment safety)
    //  2. Only when the order has influencer attribution
    //  3. Race-condition guard: skip if order was cancelled before this webhook
    //     arrived (cancel TX already ran or is running concurrently).
    //     The Serializable isolation means we see a consistent order snapshot;
    //     if cancel committed first, orderStatus will be CANCELLED here.
    if (
      fullyPaid &&
      payment.order.influencerId != null &&
      payment.order.orderStatus !== ORDER_STATUS.CANCELLED
    ) {
      const influencerId = payment.order.influencerId;

      const influencer = await tx.influencer.findUnique({
        where: { id: influencerId },
        select: { commissionRate: true },
      });

      if (influencer) {
        // Keep entirely in Decimal to avoid JS float drift.
        // nextTotalPaid is integer paise; divide by 100 inside Decimal.
        const totalPaidDecimal = new Prisma.Decimal(nextTotalPaid).div(100);
        // commissionRate is stored as percentage (e.g. 10.00 = 10%)
        // commission = totalPaid * (commissionRate / 100), rounded HALF_UP to 2dp
        const commissionAmount = totalPaidDecimal
          .mul(influencer.commissionRate)
          .div(100)
          .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

        try {
          await createInfluencerSale(tx, {
            influencerId,
            orderId: payment.orderId,
            commissionRate: influencer.commissionRate,
            commissionAmount,
          });
          await incrementInfluencerEarnings(tx, influencerId, commissionAmount);

          logger.info(
            {
              orderId: payment.orderId.toString(),
              influencerId: influencerId.toString(),
              commissionAmount: commissionAmount.toString(),
              commissionRate: influencer.commissionRate.toString(),
            },
            "[commission] created",
          );
        } catch (commissionError) {
          if (
            commissionError instanceof Prisma.PrismaClientKnownRequestError &&
            commissionError.code === "P2002"
          ) {
            // UNIQUE(order_id) violation = payment webhook retry.
            // Commission was already recorded on the first delivery — safe skip.
            logger.info(
              { orderId: payment.orderId.toString() },
              "[commission] skipped — duplicate (P2002 idempotent retry)",
            );
          } else {
            throw commissionError;
          }
        }
      } else {
        // Influencer row deleted between order creation and payment — skip silently.
        logger.warn(
          {
            orderId: payment.orderId.toString(),
            influencerId: influencerId.toString(),
          },
          "[commission] skipped — influencer record not found",
        );
      }
    } else if (
      fullyPaid &&
      payment.order.influencerId != null &&
      payment.order.orderStatus === ORDER_STATUS.CANCELLED
    ) {
      // Race: cancel beat this webhook — commission intentionally suppressed.
      logger.info(
        { orderId: payment.orderId.toString() },
        "[commission] skipped — order already cancelled",
      );
    }

    // ── Invoice creation ──────────────────────────────────────────────────────
    // Only when fully paid AND order is not cancelled.
    // Idempotent: UNIQUE(order_id) + pre-check inside createInvoiceInTx.
    if (fullyPaid && payment.order.orderStatus !== ORDER_STATUS.CANCELLED) {
      // Fetch order items (not included in payment.order by default)
      const orderItems = await tx.orderItem.findMany({
        where: { orderId: payment.orderId },
        select: {
          productName: true,
          variantName: true,
          sku: true,
          quantity: true,
          priceAtPurchase: true,
          lineTotal: true,
          basePrice: true,
          taxAmount: true,
          gstRate: true,
        },
      });

      const orderWithItems = {
        ...payment.order,
        totalPaid: centsToDecimal(nextTotalPaid),
        items: orderItems,
      };

      try {
        const invoice = await createInvoiceInTx(tx, orderWithItems, {
          paidAt: now,
        });

        // PDF generation runs AFTER TX commits — fire & forget.
        // setImmediate defers execution until after the current TX callback returns.
        setImmediate(() => {
          generateInvoicePdf(invoice.id).catch((pdfErr) => {
            logger.error(
              { invoiceId: invoice.id.toString(), err: pdfErr },
              "[invoice-pdf] async generation failed — will retry",
            );
          });
        });
      } catch (invoiceError) {
        if (
          invoiceError instanceof Prisma.PrismaClientKnownRequestError &&
          invoiceError.code === "P2002"
        ) {
          // UNIQUE(order_id) violation = webhook retry.
          logger.info(
            { orderId: payment.orderId.toString() },
            "[invoice] skipped — duplicate (P2002 idempotent retry)",
          );
        } else {
          // Invoice failure should NOT fail the payment TX.
          // Log and continue — invoice can be regenerated manually.
          logger.error(
            { orderId: payment.orderId.toString(), err: invoiceError },
            "[invoice] creation failed — payment still succeeds",
          );
        }
      }
    }

    return updatedPayment;
  }, TX_OPTIONS);
};

export const verifyRazorpayPaymentAttempt = async (
  userId: string,
  paymentId: bigint,
  body: RazorpayVerifyBody,
) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: true },
  });

  if (!payment || payment.order.userId.toString() !== userId) {
    throw new AppError(404, "Payment not found", "PAYMENT_NOT_FOUND");
  }

  if (!payment.providerOrderId) {
    throw new AppError(
      409,
      "Payment attempt is not linked with provider order",
      "PROVIDER_ORDER_MISSING",
    );
  }

  if (payment.providerOrderId !== body.razorpayOrderId) {
    throw new AppError(
      409,
      "Razorpay order mismatch for payment attempt",
      "RAZORPAY_ORDER_MISMATCH",
    );
  }

  const isValidSignature = verifyRazorpayCheckoutSignature({
    razorpayOrderId: body.razorpayOrderId,
    razorpayPaymentId: body.razorpayPaymentId,
    razorpaySignature: body.razorpaySignature,
  });

  if (!isValidSignature) {
    throw new AppError(
      401,
      "Invalid Razorpay signature",
      "INVALID_RAZORPAY_SIGNATURE",
    );
  }

  return confirmPaymentAttempt(paymentId, {
    status: "SUCCESS",
    gatewayTransactionId: body.razorpayPaymentId,
    providerPaymentId: body.razorpayPaymentId,
    providerOrderId: body.razorpayOrderId,
    providerSignature: body.razorpaySignature,
  });
};

export const processRazorpayWebhookEvent = async (
  rawBody: Buffer,
  signature: string,
  providerEventIdHeader?: string,
) => {
  const isSignatureValid = verifyRazorpayWebhookSignature(rawBody, signature);
  if (!isSignatureValid) {
    throw new AppError(
      401,
      "Invalid Razorpay webhook signature",
      "INVALID_WEBHOOK_SIGNATURE",
    );
  }

  let payload: {
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string;
          status?: string;
          error_description?: string;
        };
      };
    };
  };

  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    throw new AppError(
      400,
      "Invalid webhook payload",
      "INVALID_WEBHOOK_PAYLOAD",
    );
  }

  const event = payload.event ?? "";
  const paymentEntity = payload.payload?.payment?.entity;
  const providerPaymentId = paymentEntity?.id;
  const providerOrderId = paymentEntity?.order_id;

  if (!providerPaymentId && !providerOrderId) {
    return { acknowledged: true, reason: "NO_PAYMENT_REFERENCE" as const };
  }

  const providerEventId =
    providerEventIdHeader ??
    `${event}:${providerPaymentId ?? "unknown"}:${providerOrderId ?? "unknown"}`;

  const existingByEvent = await prisma.$transaction(
    (tx) => findPaymentByProviderEventId(tx, providerEventId),
    TX_OPTIONS,
  );
  if (existingByEvent) {
    return { acknowledged: true, deduped: true as const };
  }

  const payment = await prisma.$transaction(async (tx) => {
    if (providerPaymentId) {
      const foundByProviderPaymentId = await findPaymentByProviderPaymentId(
        tx,
        providerPaymentId,
      );
      if (foundByProviderPaymentId) {
        return foundByProviderPaymentId;
      }
    }

    if (providerOrderId) {
      return findPaymentByProviderOrderId(tx, providerOrderId);
    }

    return null;
  }, TX_OPTIONS);

  if (!payment) {
    return { acknowledged: true, reason: "PAYMENT_ATTEMPT_NOT_FOUND" as const };
  }

  const isFailedEvent =
    event === "payment.failed" || paymentEntity?.status === "failed";
  const isSuccessEvent =
    event === "payment.captured" ||
    paymentEntity?.status === "captured" ||
    event === "order.paid";

  if (!isFailedEvent && !isSuccessEvent) {
    return { acknowledged: true, reason: "IGNORED_EVENT" as const };
  }

  try {
    await confirmPaymentAttempt(payment.id, {
      status: isFailedEvent ? "FAILED" : "SUCCESS",
      gatewayTransactionId: isFailedEvent ? undefined : providerPaymentId,
      providerEventId,
      providerPaymentId,
      providerOrderId,
      failureReason: isFailedEvent
        ? paymentEntity?.error_description
        : undefined,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { acknowledged: true, deduped: true as const };
    }
    throw error;
  }

  return { acknowledged: true };
};
