-- Add an immutable audit trail for stock lifecycle events.
CREATE TABLE IF NOT EXISTS "inventory_movements" (
  "id" BIGSERIAL PRIMARY KEY,
  "product_variant_id" BIGINT NOT NULL,
  "type" VARCHAR(30) NOT NULL,
  "quantity" INTEGER NOT NULL,
  "before_quantity" INTEGER,
  "after_quantity" INTEGER,
  "reference_type" VARCHAR(50),
  "reference_id" BIGINT,
  "reason" VARCHAR(500),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inventory_movements_product_variant_id_fkey"
    FOREIGN KEY ("product_variant_id")
    REFERENCES "product_variants"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "inventory_movements_product_variant_id_created_at_idx"
  ON "inventory_movements"("product_variant_id", "created_at");

CREATE INDEX IF NOT EXISTS "inventory_movements_type_idx"
  ON "inventory_movements"("type");

CREATE INDEX IF NOT EXISTS "inventory_movements_reference_type_reference_id_idx"
  ON "inventory_movements"("reference_type", "reference_id");

-- Reservation lookup and lifecycle indexes.
CREATE INDEX IF NOT EXISTS "inventory_reservations_order_id_status_idx"
  ON "inventory_reservations"("order_id", "status");

CREATE INDEX IF NOT EXISTS "inventory_reservations_product_variant_id_status_idx"
  ON "inventory_reservations"("product_variant_id", "status");

-- One order should hold at most one reservation bucket per variant.
CREATE UNIQUE INDEX IF NOT EXISTS "inventory_reservations_order_id_product_variant_id_key"
  ON "inventory_reservations"("order_id", "product_variant_id");

-- Stock counters must never drift below zero or reserve more than physical stock.
ALTER TABLE "product_variants"
  ADD COLUMN IF NOT EXISTS "buffer_stock" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "product_variants"
  ADD CONSTRAINT "product_variants_stock_quantity_nonnegative_chk"
    CHECK ("stock_quantity" IS NULL OR "stock_quantity" >= 0) NOT VALID,
  ADD CONSTRAINT "product_variants_stock_reserved_nonnegative_chk"
    CHECK ("stock_reserved" >= 0) NOT VALID,
  ADD CONSTRAINT "product_variants_buffer_stock_nonnegative_chk"
    CHECK ("buffer_stock" >= 0) NOT VALID,
  ADD CONSTRAINT "product_variants_stock_quantity_gte_reserved_chk"
    CHECK ("stock_quantity" IS NULL OR "stock_quantity" >= "stock_reserved" + "buffer_stock") NOT VALID;
