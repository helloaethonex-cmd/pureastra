import { Prisma } from "../../generated/prisma/client";

export type TxClient = Prisma.TransactionClient;

const orderCreateInclude = {
  items: true,
  statusHistory: true,
} as const;

export const findActiveCartByUserId = (tx: TxClient, userId: bigint) => {
  return tx.cart.findFirst({
    where: { userId, status: 0 },
    include: {
      items: {
        include: {
          productVariant: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });
};

export const findAddressByIdForUser = (tx: TxClient, addressId: bigint, userId: bigint) => {
  return tx.address.findFirst({
    where: { id: addressId, userId },
  });
};

export const incrementOrderNumberSequence = (tx: TxClient, year: number) => {
  return tx.orderNumberSequence.upsert({
    where: { year },
    create: { year, lastValue: 1 },
    update: { lastValue: { increment: 1 } },
    select: { lastValue: true },
  });
};

export const createOrder = (
  tx: TxClient,
  data: Prisma.OrderCreateInput,
) => {
  return tx.order.create({
    data,
    include: orderCreateInclude,
  });
};

export const createOrderItems = (
  tx: TxClient,
  data: Prisma.OrderItemCreateManyInput[],
) => {
  return tx.orderItem.createMany({ data });
};

export const createInventoryReservations = (
  tx: TxClient,
  data: Prisma.InventoryReservationCreateManyInput[],
) => {
  return tx.inventoryReservation.createMany({ data });
};

export const incrementVariantStockReserved = (
  tx: TxClient,
  productVariantId: bigint,
  quantity: number,
) => {
  return tx.productVariant.update({
    where: { id: productVariantId },
    data: { stockReserved: { increment: quantity } },
  });
};

export const createOrderStatusHistory = (
  tx: TxClient,
  data: Prisma.OrderStatusHistoryCreateInput,
) => {
  return tx.orderStatusHistory.create({ data });
};

export const markCartCheckedOut = (tx: TxClient, cartId: bigint) => {
  return tx.cart.update({
    where: { id: cartId },
    data: { status: 1 },
  });
};

export const findOrderById = (tx: TxClient, orderId: bigint) => {
  return tx.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      statusHistory: true,
    },
  });
};

export const findExpiredReservationsBatch = (
  tx: TxClient,
  activeStatus: number,
  now: Date,
  batchSize: number,
) => {
  return tx.inventoryReservation.findMany({
    where: {
      status: activeStatus,
      expiresAt: { lt: now },
    },
    orderBy: { expiresAt: "asc" },
    take: batchSize,
    select: {
      id: true,
      productVariantId: true,
      quantity: true,
    },
  });
};

export const expireReservationsAndReturnRows = (
  tx: TxClient,
  reservationIds: bigint[],
  activeStatus: number,
  expiredStatus: number,
) => {
  return tx.$queryRaw<Array<{ product_variant_id: bigint; quantity: number }>>(Prisma.sql`
    UPDATE "inventory_reservations"
    SET "status" = ${expiredStatus},
        "updated_at" = NOW()
    WHERE "id" IN (${Prisma.join(reservationIds)})
      AND "status" = ${activeStatus}
    RETURNING "product_variant_id", "quantity"
  `);
};

export const decrementVariantStockReservedSafe = (
  tx: TxClient,
  productVariantId: bigint,
  quantity: number,
) => {
  return tx.productVariant.updateMany({
    where: {
      id: productVariantId,
      stockReserved: { gte: quantity },
    },
    data: {
      stockReserved: { decrement: quantity },
    },
  });
};

