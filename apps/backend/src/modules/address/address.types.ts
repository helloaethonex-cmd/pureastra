import { z } from "zod";

// ─── Address ──────────────────────────────────────────────────────────────────

export const createAddressSchema = z.object({
  addressType: z.enum(["SHIPPING", "BILLING", "BOTH"]).optional(),
  fullName: z.string().min(1, "Full name is required").max(100),
  phone: z.string().min(1, "Phone is required").max(20),
  line1: z.string().min(1, "Address line 1 is required").max(255),
  line2: z.string().max(255).optional(),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  postalCode: z.string().min(1, "Postal code is required").max(20),
  country: z.string().max(50).default("INDIA"),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
