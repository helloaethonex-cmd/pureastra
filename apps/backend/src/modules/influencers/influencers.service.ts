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
  INFLUENCER_SALE_STATUS,
} from "./influencers.types";
import {
  createInfluencer,
  findAllInfluencers,
  findInfluencerById,
  findInfluencerByReferralCode,
  findInfluencerWithSaleStats,
  findSalesForInfluencer,
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
    return createInfluencer(tx, {
      name: input.name,
      email: input.email,
      referralCode: input.referralCode.toUpperCase(),
      commissionRate: new Prisma.Decimal(input.commissionRate.toFixed(2)),
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

  const { sales, total } = await findSalesForInfluencer(
    prisma,
    BigInt(influencerId),
    { status: input.status as any },
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

  const payout = await createPayout(prisma, {
    influencerId: BigInt(influencerId),
    amount: new Prisma.Decimal(input.amount.toFixed(2)),
    referenceNote: input.referenceNote,
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
  const payout = await findPayoutById(prisma, BigInt(payoutId));
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

  const updated = await updatePayoutStatus(prisma, BigInt(payoutId), {
    status: input.status,
    referenceNote: input.referenceNote,
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
// INTERNAL — Used by orders.service + payments.service
// ─────────────────────────────────────────────────────────────────────────────

export {
  findActiveInfluencerByCode,
  createInfluencerSale,
  incrementInfluencerEarnings,
  decrementInfluencerEarningsSafe,
  findInfluencerSaleByOrderId,
  updateInfluencerSaleStatus,
} from "./influencers.repository";
