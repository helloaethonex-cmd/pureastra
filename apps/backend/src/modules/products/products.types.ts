import { z } from "zod";

// ─── Product Variant ───────────────────────────────────────────────────────────

export const createVariantSchema = z.object({
  variantName: z.string().optional(),
  sku: z.string().optional(),
  price: z.coerce.number().positive().optional(),
  costPrice: z.coerce.number().positive().optional(),
  stockQuantity: z.coerce.number().int().min(0).optional(),
  weight: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
});

export const updateVariantSchema = createVariantSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;

// ─── Product Image ─────────────────────────────────────────────────────────────

export const addProductImageSchema = z.object({
  imageUrl: z.string().url(),
  variantId: z.coerce.bigint().optional(),
  position: z.coerce.number().int().min(0).optional(),
});

export type AddProductImageInput = z.infer<typeof addProductImageSchema>;

// ─── Product ───────────────────────────────────────────────────────────────────

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  brand: z.string().optional(),
  isActive: z.boolean().default(true),
  categoryIds: z.array(z.coerce.bigint()).optional(),
  variants: z.array(createVariantSchema).optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  brand: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// ─── Category ─────────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  parentId: z.coerce.bigint().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// ─── Query / Pagination ────────────────────────────────────────────────────────

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  categoryId: z.coerce.bigint().optional(),
  brand: z.string().optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  sortBy: z
    .enum(["createdAt", "name", "price"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ProductQuery = z.infer<typeof productQuerySchema>;

export const stockAdjustmentSchema = z.object({
  quantity: z.number().int(),
  reason: z.string().optional(),
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
