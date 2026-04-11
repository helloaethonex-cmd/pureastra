import { Prisma, InfluencerStatus, InfluencerSaleStatus } from "../../generated/prisma/client";

export type TxClient = Prisma.TransactionClient;

// ─────────────────────────────────────────────────────────────────────────────
// INFLUENCER QUERIES
// ─────────────────────────────────────────────────────────────────────────────

export const findInfluencerByReferralCode = (
  tx: TxClient,
  referralCode: string,
) => {
  return tx.influencer.findUnique({
    where: { referralCode },
    select: {
      id: true,
      name: true,
      email: true,
      referralCode: true,
      commissionRate: true,
      totalEarnings: true,
      canViewDashboard: true,
      status: true,
    },
  });
};

export const findActiveInfluencerByCode = (
  tx: TxClient,
  referralCode: string,
) => {
  return tx.influencer.findFirst({
    where: {
      referralCode,
      status: "ACTIVE",
    },
    select: {
      id: true,
      commissionRate: true,
      referralCode: true,
    },
  });
};

export const findInfluencerById = (tx: TxClient, id: bigint) => {
  return tx.influencer.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      referralCode: true,
      commissionRate: true,
      totalEarnings: true,
      canViewDashboard: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const findInfluencerWithSaleStats = (tx: TxClient, id: bigint) => {
  return tx.influencer.findUnique({
    where: { id },
    include: {
      _count: {
        select: { sales: true, orders: true },
      },
    },
  });
};

export const createInfluencer = (
  tx: TxClient,
  data: {
    name: string;
    email: string;
    referralCode: string;
    commissionRate: Prisma.Decimal;
  },
) => {
  return tx.influencer.create({
    data: {
      name: data.name,
      email: data.email,
      referralCode: data.referralCode,
      commissionRate: data.commissionRate,
    },
  });
};

export const findAllInfluencers = async (
  tx: TxClient,
  filters: { status?: InfluencerStatus },
  pagination: { page: number; limit: number; sortOrder: "asc" | "desc" },
) => {
  const where: Prisma.InfluencerWhereInput = {};
  if (filters.status) {
    where.status = filters.status;
  }

  const skip = (pagination.page - 1) * pagination.limit;

  const [influencers, total] = await Promise.all([
    tx.influencer.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
        commissionRate: true,
        totalEarnings: true,
        canViewDashboard: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: pagination.sortOrder },
      skip,
      take: pagination.limit,
    }),
    tx.influencer.count({ where }),
  ]);

  return { influencers, total };
};

export const updateInfluencerStatus = (
  tx: TxClient,
  id: bigint,
  status: InfluencerStatus,
) => {
  return tx.influencer.update({
    where: { id },
    data: { status },
  });
};

export const updateInfluencerCommissionRate = (
  tx: TxClient,
  id: bigint,
  commissionRate: Prisma.Decimal,
) => {
  return tx.influencer.update({
    where: { id },
    data: { commissionRate },
  });
};

export const updateInfluencerDashboardAccess = (
  tx: TxClient,
  id: bigint,
  canViewDashboard: boolean,
) => {
  return tx.influencer.update({
    where: { id },
    data: { canViewDashboard },
  });
};

export const findInfluencerByUserId = (
  tx: TxClient,
  userId: bigint,
) => {
  return tx.influencer.findUnique({
    where: { userId },
    select: {
      id: true,
      name: true,
      email: true,
      referralCode: true,
      commissionRate: true,
      totalEarnings: true,
      canViewDashboard: true,
      status: true,
    },
  });
};

export const linkInfluencerToUser = (
  tx: TxClient,
  influencerId: bigint,
  userId: bigint,
) => {
  return tx.influencer.update({
    where: { id: influencerId },
    data: { userId },
    select: {
      id: true,
      name: true,
      email: true,
      userId: true,
    },
  });
};

/**
 * Returns commission amounts grouped by sale status for a single influencer.
 * Used for dashboard earnings breakdown.
 * Single query — no N+1.
 */
export const findInfluencerSalesAggregates = (
  tx: TxClient,
  influencerId: bigint,
  dateFilter?: { gte?: Date; lte?: Date },
) => {
  return tx.influencerSale.groupBy({
    by: ["status"],
    where: {
      influencerId,
      ...(dateFilter && { createdAt: dateFilter }),
    },
    _sum: { commissionAmount: true },
    _count: { id: true },
  });
};

/**
 * Returns top N influencers ordered by total_earnings DESC.
 * Uses the denormalized counter + the DESC index for O(log n) scan.
 * Use this path only when NO date filter is applied.
 */
export const findTopInfluencersByEarnings = (
  tx: TxClient,
  limit: number,
) => {
  return tx.influencer.findMany({
    orderBy: { totalEarnings: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      referralCode: true,
      totalEarnings: true,
      status: true,
      _count: { select: { sales: true } },
    },
  });
};

/**
 * Returns top N influencers by commissions earned within a date range.
 * Cannot use the denormalized totalEarnings counter in this case.
 * Runs a groupBy on influencer_sales then fetches influencer details.
 */
export const findTopInfluencersByEarningsInRange = async (
  tx: TxClient,
  limit: number,
  dateFilter: { gte?: Date; lte?: Date },
) => {
  const groups = await tx.influencerSale.groupBy({
    by: ["influencerId"],
    where: {
      status: { notIn: ["CANCELLED"] },
      createdAt: dateFilter,
    },
    _sum: { commissionAmount: true },
    _count: { id: true },
    orderBy: { _sum: { commissionAmount: "desc" } },
    take: limit,
  });

  if (groups.length === 0) return [];

  const influencerIds = groups.map((g) => g.influencerId);
  const influencers = await tx.influencer.findMany({
    where: { id: { in: influencerIds } },
    select: { id: true, name: true, referralCode: true, status: true },
  });

  // Merge in the order that groupBy returned (already sorted by earnings DESC)
  const infMap = new Map(influencers.map((inf) => [inf.id.toString(), inf]));

  return groups.map((g) => {
    const inf = infMap.get(g.influencerId.toString())!;
    return {
      id: inf.id,
      name: inf.name,
      referralCode: inf.referralCode,
      status: inf.status,
      totalEarnings: g._sum.commissionAmount,   // earnings within range
      _count: { sales: g._count.id },
    };
  });
};

/**
 * Returns platform-wide commission aggregates grouped by status.
 * Used for admin analytics. Single query.
 * dateFilter is optional; omit for all-time aggregates.
 */
export const getSalesAggregatesByStatus = (
  tx: TxClient,
  dateFilter?: { gte?: Date; lte?: Date },
) => {
  return tx.influencerSale.groupBy({
    by: ["status"],
    where: dateFilter ? { createdAt: dateFilter } : undefined,
    _sum: { commissionAmount: true },
    _count: { id: true },
  });
};

/**
 * Sum of totalPaid on all orders that have an influencer attached.
 * dateFilter applied to orders.createdAt.
 */
export const getTotalInfluencedOrderValue = (
  tx: TxClient,
  dateFilter?: { gte?: Date; lte?: Date },
) => {
  return tx.order.aggregate({
    where: {
      influencerId: { not: null },
      ...(dateFilter && { createdAt: dateFilter }),
    },
    _sum: { totalPaid: true },
  });
};

/**
 * Influencer count broken down by status (ACTIVE, PAUSED, BANNED).
 */
export const getInfluencerCountsByStatus = (tx: TxClient) => {
  return tx.influencer.groupBy({
    by: ["status"],
    _count: { id: true },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// INFLUENCER SALE QUERIES
// ─────────────────────────────────────────────────────────────────────────────

export const createInfluencerSale = (
  tx: TxClient,
  data: {
    influencerId: bigint;
    orderId: bigint;
    commissionRate: Prisma.Decimal;
    commissionAmount: Prisma.Decimal;
  },
) => {
  return tx.influencerSale.create({
    data: {
      influencerId: data.influencerId,
      orderId: data.orderId,
      commissionRate: data.commissionRate,
      commissionAmount: data.commissionAmount,
      status: "PENDING",
    },
  });
};

export const incrementInfluencerEarnings = (
  tx: TxClient,
  influencerId: bigint,
  amount: Prisma.Decimal,
) => {
  return tx.influencer.update({
    where: { id: influencerId },
    data: { totalEarnings: { increment: amount } },
  });
};

/**
 * Decrement total_earnings with a floor of 0 to prevent negative balances.
 * Uses a raw query for GREATEST semantics.
 */
export const decrementInfluencerEarningsSafe = (
  tx: TxClient,
  influencerId: bigint,
  amount: Prisma.Decimal,
) => {
  return tx.$executeRaw(
    Prisma.sql`
      UPDATE "influencers"
      SET "total_earnings" = GREATEST("total_earnings" - ${amount}, 0),
          "updated_at" = NOW()
      WHERE "id" = ${influencerId}
    `,
  );
};

export const findInfluencerSaleByOrderId = (tx: TxClient, orderId: bigint) => {
  return tx.influencerSale.findUnique({
    where: { orderId },
    select: {
      id: true,
      influencerId: true,
      commissionAmount: true,
      status: true,
    },
  });
};

export const updateInfluencerSaleStatus = (
  tx: TxClient,
  saleId: bigint,
  status: InfluencerSaleStatus,
) => {
  return tx.influencerSale.update({
    where: { id: saleId },
    data: { status },
  });
};

export const findSalesForInfluencer = async (
  tx: TxClient,
  influencerId: bigint,
  filters: { status?: InfluencerSaleStatus; dateFilter?: { gte?: Date; lte?: Date } },
  pagination: { page: number; limit: number },
) => {
  const where: Prisma.InfluencerSaleWhereInput = { influencerId };
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.dateFilter) {
    where.createdAt = filters.dateFilter;
  }

  const skip = (pagination.page - 1) * pagination.limit;

  const [sales, total] = await Promise.all([
    tx.influencerSale.findMany({
      where,
      select: {
        id: true,
        orderId: true,
        commissionRate: true,
        commissionAmount: true,
        status: true,
        createdAt: true,
        order: {
          select: {
            orderNumber: true,
            totalPaid: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pagination.limit,
    }),
    tx.influencerSale.count({ where }),
  ]);

  return { sales, total };
};

// ─────────────────────────────────────────────────────────────────────────────
// PAYOUT QUERIES
// ─────────────────────────────────────────────────────────────────────────────

export const createPayout = (
  tx: TxClient,
  data: {
    influencerId: bigint;
    amount: Prisma.Decimal;
    referenceNote?: string;
  },
) => {
  return tx.influencerPayout.create({
    data: {
      influencerId: data.influencerId,
      amount: data.amount,
      referenceNote: data.referenceNote ?? null,
      status: "INITIATED",
    },
  });
};

export const findPayoutById = (tx: TxClient, payoutId: bigint) => {
  return tx.influencerPayout.findUnique({
    where: { id: payoutId },
  });
};

export const updatePayoutStatus = (
  tx: TxClient,
  payoutId: bigint,
  data: { status: "COMPLETED" | "FAILED"; referenceNote?: string },
) => {
  return tx.influencerPayout.update({
    where: { id: payoutId },
    data: {
      status: data.status,
      ...(data.referenceNote !== undefined && {
        referenceNote: data.referenceNote,
      }),
    },
  });
};

export const findPayoutsForInfluencer = async (
  tx: TxClient,
  influencerId: bigint,
  pagination: { page: number; limit: number },
) => {
  const skip = (pagination.page - 1) * pagination.limit;

  const [payouts, total] = await Promise.all([
    tx.influencerPayout.findMany({
      where: { influencerId },
      select: {
        id: true,
        amount: true,
        status: true,
        referenceNote: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pagination.limit,
    }),
    tx.influencerPayout.count({ where: { influencerId } }),
  ]);

  return { payouts, total };
};
