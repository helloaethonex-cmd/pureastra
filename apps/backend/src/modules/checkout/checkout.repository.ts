import { Prisma } from "../../generated/prisma/client";
import { CART_STATUS } from "../orders/orders.types";

export type TxClient = Prisma.TransactionClient;

export const findActiveCartForCheckout = (tx: TxClient, userId: bigint) => {
  return tx.cart.findFirst({
    where: { userId, status: CART_STATUS.ACTIVE },
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

export const findAddressForCheckout = (
  tx: TxClient,
  userId: bigint,
  addressId: bigint,
) => {
  return tx.address.findFirst({
    where: { id: addressId, userId },
  });
};

export const findVariantForBuyNowCheckout = (
  tx: TxClient,
  productVariantId: bigint,
) => {
  return tx.productVariant.findUnique({
    where: { id: productVariantId },
    include: { product: true },
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

export const createOrder = (tx: TxClient, data: Prisma.OrderCreateInput) => {
  return tx.order.create({ data });
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

export const incrementVariantStockReservedBulk = (
  tx: TxClient,
  rows: Array<{ productVariantId: bigint; quantity: number }>,
) => {
  if (rows.length === 0) return Promise.resolve();

  return tx.$executeRaw(
    Prisma.sql`
      UPDATE "product_variants" AS pv
      SET "stock_reserved" = pv."stock_reserved" + data."quantity",
          "updated_at" = NOW()
      FROM (
        VALUES ${Prisma.join(
          rows.map((row) => Prisma.sql`(${row.productVariantId}::bigint, ${row.quantity}::int)`),
        )}
      ) AS data("product_variant_id", "quantity")
      WHERE pv."id" = data."product_variant_id"
    `,
  );
};

export const markCartCheckedOut = (tx: TxClient, cartId: bigint) => {
  return tx.cart.update({
    where: { id: cartId },
    data: { status: CART_STATUS.CHECKED_OUT },
  });
};

export const createOrderStatusHistory = (
  tx: TxClient,
  data: Prisma.OrderStatusHistoryCreateInput,
) => {
  return tx.orderStatusHistory.create({ data });
};

export const createPaymentAttempt = (
  tx: TxClient,
  data: Prisma.PaymentCreateInput,
) => {
  return tx.payment.create({ data });
};

export const findOrderById = (tx: TxClient, orderId: bigint) => {
  return tx.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      orderStatus: true,
      paymentStatus: true,
      totalPaid: true,
      createdAt: true,
    },
  });
};

