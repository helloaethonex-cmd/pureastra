import { z } from "zod";

export const addWishlistItemSchema = z.object({
  productVariantId: z.coerce.bigint(),
});

export const wishlistVariantParamsSchema = z.object({
  productVariantId: z.coerce.bigint(),
});

export type AddWishlistItemInput = z.infer<typeof addWishlistItemSchema>;
export type WishlistVariantParams = z.infer<typeof wishlistVariantParamsSchema>;

