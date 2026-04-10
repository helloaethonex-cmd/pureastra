import { z } from "zod";

// ── Create review (user-facing) ──────────────────────────────────────────────

export const createReviewSchema = z.object({
  productId: z.coerce.bigint(),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(255).transform((v) => v || undefined).optional(),
  comment: z.string().trim().max(5000).transform((v) => v || undefined).optional(),
  metrics: z
    .array(
      z.object({
        metricId: z.coerce.bigint(),
        value: z.number().int(),
      }),
    )
    .max(20)
    .refine(
      (arr) => new Set(arr.map((m) => m.metricId.toString())).size === arr.length,
      { message: "Duplicate metricId values are not allowed" },
    )
    .optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

// ── List reviews query (public) ──────────────────────────────────────────────

export const listReviewsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sortBy: z.enum(["newest", "highest", "lowest"]).default("newest"),
});

export type ListReviewsInput = z.infer<typeof listReviewsSchema>;

// ── Admin: create metric definition ──────────────────────────────────────────

export const createMetricSchema = z.object({
  name: z.string().trim().min(1).max(100),
  icon: z.string().trim().max(50).optional(),
  minValue: z.number().int().default(0),
  maxValue: z.number().int().default(100),
  unit: z.enum(["PERCENT", "RATING"]).default("PERCENT"),
}).refine((d) => d.minValue < d.maxValue, {
  message: "minValue must be less than maxValue",
  path: ["minValue"],
});

export type CreateMetricInput = z.infer<typeof createMetricSchema>;

// ── Admin: assign metric to product ──────────────────────────────────────────

export const assignMetricSchema = z.object({
  metricId: z.coerce.bigint(),
  displayOrder: z.number().int().min(0).default(0),
});

export type AssignMetricInput = z.infer<typeof assignMetricSchema>;

export const addReviewMetricSchema = z.object({
  name: z.string().trim().min(1).max(100),
  icon: z.string().trim().max(50).optional(),
  minValue: z.number().int().default(0),
  maxValue: z.number().int().default(100),
  unit: z.enum(["PERCENT", "RATING"]).default("PERCENT"),
  displayOrder: z.number().int().min(0).default(0),
}).refine((d) => d.minValue < d.maxValue, {
  message: "minValue must be less than maxValue",
  path: ["minValue"],
});

export type AddReviewMetricInput = z.infer<typeof addReviewMetricSchema>;

// ── Admin: approve/reject review ─────────────────────────────────────────────

export const moderateReviewSchema = z.object({
  isApproved: z.boolean(),
});

export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;
