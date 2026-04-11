-- Add GST metadata to product variants.
ALTER TABLE "product_variants"
  ADD COLUMN "gst_rate" DECIMAL(5,2) NOT NULL DEFAULT 18.00;

-- Add immutable GST snapshots to order items.
ALTER TABLE "order_items"
  ADD COLUMN "base_price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN "gst_rate" DECIMAL(5,2) NOT NULL DEFAULT 18.00;
