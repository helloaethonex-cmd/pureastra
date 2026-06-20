import { z } from "zod";

// ─── Vendor CRUD ──────────────────────────────────────────────────────────────

export const createVendorSchema = z.object({
  storeName: z.string().min(1).max(200),
  contactName: z.string().max(200).optional(),
  contactPhone: z.string().max(20).optional(),
  contactEmail: z.string().email().max(255).optional().or(z.literal("")),
  gstin: z.string().max(20).optional(),
  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(120).optional(),
  state: z.string().min(1).max(120),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(120).default("India"),
});

export const updateVendorSchema = createVendorSchema.extend({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const vendorListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

// ─── Wholesale invoice creation ───────────────────────────────────────────────

const wholesaleItemSchema = z.object({
  productName: z.string().min(1).max(200),
  quantity: z.number().int().min(1),
  // Wholesale price per unit, GST-inclusive (e.g. 80 = ₹80/unit incl GST)
  unitPrice: z.number().positive(),
  gstRate: z.number().min(0).max(100),
});

export const createWholesaleInvoiceSchema = z.object({
  invoiceDate: z.string().date("Date must be YYYY-MM-DD"),
  items: z.array(wholesaleItemSchema).min(1),
});

// ─── Wholesale invoice list ───────────────────────────────────────────────────

export const wholesaleInvoiceListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  vendorId: z.coerce.bigint().optional(),
});

// ─── Wholesale GST filing report ──────────────────────────────────────────────

export const wholesaleReportQuerySchema = z
  .object({
    from: z.string().date("Date must be YYYY-MM-DD"),
    to: z.string().date("Date must be YYYY-MM-DD"),
  })
  .refine((v) => new Date(v.from) <= new Date(v.to), {
    message: "from must be less than or equal to to",
    path: ["from"],
  });

export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
export type VendorListQuery = z.infer<typeof vendorListQuerySchema>;
export type CreateWholesaleInvoiceInput = z.infer<typeof createWholesaleInvoiceSchema>;
export type WholesaleInvoiceListQuery = z.infer<typeof wholesaleInvoiceListQuerySchema>;
export type WholesaleReportQuery = z.infer<typeof wholesaleReportQuerySchema>;
