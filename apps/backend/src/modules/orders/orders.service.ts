import { Prisma } from "../../generated/prisma/client";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors/app-error";
import {
  CART_STATUS,
  CreateOrderInput,
  INVENTORY_RESERVATION_STATUS,
  ORDER_STATUS,
  PAYMENT_STATUS,
} from "./orders.types";
import {
  createInventoryReservations,
  createOrder,
  createOrderItems,
  createOrderStatusHistory,
  decrementVariantStockReservedSafe,
  expireReservationsAndReturnRows,
  findActiveCartByUserId,
  findAddressByIdForUser,
  findExpiredReservationsBatch,
  findOrderById,
  incrementOrderNumberSequence,
  incrementVariantStockReserved,
  markCartCheckedOut,
  TxClient,
} from "./orders.repository";

const TX_OPTIONS = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  maxWait: 5000,
  timeout: 10000,
} as const;

const SHIPPING_AMOUNT_CENTS = 0;
const TAX_AMOUNT_CENTS = 0;
const DISCOUNT_AMOUNT_CENTS = 0;

const centsToDecimal = (cents: number) => new Prisma.Decimal((cents / 100).toFixed(2));

const toCents = (value: Prisma.Decimal | number | null | undefined) => {
  if (value === null || value === undefined) return 0;

  const amount = typeof value === "number" ? value : value.toNumber();
  return Math.round(amount * 100);
};

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
  const grouped = new Map<string, { productVariantId: bigint; quantity: number }>();
  for (const row of rows) {
    const key = row.productVariantId.toString();
    const existing = grouped.get(key);
    if (existing) {
      existing.quantity += row.quantity;
    } else {
      grouped.set(key, { productVariantId: row.productVariantId, quantity: row.quantity });
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

    const unitPriceCents = toCents(item.priceSnapshot ?? variant.price);
    if (unitPriceCents <= 0) {
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
      unitPriceCents,
      costPriceCents: toCents(variant.costPrice),
    };
  });
};

const createOrderInTx = async (tx: TxClient, userId: bigint, input: CreateOrderInput) => {
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

  const preparedItems = buildPreparedItems(cart.items);
  const productTotalCents = preparedItems.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0,
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

    productTotal: centsToDecimal(productTotalCents),
    shippingAmount: centsToDecimal(SHIPPING_AMOUNT_CENTS),
    taxAmount: centsToDecimal(TAX_AMOUNT_CENTS),
    discountAmount: centsToDecimal(DISCOUNT_AMOUNT_CENTS),
    totalPaid: centsToDecimal(0),

    orderStatus: ORDER_STATUS.PLACED,
    paymentStatus: PAYMENT_STATUS.PENDING,
    placedAt: now,
  });

  await createOrderItems(
    tx,
    preparedItems.map((item) => ({
      orderId: order.id,
      productVariantId: item.productVariantId,
      quantity: item.quantity,
      productName: item.productName,
      variantName: item.variantName,
      sku: item.sku,
      priceAtPurchase: centsToDecimal(item.unitPriceCents),
      costPriceAtPurchase: centsToDecimal(item.costPriceCents),
    })),
  );

  const expiresAt = new Date(now.getTime() + env.ORDER_RESERVATION_TTL_MINUTES * 60 * 1000);
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
  for (const item of reservedByVariant) {
    await incrementVariantStockReserved(tx, item.productVariantId, item.quantity);
  }

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

const releaseExpiredReservationsInTx = async (tx: TxClient, batchSize: number) => {
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

  for (const row of decrementByVariant) {
    await decrementVariantStockReservedSafe(tx, row.productVariantId, row.quantity);
  }

  return expiredRows.length;
};

export const expireInventoryReservations = async () => {
  let releasedTotal = 0;
  let processedBatches = 0;

  while (processedBatches < env.ORDER_RESERVATION_RELEASE_MAX_BATCHES) {
    processedBatches += 1;

    const releasedInBatch = await prisma.$transaction(
      async (tx) => releaseExpiredReservationsInTx(tx, env.ORDER_RESERVATION_RELEASE_BATCH_SIZE),
      TX_OPTIONS,
    );

    releasedTotal += releasedInBatch;
    if (releasedInBatch === 0) break;
  }

  return releasedTotal;
};

