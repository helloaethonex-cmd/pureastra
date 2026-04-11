-- Add line total snapshot for order items (post-discount, GST-inclusive).
ALTER TABLE "order_items"
  ADD COLUMN "line_total" DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- Add filing-grade GST fields for invoice lines.
ALTER TABLE "invoice_items"
  ADD COLUMN "gst_rate" DECIMAL(5,2) NOT NULL DEFAULT 18.00,
  ADD COLUMN "taxable_value" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN "hsn_code" VARCHAR(20);
