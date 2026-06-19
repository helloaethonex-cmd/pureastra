import { z } from "zod";

const invoiceItemSchema = z.object({
  productName: z.string().min(1).max(200),
  totalPrice: z.number().positive(),
  gstRate: z.number().min(0).max(100),
});

export const createManualInvoiceSchema = z.object({
  invoiceDate: z.string().date("Date must be YYYY-MM-DD"),
  customerName: z.string().min(1).max(200),
  customerPhone: z.string().max(20).optional(),
  customerState: z.string().min(1).max(100),
  isInterstate: z.boolean(),
  items: z.array(invoiceItemSchema).min(1),
});

export const updateManualInvoiceSchema = createManualInvoiceSchema;

export const manualInvoiceListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateManualInvoiceInput = z.infer<typeof createManualInvoiceSchema>;
export type UpdateManualInvoiceInput = z.infer<typeof updateManualInvoiceSchema>;
export type ManualInvoiceListQuery = z.infer<typeof manualInvoiceListQuerySchema>;
