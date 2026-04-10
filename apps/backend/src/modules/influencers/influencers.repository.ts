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
  filters: { status?: InfluencerSaleStatus },
  pagination: { page: number; limit: number },
) => {
  const where: Prisma.InfluencerSaleWhereInput = { influencerId };
  if (filters.status) {
    where.status = filters.status;
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
