import { Prisma } from "../../generated/prisma/client";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors/app-error";
import { logger } from "../../lib/logger";
import { computeOrderTotalsFromInclusivePricing } from "../../utils/gst";
import {
  CART_STATUS,
  CreateOrderInput,
  INVENTORY_RESERVATION_STATUS,
  ORDER_STATUS,
  PAYMENT_STATUS,
  STATUS_TRANSITIONS,
} from "./orders.types";
import {
  createInventoryReservations,
  createOrder,
  createOrderItems,
  createOrderStatusHistory,
  decrementVariantStockQuantityBulkStrict,
  decrementVariantStockReservedSafeBulk,
  expireReservationsAndReturnRows,
  findActiveCartByUserId,
  findAddressByIdForUser,
  findExpiredReservationsBatch,
  findInventoryReservationsByOrderId,
  findOrderById,
  findOrderByOrderNumber,
  findOrderByOrderNumberForUser,
  findOrdersForAdmin,
  findOrdersByUserId,
  incrementOrderNumberSequence,
  incrementVariantStockReservedBulk,
  markCartCheckedOut,
  TxClient,
  updateInventoryReservationStatusByOrder,
  updateOrderStatus,
} from "./orders.repository";
import {
  findActiveInfluencerByCode,
  findInfluencerSaleByOrderId,
  updateInfluencerSaleStatus,
  decrementInfluencerEarningsSafe,
} from "../influencers/influencers.repository";
import { INFLUENCER_SALE_STATUS } from "../influencers/influencers.types";
import { enqueueEmail } from "../../jobs/email/email.queue";
import { renderEmailTemplate } from "../../lib/email/render";

const TX_OPTIONS = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  maxWait: 5000,
  timeout: 10000,
} as const;

const ZERO_DECIMAL = new Prisma.Decimal(0);
const SHIPPING_AMOUNT_INCLUSIVE = new Prisma.Decimal(
  env.FLAT_SHIPPING_CHARGE_INCLUSIVE,
);
const DISCOUNT_AMOUNT_INCLUSIVE = new Prisma.Decimal(0);

const formatOrderNumber = (year: number, sequence: number) =>
  `PA-${year}-${String(sequence).padStart(6, "0")}`;

const groupQuantityByVariant = <
  T extends {
    productVariantId: bigint;
    quantity: number;
  },
>(
  rows: T[],
) => {
  const grouped = new Map<
    string,
    { productVariantId: bigint; quantity: number }
  >();
  for (const row of rows) {
    const key = row.productVariantId.toString();
    const existing = grouped.get(key);
    if (existing) {
      existing.quantity += row.quantity;
    } else {
      grouped.set(key, {
        productVariantId: row.productVariantId,
        quantity: row.quantity,
      });
    }
  }
  return [...grouped.values()];
};

const buildPreparedItems = (
  cartItems: Array<{
    productVariantId: bigint;
    quantity: number;
    priceSnapshot: Prisma.Decimal | null;
    productVariant: {
      id: bigint;
      variantName: string | null;
      sku: string | null;
      price: Prisma.Decimal | null;
      gstRate: Prisma.Decimal;
      costPrice: Prisma.Decimal | null;
      stockQuantity: number | null;
      stockReserved: number;
      product: { name: string };
    };
  }>,
) => {
  return cartItems.map((item) => {
    const variant = item.productVariant;
    const available = (variant.stockQuantity ?? 0) - variant.stockReserved;

    if (available < item.quantity) {
      throw new AppError(
        409,
        `Insufficient stock for variant ${variant.id.toString()}`,
        "INSUFFICIENT_STOCK",
      );
    }

    const unitPrice = item.priceSnapshot ?? variant.price;
    if (!unitPrice || unitPrice.lte(ZERO_DECIMAL)) {
      throw new AppError(
        400,
        `Invalid price for variant ${variant.id.toString()}`,
        "INVALID_PRICE",
      );
    }

    return {
      productVariantId: item.productVariantId,
      quantity: item.quantity,
      productName: variant.product.name,
      variantName: variant.variantName ?? null,
      sku: variant.sku ?? null,
      unitPrice,
      gstRate: variant.gstRate,
      costPrice: variant.costPrice ?? ZERO_DECIMAL,
    };
  });
};

const createOrderInTx = async (
  tx: TxClient,
  userId: bigint,
  input: CreateOrderInput,
) => {
  const now = new Date();
  const year = now.getFullYear();

  const cart = await findActiveCartByUserId(tx, userId);
  if (!cart || cart.items.length === 0) {
    throw new AppError(400, "Active cart is empty", "CART_EMPTY");
  }

  const address = await findAddressByIdForUser(tx, input.addressId, userId);
  if (!address) {
    throw new AppError(400, "Invalid address", "ADDRESS_INVALID");
  }

  // ── Referral attribution (silent fail — never blocks order) ──────────────
  let influencerId: bigint | undefined;
  let referralCode: string | undefined;
  let influencerCommissionRate: Prisma.Decimal | undefined;
  if (input.referralCode) {
    const influencer = await findActiveInfluencerByCode(
      tx,
      input.referralCode.toUpperCase(),
    );
    if (influencer) {
      influencerId = influencer.id;
      referralCode = influencer.referralCode;
      influencerCommissionRate = influencer.commissionRate;
    }
  }

  const preparedItems = buildPreparedItems(cart.items);
  const shippingGstRate = new Prisma.Decimal(env.SHIPPING_GST_RATE);
  const pricing = computeOrderTotalsFromInclusivePricing(
    preparedItems.map((item) => ({
      quantity: item.quantity,
      unitInclusivePrice: item.unitPrice,
      gstRate: item.gstRate,
    })),
    DISCOUNT_AMOUNT_INCLUSIVE,
    SHIPPING_AMOUNT_INCLUSIVE,
    shippingGstRate,
  );

  const sequence = await incrementOrderNumberSequence(tx, year);

  const order = await createOrder(tx, {
    user: { connect: { id: userId } },
    orderNumber: formatOrderNumber(year, sequence.lastValue),

    shippingName: address.fullName,
    shippingPhone: address.phone,
    shippingLine1: address.line1,
    shippingLine2: address.line2,
    shippingCity: address.city,
    shippingState: address.state,
    shippingPostalCode: address.postalCode,
    shippingCountry: address.country,

    productTotal: pricing.productBaseAmount,
    shippingAmount: pricing.shippingBaseAmount,
    taxAmount: pricing.taxAmount,
    discountAmount: pricing.discountApplied,
    totalPaid: ZERO_DECIMAL,

    orderStatus: ORDER_STATUS.PLACED,
    paymentStatus: PAYMENT_STATUS.PENDING,
    placedAt: now,

    // Attach influencer attribution if a valid active code was provided
    ...(influencerId && {
      influencer: { connect: { id: influencerId } },
      referralCode,
    }),
  });

  if (influencerId && influencerCommissionRate) {
    await tx.$executeRaw(
      Prisma.sql`
        UPDATE "orders"
        SET "influencer_commission_rate" = ${influencerCommissionRate}
        WHERE "id" = ${order.id}
      `,
    );
  }

  await createOrderItems(
    tx,
    preparedItems.map((item, index) => {
      const linePricing = pricing.lines[index];
      return {
        orderId: order.id,
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        productName: item.productName,
        variantName: item.variantName,
        sku: item.sku,
        priceAtPurchase: linePricing.unitInclusivePrice,
        lineTotal: linePricing.lineInclusiveAfterDiscount,
        discountAmount: linePricing.discountShare,
        basePrice: linePricing.unitBasePrice,
        taxAmount: linePricing.lineTaxAmount,
        gstRate: linePricing.gstRate,
        costPriceAtPurchase: item.costPrice,
      };
    }),
  );

  const expiresAt = new Date(
    now.getTime() + env.ORDER_RESERVATION_TTL_MINUTES * 60 * 1000,
  );
  await createInventoryReservations(
    tx,
    preparedItems.map((item) => ({
      productVariantId: item.productVariantId,
      orderId: order.id,
      cartId: cart.id,
      quantity: item.quantity,
      status: INVENTORY_RESERVATION_STATUS.ACTIVE,
      expiresAt,
    })),
  );

  const reservedByVariant = groupQuantityByVariant(preparedItems);
  await incrementVariantStockReservedBulk(tx, reservedByVariant);

  await createOrderStatusHistory(tx, {
    order: { connect: { id: order.id } },
    oldStatus: null,
    newStatus: ORDER_STATUS.PLACED,
    changedBy: userId,
    note: input.note ?? "Order placed",
  });

  await markCartCheckedOut(tx, cart.id);

  return findOrderById(tx, order.id);
};

export const placeOrder = async (userId: string, input: CreateOrderInput) => {
  return prisma.$transaction(
    async (tx) => createOrderInTx(tx, BigInt(userId), input),
    TX_OPTIONS,
  );
};

const releaseExpiredReservationsInTx = async (
  tx: TxClient,
  batchSize: number,
) => {
  const reservations = await findExpiredReservationsBatch(
    tx,
    INVENTORY_RESERVATION_STATUS.ACTIVE,
    new Date(),
    batchSize,
  );

  if (reservations.length === 0) return 0;

  const expiredRows = await expireReservationsAndReturnRows(
    tx,
    reservations.map((r) => r.id),
    INVENTORY_RESERVATION_STATUS.ACTIVE,
    INVENTORY_RESERVATION_STATUS.EXPIRED,
  );

  if (expiredRows.length === 0) return 0;

  const decrementByVariant = groupQuantityByVariant(
    expiredRows.map((row) => ({
      productVariantId: row.product_variant_id,
      quantity: row.quantity,
    })),
  );

  await decrementVariantStockReservedSafeBulk(tx, decrementByVariant);

  // Cancel any PLACED orders whose reservations all expired in this batch.
  // Uses `none` filter so orders with still-active reservations (multi-item,
  // staggered TTLs) are left alone until their remaining reservations expire.
  const uniqueOrderIds = [
    ...new Set(reservations.map((r) => r.orderId).filter((id): id is bigint => id !== null)),
  ];
  await tx.order.updateMany({
    where: {
      id: { in: uniqueOrderIds },
      orderStatus: ORDER_STATUS.PLACED,
      inventoryReservations: { none: { status: INVENTORY_RESERVATION_STATUS.ACTIVE } },
    },
    data: { orderStatus: ORDER_STATUS.CANCELLED },
  });

  return expiredRows.length;
};

export const expireInventoryReservations = async () => {
  let releasedTotal = 0;
  let processedBatches = 0;

  while (processedBatches < env.ORDER_RESERVATION_RELEASE_MAX_BATCHES) {
    processedBatches += 1;

    const releasedInBatch = await prisma.$transaction(
      async (tx) =>
        releaseExpiredReservationsInTx(
          tx,
          env.ORDER_RESERVATION_RELEASE_BATCH_SIZE,
        ),
      TX_OPTIONS,
    );

    releasedTotal += releasedInBatch;
    if (releasedInBatch === 0) break;
  }

  return releasedTotal;
};

const isValidStatusTransition = (
  currentStatus: number,
  newStatus: number,
): boolean => {
  const allowedStatuses = STATUS_TRANSITIONS[currentStatus] ?? [];
  return allowedStatuses.includes(newStatus);
};

const updateOrderStatusInTx = async (
  tx: TxClient,
  orderNumber: string,
  newStatus: number,
  adminUserId: bigint,
  note?: string,
) => {
  const order = await findOrderByOrderNumber(tx, orderNumber);
  if (!order) {
    throw new AppError(404, "Order not found", "ORDER_NOT_FOUND");
  }

  const currentStatus = order.orderStatus;

  if (currentStatus === newStatus) {
    throw new AppError(400, "Order already in this status", "STATUS_UNCHANGED");
  }

  if (!isValidStatusTransition(currentStatus, newStatus)) {
    throw new AppError(
      400,
      `Invalid status transition from ${currentStatus} to ${newStatus}`,
      "INVALID_STATUS_TRANSITION",
    );
  }

  if (
    newStatus === ORDER_STATUS.CANCELLED &&
    currentStatus >= ORDER_STATUS.SHIPPED
  ) {
    throw new AppError(
      400,
      "Cannot cancel order after shipping",
      "CANNOT_CANCEL_SHIPPED_ORDER",
    );
  }

  await updateOrderStatus(tx, order.id, newStatus);

  await createOrderStatusHistory(tx, {
    order: { connect: { id: order.id } },
    oldStatus: currentStatus,
    newStatus,
    changedBy: adminUserId,
    note: note ?? null,
  });

  if (newStatus === ORDER_STATUS.SHIPPED) {
    const reservations = await findInventoryReservationsByOrderId(tx, order.id);
    const reservableReservations = reservations.filter(
      (r) =>
        r.status === INVENTORY_RESERVATION_STATUS.ACTIVE ||
        r.status === INVENTORY_RESERVATION_STATUS.CONFIRMED,
    );

    const variantQuantities = groupQuantityByVariant(
      reservableReservations.map((r) => ({
        productVariantId: r.productVariantId,
        quantity: r.quantity,
      })),
    );

    const updatedRows = await decrementVariantStockQuantityBulkStrict(
      tx,
      variantQuantities,
    );
    if (updatedRows.length !== variantQuantities.length) {
      throw new AppError(
        409,
        "Insufficient stock for one or more variants",
        "INSUFFICIENT_STOCK",
      );
    }

    await decrementVariantStockReservedSafeBulk(tx, variantQuantities);

    await updateInventoryReservationStatusByOrder(
      tx,
      order.id,
      INVENTORY_RESERVATION_STATUS.ACTIVE,
      INVENTORY_RESERVATION_STATUS.CONFIRMED,
    );
  }

  if (
    newStatus === ORDER_STATUS.CANCELLED &&
    currentStatus < ORDER_STATUS.SHIPPED
  ) {
    const reservations = await findInventoryReservationsByOrderId(tx, order.id);
    const releasableReservations = reservations.filter(
      (r) =>
        r.status === INVENTORY_RESERVATION_STATUS.ACTIVE ||
        r.status === INVENTORY_RESERVATION_STATUS.CONFIRMED,
    );

    const variantQuantities = groupQuantityByVariant(
      releasableReservations.map((r) => ({
        productVariantId: r.productVariantId,
        quantity: r.quantity,
      })),
    );

    await decrementVariantStockReservedSafeBulk(tx, variantQuantities);

    await updateInventoryReservationStatusByOrder(
      tx,
      order.id,
      [
        INVENTORY_RESERVATION_STATUS.ACTIVE,
        INVENTORY_RESERVATION_STATUS.CONFIRMED,
      ],
      INVENTORY_RESERVATION_STATUS.RELEASED,
    );

    // ── Commission cancellation ─────────────────────────────────────────────
    // Only cancel if the sale exists and is still in a cancellable state.
    // The status check is the double-cancel guard: if a previous cancel call
    // already moved the sale to CANCELLED, this block is a no-op.
    const influencerSale = await findInfluencerSaleByOrderId(tx, order.id);
    if (
      influencerSale &&
      (influencerSale.status === INFLUENCER_SALE_STATUS.PENDING ||
        influencerSale.status === INFLUENCER_SALE_STATUS.APPROVED)
    ) {
      await updateInfluencerSaleStatus(tx, influencerSale.id, "CANCELLED");
      await decrementInfluencerEarningsSafe(
        tx,
        influencerSale.influencerId,
        influencerSale.commissionAmount,
      );
      logger.info(
        {
          orderId: order.id.toString(),
          saleId: influencerSale.id.toString(),
          influencerId: influencerSale.influencerId.toString(),
          commissionAmount: influencerSale.commissionAmount.toString(),
        },
        "[commission] cancelled — order cancelled",
      );
    } else if (influencerSale) {
      // Sale exists but is already CANCELLED/PAID/REFUNDED — double-cancel guard fired.
      logger.debug(
        {
          orderId: order.id.toString(),
          saleStatus: influencerSale.status,
        },
        "[commission] cancel skipped — sale already in terminal status",
      );
    }
  }

  return findOrderByOrderNumber(tx, orderNumber);
};

export const updateOrderStatusByOrderNumber = async (
  orderNumber: string,
  adminUserId: string,
  input: { newStatus: number; note?: string },
) => {
  const updatedOrder = await prisma.$transaction(
    async (tx) =>
      updateOrderStatusInTx(
        tx,
        orderNumber,
        input.newStatus,
        BigInt(adminUserId),
        input.note,
      ),
    TX_OPTIONS,
  );

  const recipientEmail = updatedOrder?.user?.email ?? null;

  if (recipientEmail && input.newStatus === ORDER_STATUS.SHIPPED) {
    const order = updatedOrder!;
    setImmediate(() => {
      void (async () => {
        const html = await renderEmailTemplate("order-shipped", {
          customerName: order.shippingName,
          orderNumber: order.orderNumber,
          shippedAt: new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          shippingAddress: {
            name: order.shippingName,
            line1: order.shippingLine1,
            line2: order.shippingLine2 ?? null,
            city: order.shippingCity,
            state: order.shippingState,
            postalCode: order.shippingPostalCode,
            country: order.shippingCountry,
          },
          items: order.items.map((i) => ({
            productName: i.productName,
            variantName: i.variantName ?? null,
            quantity: i.quantity,
          })),
          trackingUrl: null,
        });
        await enqueueEmail({
          to: recipientEmail,
          subject: `Your PureAstra order ${order.orderNumber} has shipped`,
          html,
          meta: { template: "order-shipped", source: "orders.service" },
        });
      })().catch((err) =>
        logger.error({ orderNumber, err }, "[email] order-shipped enqueue failed"),
      );
    });
  }

  if (input.newStatus === ORDER_STATUS.DELIVERED) {
    // TODO: enqueue feedback-request email once the Feedback module lands.
    // Create a Feedback row (with signed token) in updateOrderStatusInTx when
    // newStatus === DELIVERED, then pass feedbackUrl to renderEmailTemplate here.
  }

  return updatedOrder;
};

export const listOrdersForAdmin = async (input: {
  page: number;
  limit: number;
  orderStatus?: number;
  paymentStatus?: number;
  search?: string;
  sortOrder: "asc" | "desc";
}) => {
  const { orders, total } = await findOrdersForAdmin(
    prisma,
    {
      orderStatus: input.orderStatus,
      paymentStatus: input.paymentStatus,
      search: input.search,
    },
    {
      page: input.page,
      limit: input.limit,
      sortOrder: input.sortOrder,
    },
  );

  return {
    data: orders.map((order) => ({
      id: order.id.toString(),
      orderNumber: order.orderNumber,
      userId: order.userId.toString(),
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      totalPaid: order.totalPaid.toString(),
      createdAt: order.createdAt.toISOString(),
    })),
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.ceil(total / input.limit),
    },
  };
};

export const listOrdersForUser = async (
  userId: string,
  input: { page: number; limit: number },
) => {
  const { orders, total } = await findOrdersByUserId(
    prisma,
    BigInt(userId),
    input,
  );

  return {
    data: orders.map((order) => ({
      id: order.id.toString(),
      orderNumber: order.orderNumber,
      totalPaid: order.totalPaid.toString(),
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt.toISOString(),
    })),
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.ceil(total / input.limit),
    },
  };
};

export const getOrderDetailForUser = async (
  userId: string,
  orderNumber: string,
) => {
  const order = await findOrderByOrderNumberForUser(
    prisma,
    orderNumber,
    BigInt(userId),
  );

  if (!order) {
    throw new AppError(404, "Order not found", "ORDER_NOT_FOUND");
  }

  return {
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    productTotal: order.productTotal.toString(),
    shippingAmount: order.shippingAmount.toString(),
    taxAmount: order.taxAmount.toString(),
    discountAmount: order.discountAmount.toString(),
    totalPaid: order.totalPaid.toString(),
    shippingAddress: {
      name: order.shippingName,
      phone: order.shippingPhone,
      line1: order.shippingLine1,
      line2: order.shippingLine2,
      city: order.shippingCity,
      state: order.shippingState,
      postalCode: order.shippingPostalCode,
      country: order.shippingCountry,
    },
    placedAt: order.placedAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      productName: item.productName,
      variantName: item.variantName,
      sku: item.sku,
      quantity: item.quantity,
      price: item.priceAtPurchase.toString(),
    })),
    payments: order.payments.map((payment) => ({
      amount: payment.amount.toString(),
      status: payment.paymentStatus,
      method: payment.paymentMethod,
      createdAt: payment.createdAt.toISOString(),
    })),
    statusHistory: order.statusHistory.map((history) => ({
      oldStatus: history.oldStatus,
      newStatus: history.newStatus,
      note: history.note,
      createdAt: history.createdAt.toISOString(),
    })),
  };
};
