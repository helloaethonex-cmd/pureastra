-- Add optional per-line discount traceability snapshot.
ALTER TABLE "order_items"
  ADD COLUMN IF NOT EXISTS "discount_amount" DECIMAL(10,2);

-- Report performance: issued_at range queries.
CREATE INDEX IF NOT EXISTS "invoices_issued_at_idx" ON "invoices"("issued_at");

-- Backfill historical GST snapshots without overwriting valid values.
-- Uses inclusive-price decomposition with GST rate and quantity.
WITH computed AS (
  SELECT
    oi.id,
    oi.quantity,
    oi.price_at_purchase,
    oi.gst_rate,
    ROUND((oi.price_at_purchase * oi.quantity), 2) AS computed_line_total,
    ROUND((oi.price_at_purchase / (1 + (oi.gst_rate / 100.0))), 2) AS computed_unit_base,
    ROUND((oi.price_at_purchase / (1 + (oi.gst_rate / 100.0))) * oi.quantity, 2) AS computed_base_total,
    ROUND((oi.price_at_purchase * oi.quantity), 2)
      - ROUND((oi.price_at_purchase / (1 + (oi.gst_rate / 100.0))) * oi.quantity, 2) AS computed_tax_total
  FROM "order_items" oi
)
UPDATE "order_items" oi
SET
  "line_total" = CASE
    WHEN oi."line_total" IS NULL OR oi."line_total" <= 0 THEN c.computed_line_total
    ELSE oi."line_total"
  END,
  "base_price" = CASE
    WHEN oi."base_price" IS NULL OR oi."base_price" <= 0 THEN c.computed_unit_base
    ELSE oi."base_price"
  END,
  "tax_amount" = CASE
    WHEN oi."tax_amount" IS NULL OR oi."tax_amount" <= 0 THEN c.computed_tax_total
    ELSE oi."tax_amount"
  END
FROM computed c
WHERE oi.id = c.id
  AND (
    oi."line_total" IS NULL OR oi."line_total" <= 0
    OR oi."base_price" IS NULL OR oi."base_price" <= 0
    OR oi."tax_amount" IS NULL OR oi."tax_amount" <= 0
  );
