import { z } from "zod";

export const CHECKOUT_FLOW = {
  CART: "cart",
  BUY_NOW: "buy_now",
} as const;

export type CheckoutFlow = (typeof CHECKOUT_FLOW)[keyof typeof CHECKOUT_FLOW];

export const checkoutPreviewSchema = z.object({
  addressId: z.coerce.bigint(),
  note: z.string().trim().max(500).optional(),
  couponCode: z.string().trim().max(50).optional(),
  referralCode: z.string().trim().max(30).optional(),
});

export type CheckoutPreviewInput = z.infer<typeof checkoutPreviewSchema>;

export const buyNowPreviewSchema = checkoutPreviewSchema.extend({
  productVariantId: z.coerce.bigint(),
  quantity: z.coerce.number().int().positive().max(99),
});

export type BuyNowPreviewInput = z.infer<typeof buyNowPreviewSchema>;

export const checkoutConfirmSchema = z.object({
  previewToken: z.string().trim().min(1),
});

export type CheckoutConfirmInput = z.infer<typeof checkoutConfirmSchema>;

export const checkoutLineItemSchema = z.object({
  productVariantId: z.string(),
  productName: z.string(),
  variantName: z.string().nullable(),
  sku: z.string().nullable(),
  quantity: z.number().int().positive(),
  unitPrice: z.string(),
  lineTotal: z.string(),
});

export type CheckoutLineItem = z.infer<typeof checkoutLineItemSchema>;

export type CheckoutPreviewRecord = {
  version: 1;
  userId: string;
  flowType: CheckoutFlow;
  payloadHash: string;
  expiresAt: number;
  consumedAt: number | null;
  request: {
    addressId: string;
    note: string | null;
    couponCode: string | null;
    referralCode?: string | null;
    productVariantId?: string;
    quantity?: number;
  };
};

