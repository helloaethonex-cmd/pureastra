import { z } from "zod";

// ─── Cart Status ───────────────────────────────────────────────────────────────
// 0: ACTIVE | 1: CHECKED_OUT | 2: ABANDONED

// ─── Add / Update Item ────────────────────────────────────────────────────────

export const addCartItemSchema = z.object({
  productVariantId: z.coerce.bigint(),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
});

export const cartItemParamsSchema = z.object({
  itemId: z.coerce.bigint(),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type CartItemParamsInput = z.infer<typeof cartItemParamsSchema>;

// ─── Merge Guest Cart ─────────────────────────────────────────────────────────

export const mergeCartSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
});

export type MergeCartInput = z.infer<typeof mergeCartSchema>;
