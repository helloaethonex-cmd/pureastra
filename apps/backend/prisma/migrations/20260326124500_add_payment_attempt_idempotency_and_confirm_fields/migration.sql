-- AlterTable
ALTER TABLE "payments"
ADD COLUMN "idempotency_key" VARCHAR(100),
ADD COLUMN "provider_event_id" VARCHAR(255),
ADD COLUMN "failure_reason" TEXT;

-- CreateIndex
CREATE INDEX "payments_provider_event_id_idx" ON "payments"("provider_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_order_id_idempotency_key_key"
ON "payments"("order_id", "idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_event_id_key"
ON "payments"("provider_event_id")
WHERE "provider_event_id" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "payments_order_id_single_success_key"
ON "payments"("order_id")
WHERE "payment_status" = 1;
