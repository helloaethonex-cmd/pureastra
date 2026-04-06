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

export const findAddressByIdForUser = (
  tx: TxClient,
  addressId: bigint,
  userId: bigint,
) => {
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

export const createOrder = (tx: TxClient, data: Prisma.OrderCreateInput) => {
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

export const findOrderByOrderNumber = (tx: TxClient, orderNumber: string) => {
  return tx.order.findUnique({
    where: { orderNumber },
    include: {
      items: {
        include: {
          productVariant: true,
        },
      },
      statusHistory: true,
    },
  });
};

export const updateOrderStatus = (
  tx: TxClient,
  orderId: bigint,
  newStatus: number,
) => {
  return tx.order.update({
    where: { id: orderId },
    data: { orderStatus: newStatus },
  });
};

export const decrementVariantStockQuantity = (
  tx: TxClient,
  productVariantId: bigint,
  quantity: number,
) => {
  return tx.productVariant.updateMany({
    where: {
      id: productVariantId,
      stockQuantity: { gte: quantity },
    },
    data: {
      stockQuantity: { decrement: quantity },
    },
  });
};

export const findInventoryReservationsByOrderId = (
  tx: TxClient,
  orderId: bigint,
) => {
  return tx.inventoryReservation.findMany({
    where: { orderId },
    select: {
      id: true,
      productVariantId: true,
      quantity: true,
      status: true,
    },
  });
};

export const updateInventoryReservationStatus = (
  tx: TxClient,
  reservationId: bigint,
  newStatus: number,
) => {
  return tx.inventoryReservation.update({
    where: { id: reservationId },
    data: { status: newStatus },
  });
};

export const updateInventoryReservationStatusByOrder = (
  tx: TxClient,
  orderId: bigint,
  fromStatus: number | number[],
  toStatus: number,
) => {
  return tx.inventoryReservation.updateMany({
    where: {
      orderId,
      status: Array.isArray(fromStatus) ? { in: fromStatus } : fromStatus,
    },
    data: { status: toStatus },
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
  return tx.$queryRaw<
    Array<{ product_variant_id: bigint; quantity: number }>
  >(Prisma.sql`
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

export const decrementVariantStockReservedSafeBulk = (
  tx: TxClient,
  rows: Array<{ productVariantId: bigint; quantity: number }>,
) => {
  if (rows.length === 0) return Promise.resolve();

  return tx.$executeRaw(
    Prisma.sql`
      UPDATE "product_variants" AS pv
      SET "stock_reserved" = GREATEST(pv."stock_reserved" - data."quantity", 0),
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

export const decrementVariantStockQuantityBulkStrict = (
  tx: TxClient,
  rows: Array<{ productVariantId: bigint; quantity: number }>,
) => {
  if (rows.length === 0) {
    return Promise.resolve([] as Array<{ id: bigint }>);
  }

  return tx.$queryRaw<Array<{ id: bigint }>>(
    Prisma.sql`
      UPDATE "product_variants" AS pv
      SET "stock_quantity" = pv."stock_quantity" - data."quantity",
          "updated_at" = NOW()
      FROM (
        VALUES ${Prisma.join(
          rows.map((row) => Prisma.sql`(${row.productVariantId}::bigint, ${row.quantity}::int)`),
        )}
      ) AS data("product_variant_id", "quantity")
      WHERE pv."id" = data."product_variant_id"
        AND pv."stock_quantity" IS NOT NULL
        AND pv."stock_quantity" >= data."quantity"
      RETURNING pv."id"
    `,
  );
};

export type AdminListOrdersFilters = {
  orderStatus?: number;
  paymentStatus?: number;
  search?: string;
};

export type AdminListOrdersPagination = {
  page: number;
  limit: number;
  sortOrder: "asc" | "desc";
};

export const findOrdersForAdmin = async (
  tx: TxClient,
  filters: AdminListOrdersFilters,
  pagination: AdminListOrdersPagination,
) => {
  const where: Record<string, unknown> = {};

  if (filters.orderStatus !== undefined) {
    where.orderStatus = filters.orderStatus;
  }

  if (filters.paymentStatus !== undefined) {
    where.paymentStatus = filters.paymentStatus;
  }

  if (filters.search) {
    where.orderNumber = { contains: filters.search, mode: "insensitive" };
  }

  const skip = (pagination.page - 1) * pagination.limit;

  const [orders, total] = await Promise.all([
    tx.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        userId: true,
        orderStatus: true,
        paymentStatus: true,
        totalPaid: true,
        createdAt: true,
      },
      orderBy: { createdAt: pagination.sortOrder },
      skip,
      take: pagination.limit,
    }),
    tx.order.count({ where }),
  ]);

  return { orders, total };
};

export const findOrdersByUserId = async (
  tx: TxClient,
  userId: bigint,
  pagination: { page: number; limit: number },
) => {
  const skip = (pagination.page - 1) * pagination.limit;

  const [orders, total] = await Promise.all([
    tx.order.findMany({
      where: { userId },
      select: {
        id: true,
        orderNumber: true,
        totalPaid: true,
        orderStatus: true,
        paymentStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pagination.limit,
    }),
    tx.order.count({ where: { userId } }),
  ]);

  return { orders, total };
};

export const findOrderByOrderNumberForUser = (
  tx: TxClient,
  orderNumber: string,
  userId: bigint,
) => {
  return tx.order.findFirst({
    where: { orderNumber, userId },
    include: {
      items: {
        select: {
          id: true,
          productName: true,
          variantName: true,
          sku: true,
          quantity: true,
          priceAtPurchase: true,
        },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          paymentStatus: true,
          paymentMethod: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      statusHistory: {
        select: {
          oldStatus: true,
          newStatus: true,
          note: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
};
