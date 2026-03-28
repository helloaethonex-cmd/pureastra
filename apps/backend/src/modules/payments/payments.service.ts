import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors/app-error";
import {
  ConfirmPaymentBody,
  CreatePaymentAttemptBody,
} from "./payments.types";
import {
  confirmReservationsByOrder,
  createOrderStatusHistory,
  createPaymentAttempt,
  findOrderForUser,
  findPaymentAttemptByOrderAndIdempotencyKey,
  findPaymentByIdWithOrder,
  findSuccessfulPaymentForOrder,
  updateOrderForPaymentSuccess,
  updatePayment,
} from "./payments.repository";
import {
  INVENTORY_RESERVATION_STATUS,
  ORDER_STATUS,
  PAYMENT_STATUS,
} from "../orders/orders.types";

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

export const createPaymentForOrder = async (
  userId: string,
  orderId: bigint,
  idempotencyKey: string,
  body: CreatePaymentAttemptBody,
) => {
  return prisma.$transaction(async (tx) => {
    const order = await findOrderForUser(tx, orderId, BigInt(userId));
    if (!order) {
      throw new AppError(404, "Order not found", "ORDER_NOT_FOUND");
    }

    if (order.orderStatus === ORDER_STATUS.CANCELLED) {
      throw new AppError(409, "Cannot create payment for cancelled order", "ORDER_CANCELLED");
    }

    const existingByIdempotency = await findPaymentAttemptByOrderAndIdempotencyKey(
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
      throw new AppError(409, "Order is already fully paid", "ORDER_ALREADY_PAID");
    }

    return createPaymentAttempt(tx, {
      order: { connect: { id: order.id } },
      paymentProvider: body.paymentProvider,
      paymentMethod: body.paymentMethod ?? null,
      paymentIntentId: body.providerIntentRef ?? null,
      idempotencyKey,
      amount: centsToDecimal(outstanding),
      paymentStatus: PAYMENT_STATUS.PENDING,
    });
  }, TX_OPTIONS);
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
      return payment;
    }

    if (body.status === "FAILED") {
      return updatePayment(tx, payment.id, {
        paymentStatus: PAYMENT_STATUS.FAILED,
        failureReason: body.failureReason ?? null,
        providerEventId: body.providerEventId ?? null,
      });
    }

    const existingSuccess = await findSuccessfulPaymentForOrder(tx, payment.orderId);
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
      failureReason: null,
    });

    const nextTotalPaid = paidSoFar + paymentAmount;
    const fullyPaid = nextTotalPaid >= grand;

    await updateOrderForPaymentSuccess(tx, payment.orderId, {
      totalPaid: { increment: centsToDecimal(paymentAmount) },
      paymentStatus: fullyPaid ? PAYMENT_STATUS.SUCCESS : payment.order.paymentStatus,
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

    return updatedPayment;
  }, TX_OPTIONS);
};

