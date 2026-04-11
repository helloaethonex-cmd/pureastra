import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// INFLUENCER SALE STATUS CONSTANTS
// Mirror the Prisma InfluencerSaleStatus enum values as string literals
// ─────────────────────────────────────────────────────────────────────────────

export const INFLUENCER_SALE_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  PAID: "PAID",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
} as const;

export type InfluencerSaleStatus =
  (typeof INFLUENCER_SALE_STATUS)[keyof typeof INFLUENCER_SALE_STATUS];

export const INFLUENCER_STATUS = {
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  BANNED: "BANNED",
} as const;

export type InfluencerStatus =
  (typeof INFLUENCER_STATUS)[keyof typeof INFLUENCER_STATUS];

export const INFLUENCER_PAYOUT_STATUS = {
  INITIATED: "INITIATED",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;

export const PAYOUT_METHOD = {
  UPI: "UPI",
  BANK: "BANK",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// DATE RANGE — reusable schema for all analytics / filter endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * z.string().date() enforces YYYY-MM-DD format (Zod v3.22+).
 * The refinement ensures startDate <= endDate when both are provided.
 * UTC boundary expansion (00:00:00 / 23:59:59.999) happens in buildDateFilter.
 */
export const dateRangeSchema = z
  .object({
    startDate: z.string().date("startDate must be YYYY-MM-DD").optional(),
    endDate: z.string().date("endDate must be YYYY-MM-DD").optional(),
  })
  .refine(
    (d) => {
      if (d.startDate && d.endDate)
        return new Date(d.startDate) <= new Date(d.endDate);
      return true;
    },
    { message: "startDate must be ≤ endDate", path: ["startDate"] },
  );

export type DateRangeInput = z.infer<typeof dateRangeSchema>;

/**
 * Converts validated YYYY-MM-DD strings to UTC Date boundaries
 * suitable for Prisma createdAt gte/lte filters.
 */
export const buildDateFilter = (
  startDate?: string,
  endDate?: string,
): { gte?: Date; lte?: Date } | undefined => {
  if (!startDate && !endDate) return undefined;
  return {
    ...(startDate && { gte: new Date(`${startDate}T00:00:00.000Z`) }),
    ...(endDate   && { lte: new Date(`${endDate}T23:59:59.999Z`) }),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Create Influencer
// ─────────────────────────────────────────────────────────────────────────────

export const createInfluencerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  referralCode: z
    .string()
    .trim()
    .min(2)
    .max(30)
    .regex(/^[A-Za-z0-9_-]+$/, "Only alphanumeric, underscore and hyphen allowed"),
  // Stored as percentage: 10.00 = 10%
  commissionRate: z.number().min(0).max(100),
});

export type CreateInfluencerInput = z.infer<typeof createInfluencerSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — List Influencers
// ─────────────────────────────────────────────────────────────────────────────

export const listInfluencersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["ACTIVE", "PAUSED", "BANNED"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ListInfluencersInput = z.infer<typeof listInfluencersSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Update Status
// ─────────────────────────────────────────────────────────────────────────────

export const updateInfluencerStatusSchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED", "BANNED"]),
});

export type UpdateInfluencerStatusInput = z.infer<
  typeof updateInfluencerStatusSchema
>;

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Update Commission Rate
// ─────────────────────────────────────────────────────────────────────────────

export const updateCommissionRateSchema = z.object({
  commissionRate: z.number().min(0).max(100),
});

export type UpdateCommissionRateInput = z.infer<
  typeof updateCommissionRateSchema
>;

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Toggle Dashboard Access
// ─────────────────────────────────────────────────────────────────────────────

export const updateDashboardAccessSchema = z.object({
  canViewDashboard: z.boolean(),
});

export type UpdateDashboardAccessInput = z.infer<
  typeof updateDashboardAccessSchema
>;

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — List Sales for Influencer
// ─────────────────────────────────────────────────────────────────────────────

export const listSalesSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z
      .enum(["PENDING", "APPROVED", "PAID", "CANCELLED", "REFUNDED"])
      .optional(),
    startDate: z.string().date("startDate must be YYYY-MM-DD").optional(),
    endDate: z.string().date("endDate must be YYYY-MM-DD").optional(),
  })
  .refine(
    (d) => {
      if (d.startDate && d.endDate)
        return new Date(d.startDate) <= new Date(d.endDate);
      return true;
    },
    { message: "startDate must be ≤ endDate", path: ["startDate"] },
  );

export type ListSalesInput = z.infer<typeof listSalesSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Update Sale Status
// ─────────────────────────────────────────────────────────────────────────────

export const updateSaleStatusSchema = z.object({
  status: z.enum(["APPROVED", "CANCELLED"]),
});

export type UpdateSaleStatusInput = z.infer<typeof updateSaleStatusSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Record Payout
// ─────────────────────────────────────────────────────────────────────────────

export const recordPayoutSchema = z.object({
  amount: z.number().positive(),
  referenceNote: z.string().trim().max(500).optional(),
});

export type RecordPayoutInput = z.infer<typeof recordPayoutSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Update Payout Status
// ─────────────────────────────────────────────────────────────────────────────

export const updatePayoutStatusSchema = z.object({
  status: z.enum(["COMPLETED", "FAILED"]),
  referenceNote: z.string().trim().max(500).optional(),
});

export type UpdatePayoutStatusInput = z.infer<typeof updatePayoutStatusSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC — Validate referral code (query param)
// ─────────────────────────────────────────────────────────────────────────────

export const validateRefSchema = z.object({
  code: z.string().trim().min(1).max(30),
});

export type ValidateRefInput = z.infer<typeof validateRefSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — List Payouts
// ─────────────────────────────────────────────────────────────────────────────

export const listPayoutsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListPayoutsInput = z.infer<typeof listPayoutsSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Link influencer to a User account
// ─────────────────────────────────────────────────────────────────────────────

export const linkUserSchema = z.object({
  userId: z.coerce.bigint().positive(),
});

export type LinkUserInput = z.infer<typeof linkUserSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Analytics query params
// ─────────────────────────────────────────────────────────────────────────────

export const analyticsQuerySchema = z
  .object({
    topLimit: z.coerce.number().int().min(1).max(50).default(10),
    startDate: z.string().date("startDate must be YYYY-MM-DD").optional(),
    endDate: z.string().date("endDate must be YYYY-MM-DD").optional(),
  })
  .refine(
    (d) => {
      if (d.startDate && d.endDate)
        return new Date(d.startDate) <= new Date(d.endDate);
      return true;
    },
    { message: "startDate must be ≤ endDate", path: ["startDate"] },
  );

export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;

// ─────────────────────────────────────────────────────────────────────────────
// INFLUENCER DASHBOARD — query params
// ─────────────────────────────────────────────────────────────────────────────

export const dashboardQuerySchema = z
  .object({
    startDate: z.string().date("startDate must be YYYY-MM-DD").optional(),
    endDate: z.string().date("endDate must be YYYY-MM-DD").optional(),
  })
  .refine(
    (d) => {
      if (d.startDate && d.endDate)
        return new Date(d.startDate) <= new Date(d.endDate);
      return true;
    },
    { message: "startDate must be ≤ endDate", path: ["startDate"] },
  );

export type DashboardQueryInput = z.infer<typeof dashboardQuerySchema>;
