-- Per-variant low-stock threshold for admin warnings and inventory alerts.
ALTER TABLE "product_variants"
  ADD COLUMN IF NOT EXISTS "low_stock_threshold" INTEGER NOT NULL DEFAULT 5;

ALTER TABLE "product_variants"
  ADD CONSTRAINT "product_variants_low_stock_threshold_nonnegative_chk"
    CHECK ("low_stock_threshold" >= 0) NOT VALID;

