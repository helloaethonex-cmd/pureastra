import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors/app-error";
import {
  CreateInfluencerInput,
  ListInfluencersInput,
  ListSalesInput,
  ListPayoutsInput,
  UpdateInfluencerStatusInput,
  UpdateCommissionRateInput,
  UpdateDashboardAccessInput,
  UpdateSaleStatusInput,
  RecordPayoutInput,
  UpdatePayoutStatusInput,
  LinkUserInput,
  AnalyticsQueryInput,
  DashboardQueryInput,
  INFLUENCER_SALE_STATUS,
  buildDateFilter,
} from "./influencers.types";
import {
  createInfluencer,
  findAllInfluencers,
  findInfluencerById,
  findInfluencerByReferralCode,
  findInfluencerByUserId,
  findInfluencerWithSaleStats,
  findInfluencerSalesAggregates,
  findSalesForInfluencer,
  findTopInfluencersByEarnings,
  findTopInfluencersByEarningsInRange,
  getSalesAggregatesByStatus,
  getTotalInfluencedOrderValue,
  getInfluencerCountsByStatus,
  linkInfluencerToUser,
  updateInfluencerCommissionRate,
  updateInfluencerDashboardAccess,
  updateInfluencerStatus,
  updateInfluencerSaleStatus,
  findInfluencerSaleByOrderId,
  createPayout,
  findPayoutById,
  findPayoutsForInfluencer,
  updatePayoutStatus,
  decrementInfluencerEarningsSafe,
} from "./influencers.repository";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const serializeInfluencer = (inf: {
  id: bigint;
  name: string;
  email: string;
  referralCode: string;
  commissionRate: Prisma.Decimal;
  totalEarnings: Prisma.Decimal;
  canViewDashboard: boolean;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}) => ({
  id: inf.id.toString(),
  name: inf.name,
  email: inf.email,
  referralCode: inf.referralCode,
  commissionRate: inf.commissionRate.toString(),
  totalEarnings: inf.totalEarnings.toString(),
  canViewDashboard: inf.canViewDashboard,
  status: inf.status,
  ...(inf.createdAt && { createdAt: inf.createdAt.toISOString() }),
  ...(inf.updatedAt && { updatedAt: inf.updatedAt.toISOString() }),
});

const serializeSale = (sale: {
  id: bigint;
  orderId: bigint;
  commissionRate: Prisma.Decimal;
  commissionAmount: Prisma.Decimal;
  status: string;
  createdAt: Date;
  order?: { orderNumber: string; totalPaid: Prisma.Decimal };
}) => ({
  id: sale.id.toString(),
  orderId: sale.orderId.toString(),
  commissionRate: sale.commissionRate.toString(),
  commissionAmount: sale.commissionAmount.toString(),
  status: sale.status,
  createdAt: sale.createdAt.toISOString(),
  ...(sale.order && {
    order: {
      orderNumber: sale.order.orderNumber,
      totalPaid: sale.order.totalPaid.toString(),
    },
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Influencer CRUD
// ─────────────────────────────────────────────────────────────────────────────

export const adminCreateInfluencer = async (input: CreateInfluencerInput) => {
  const influencer = await prisma.$transaction(async (tx) => {
    // Verify target user exists and attach userId to influencer if present
    const user = await tx.user.findUnique({ where: { email: input.email }, select: { id: true } });
    if (!user) {
      throw new AppError(404, "User does not exist", "USER_NOT_FOUND");
    }

    return createInfluencer(tx, {
      name: input.name,
      email: input.email,
      referralCode: input.referralCode.toUpperCase(),
      commissionRate: new Prisma.Decimal(input.commissionRate.toFixed(2)),
      userId: user.id,
    });
  });

  return serializeInfluencer(influencer);
};

export const adminListInfluencers = async (input: ListInfluencersInput) => {
  const { influencers, total } = await findAllInfluencers(
    prisma,
    { status: input.status as any },
    { page: input.page, limit: input.limit, sortOrder: input.sortOrder },
  );

  return {
    data: influencers.map(serializeInfluencer),
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.ceil(total / input.limit),
    },
  };
};

export const adminGetInfluencer = async (influencerId: string) => {
  const influencer = await findInfluencerWithSaleStats(
    prisma,
    BigInt(influencerId),
  );

  if (!influencer) {
    throw new AppError(404, "Influencer not found", "INFLUENCER_NOT_FOUND");
  }

  return {
    ...serializeInfluencer(influencer),
    _count: influencer._count,
  };
};

export const adminUpdateInfluencerStatus = async (
  influencerId: string,
  input: UpdateInfluencerStatusInput,
) => {
  const exists = await findInfluencerById(prisma, BigInt(influencerId));
  if (!exists) {
    throw new AppError(404, "Influencer not found", "INFLUENCER_NOT_FOUND");
  }

  const updated = await updateInfluencerStatus(
    prisma,
    BigInt(influencerId),
    input.status as any,
  );

  return serializeInfluencer(updated);
};

export const adminUpdateCommissionRate = async (
  influencerId: string,
  input: UpdateCommissionRateInput,
) => {
  const exists = await findInfluencerById(prisma, BigInt(influencerId));
  if (!exists) {
    throw new AppError(404, "Influencer not found", "INFLUENCER_NOT_FOUND");
  }

  const updated = await updateInfluencerCommissionRate(
    prisma,
    BigInt(influencerId),
    new Prisma.Decimal(input.commissionRate.toFixed(2)),
  );

  return serializeInfluencer(updated);
};

export const adminUpdateDashboardAccess = async (
  influencerId: string,
  input: UpdateDashboardAccessInput,
) => {
  const exists = await findInfluencerById(prisma, BigInt(influencerId));
  if (!exists) {
    throw new AppError(404, "Influencer not found", "INFLUENCER_NOT_FOUND");
  }

  const updated = await updateInfluencerDashboardAccess(
    prisma,
    BigInt(influencerId),
    input.canViewDashboard,
  );

  return serializeInfluencer(updated);
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Sales
// ─────────────────────────────────────────────────────────────────────────────

export const adminListSalesForInfluencer = async (
  influencerId: string,
  input: ListSalesInput,
) => {
  const exists = await findInfluencerById(prisma, BigInt(influencerId));
  if (!exists) {
    throw new AppError(404, "Influencer not found", "INFLUENCER_NOT_FOUND");
  }

  const dateFilter = buildDateFilter(input.startDate, input.endDate);

  const { sales, total } = await findSalesForInfluencer(
    prisma,
    BigInt(influencerId),
    { status: input.status as any, dateFilter },
    { page: input.page, limit: input.limit },
  );

  return {
    data: sales.map(serializeSale),
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.ceil(total / input.limit),
    },
  };
};

export const adminUpdateSaleStatus = async (
  saleId: string,
  input: UpdateSaleStatusInput,
) => {
  const sale = await prisma.influencerSale.findUnique({
    where: { id: BigInt(saleId) },
    select: { id: true, status: true, influencerId: true, commissionAmount: true },
  });

  if (!sale) {
    throw new AppError(404, "Influencer sale not found", "SALE_NOT_FOUND");
  }

  // Can only approve PENDING or cancel PENDING/APPROVED
  const canApprove = input.status === "APPROVED" && sale.status === "PENDING";
  const canCancel =
    input.status === "CANCELLED" &&
    (sale.status === "PENDING" || sale.status === "APPROVED");

  if (!canApprove && !canCancel) {
    throw new AppError(
      400,
      `Cannot transition sale from ${sale.status} to ${input.status}`,
      "INVALID_SALE_STATUS_TRANSITION",
    );
  }

  return prisma.$transaction(async (tx) => {
    const updated = await updateInfluencerSaleStatus(
      tx,
      sale.id,
      input.status as any,
    );

    // If cancelling an active sale, decrement total_earnings
    if (input.status === "CANCELLED") {
      await decrementInfluencerEarningsSafe(
        tx,
        sale.influencerId,
        sale.commissionAmount,
      );
    }

    return {
      id: updated.id.toString(),
      status: updated.status,
    };
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Payouts
// ─────────────────────────────────────────────────────────────────────────────

export const adminRecordPayout = async (
  influencerId: string,
  input: RecordPayoutInput,
) => {
  const exists = await findInfluencerById(prisma, BigInt(influencerId));
  if (!exists) {
    throw new AppError(404, "Influencer not found", "INFLUENCER_NOT_FOUND");
  }

  const payout = await prisma.$transaction(async (tx) => {
    const influencerIdBigInt = BigInt(influencerId);
    const payoutAmount = new Prisma.Decimal(input.amount.toFixed(2));

    const [approvedSales, completedPayouts] = await Promise.all([
      tx.influencerSale.aggregate({
        where: {
          influencerId: influencerIdBigInt,
          status: "APPROVED",
        },
        _sum: { commissionAmount: true },
      }),
      tx.influencerPayout.aggregate({
        where: {
          influencerId: influencerIdBigInt,
          status: "COMPLETED",
        },
        _sum: { amount: true },
      }),
    ]);

    const approvedAmount = approvedSales._sum.commissionAmount ?? new Prisma.Decimal(0);
    const completedAmount = completedPayouts._sum.amount ?? new Prisma.Decimal(0);
    const payable = approvedAmount.sub(completedAmount);

    if (!payoutAmount.eq(payable)) {
      throw new AppError(
        400,
        "Partial payouts not supported yet",
        "PARTIAL_PAYOUT_NOT_SUPPORTED",
      );
    }

    return createPayout(tx, {
      influencerId: influencerIdBigInt,
      amount: payoutAmount,
      referenceNote: input.referenceNote,
    });
  });

  return {
    id: payout.id.toString(),
    influencerId: payout.influencerId.toString(),
    amount: payout.amount.toString(),
    status: payout.status,
    referenceNote: payout.referenceNote,
    createdAt: payout.createdAt.toISOString(),
  };
};

export const adminListPayoutsForInfluencer = async (
  influencerId: string,
  input: ListPayoutsInput,
) => {
  const exists = await findInfluencerById(prisma, BigInt(influencerId));
  if (!exists) {
    throw new AppError(404, "Influencer not found", "INFLUENCER_NOT_FOUND");
  }

  const { payouts, total } = await findPayoutsForInfluencer(
    prisma,
    BigInt(influencerId),
    { page: input.page, limit: input.limit },
  );

  return {
    data: payouts.map((p) => ({
      id: p.id.toString(),
      amount: p.amount.toString(),
      status: p.status,
      referenceNote: p.referenceNote,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.ceil(total / input.limit),
    },
  };
};

export const adminUpdatePayoutStatus = async (
  payoutId: string,
  input: UpdatePayoutStatusInput,
) => {
  const updated = await prisma.$transaction(async (tx) => {
    const payout = await findPayoutById(tx, BigInt(payoutId));
    if (!payout) {
      throw new AppError(404, "Payout not found", "PAYOUT_NOT_FOUND");
    }

    if (payout.status !== "INITIATED") {
      throw new AppError(
        400,
        `Cannot update payout that is already ${payout.status}`,
        "PAYOUT_ALREADY_SETTLED",
      );
    }

    const next = await updatePayoutStatus(tx, BigInt(payoutId), {
      status: input.status,
      referenceNote: input.referenceNote,
    });

    if (input.status === "COMPLETED") {
      await tx.influencerSale.updateMany({
        where: {
          influencerId: payout.influencerId,
          status: "APPROVED",
        },
        data: {
          status: "PAID",
        },
      });
    }

    return next;
  });

  return {
    id: updated.id.toString(),
    status: updated.status,
    referenceNote: updated.referenceNote,
    updatedAt: updated.updatedAt.toISOString(),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC — Validate referral code
// ─────────────────────────────────────────────────────────────────────────────

export const validateReferralCode = async (code: string) => {
  const influencer = await findInfluencerByReferralCode(prisma, code.toUpperCase());

  if (!influencer || influencer.status !== "ACTIVE") {
    return { valid: false };
  }

  return {
    valid: true,
    name: influencer.name,
    referralCode: influencer.referralCode,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// INFLUENCER DASHBOARD (user-facing)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves the influencer from the authenticated userId and returns
 * the full dashboard payload.
 * When a date filter is applied, earnings.total is computed from
 * the filtered aggregates rather than the all-time denormalized counter.
 */
export const getInfluencerDashboard = async (
  userId: string,
  query: DashboardQueryInput,
) => {
  const influencer = await findInfluencerByUserId(prisma, BigInt(userId));

  if (!influencer) {
    throw new AppError(
      404,
      "No influencer account linked to this user",
      "INFLUENCER_NOT_FOUND",
    );
  }

  if (!influencer.canViewDashboard) {
    throw new AppError(
      403,
      "Dashboard access is not enabled for this account",
      "DASHBOARD_ACCESS_DENIED",
    );
  }

  const dateFilter = buildDateFilter(query.startDate, query.endDate);
  const isFiltered = dateFilter !== undefined;

  // 2 parallel queries — no N+1
  const [aggregates, recentSales] = await Promise.all([
    findInfluencerSalesAggregates(prisma, influencer.id, dateFilter),
    prisma.influencerSale.findMany({
      where: {
        influencerId: influencer.id,
        ...(dateFilter && { createdAt: dateFilter }),
      },
      select: {
        id: true,
        orderId: true,
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
      take: 10,
    }),
  ]);

  // Build earnings and order counts from groupBy.
  // All buckets initialised to zero — handles influencer with 0 sales.
  const ZERO = new Prisma.Decimal(0);
  const earnings = { pending: ZERO, approved: ZERO, paid: ZERO };
  const counts = { total: 0, pending: 0, approved: 0, paid: 0, cancelled: 0 };
  let computedTotal = ZERO;

  for (const row of aggregates) {
    const amount = row._sum.commissionAmount ?? ZERO;
    const count = row._count.id;
    counts.total += count;

    switch (row.status) {
      case "PENDING":
        earnings.pending = amount;
        counts.pending = count;
        computedTotal = computedTotal.add(amount);
        break;
      case "APPROVED":
        earnings.approved = amount;
        counts.approved = count;
        computedTotal = computedTotal.add(amount);
        break;
      case "PAID":
        earnings.paid = amount;
        counts.paid = count;
        computedTotal = computedTotal.add(amount);
        break;
      case "CANCELLED":
        counts.cancelled = count;
        break;
    }
  }

  return {
    influencer: {
      id: influencer.id.toString(),
      name: influencer.name,
      referralCode: influencer.referralCode,
      commissionRate: influencer.commissionRate.toString(),
      status: influencer.status,
    },
    dateFilter: {
      startDate: query.startDate ?? null,
      endDate: query.endDate ?? null,
    },
    earnings: {
      // No date filter: use all-time denormalized counter (O(1), atomic).
      // Date filter: computed from the filtered groupBy (cannot use counter).
      total: isFiltered
        ? computedTotal.toString()
        : influencer.totalEarnings.toString(),
      pending: earnings.pending.toString(),
      approved: earnings.approved.toString(),
      paid: earnings.paid.toString(),
    },
    orders: {
      total: counts.total,
      pending: counts.pending,
      approved: counts.approved,
      paid: counts.paid,
      cancelled: counts.cancelled,
    },
    recentSales: recentSales.map((s) => ({
      id: s.id.toString(),
      orderId: s.orderId.toString(),
      orderNumber: s.order.orderNumber,
      commissionAmount: s.commissionAmount.toString(),
      status: s.status,
      orderTotal: s.order.totalPaid.toString(),
      createdAt: s.createdAt.toISOString(),
    })),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

export const getAdminAnalytics = async (input: AnalyticsQueryInput) => {
  const dateFilter = buildDateFilter(input.startDate, input.endDate);

  // Top influencers: use denormalized counter (fast) when no date filter,
  // switch to range-aware groupBy when date filter is present.
  const topInfluencersResult = dateFilter
    ? await findTopInfluencersByEarningsInRange(prisma, input.topLimit, dateFilter)
    : await findTopInfluencersByEarnings(prisma, input.topLimit);

  // Remaining 3 queries run in parallel
  const [influencedRevenue, commissionByStatus, influencerCounts] =
    await Promise.all([
      getTotalInfluencedOrderValue(prisma, dateFilter),
      getSalesAggregatesByStatus(prisma, dateFilter),
      getInfluencerCountsByStatus(prisma),   // status counts are always all-time
    ]);

  // Commission aggregates from groupBy
  const ZERO = new Prisma.Decimal(0);
  const commission = {
    issued: ZERO,   // PENDING + APPROVED + PAID (anything not CANCELLED)
    paid: ZERO,
    pending: ZERO,
    approved: ZERO,
  };

  for (const row of commissionByStatus) {
    const amount = row._sum.commissionAmount ?? ZERO;
    switch (row.status) {
      case "PAID":
        commission.paid = amount;
        commission.issued = commission.issued.add(amount);
        break;
      case "PENDING":
        commission.pending = amount;
        commission.issued = commission.issued.add(amount);
        break;
      case "APPROVED":
        commission.approved = amount;
        commission.issued = commission.issued.add(amount);
        break;
      // CANCELLED excluded from issued total
    }
  }

  // Influencer status counts
  const infCounts = { total: 0, active: 0, paused: 0, banned: 0 };
  for (const row of influencerCounts) {
    const c = row._count.id;
    infCounts.total += c;
    if (row.status === "ACTIVE") infCounts.active = c;
    else if (row.status === "PAUSED") infCounts.paused = c;
    else if (row.status === "BANNED") infCounts.banned = c;
  }

  return {
    revenue: {
      totalInfluencedOrderValue: (influencedRevenue._sum.totalPaid ?? ZERO).toString(),
      totalCommissionIssued: commission.issued.toString(),
      totalCommissionPaid: commission.paid.toString(),
      totalCommissionPending: commission.pending.toString(),
      totalCommissionApproved: commission.approved.toString(),
    },
    influencers: infCounts,
    dateFilter: {
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
    },
    topInfluencers: topInfluencersResult.map((inf) => ({
      id: inf.id.toString(),
      name: inf.name,
      referralCode: inf.referralCode,
      totalEarnings: (inf.totalEarnings ?? new Prisma.Decimal(0)).toString(),
      status: inf.status,
      totalOrders: inf._count.sales,
    })),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Link influencer to a User account
// ─────────────────────────────────────────────────────────────────────────────

export const adminLinkInfluencerUser = async (
  influencerId: string,
  input: LinkUserInput,
) => {
  const exists = await findInfluencerById(prisma, BigInt(influencerId));
  if (!exists) {
    throw new AppError(404, "Influencer not found", "INFLUENCER_NOT_FOUND");
  }

  // Verify the target user exists
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, email: true, name: true },
  });
  if (!user) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }

  // linkInfluencerToUser will throw P2002 if userId is already taken by another influencer
  const updated = await linkInfluencerToUser(
    prisma,
    BigInt(influencerId),
    input.userId,
  );

  return {
    id: updated.id.toString(),
    name: updated.name,
    email: updated.email,
    userId: updated.userId?.toString() ?? null,
  };
};


export {
  findActiveInfluencerByCode,
  createInfluencerSale,
  incrementInfluencerEarnings,
  decrementInfluencerEarningsSafe,
  findInfluencerSaleByOrderId,
  updateInfluencerSaleStatus,
} from "./influencers.repository";
