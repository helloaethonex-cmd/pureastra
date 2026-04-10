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

export const listSalesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum(["PENDING", "APPROVED", "PAID", "CANCELLED", "REFUNDED"])
    .optional(),
});

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
