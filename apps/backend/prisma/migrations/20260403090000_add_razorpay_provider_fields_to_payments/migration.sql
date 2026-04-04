-- AlterTable
ALTER TABLE "payments"
ADD COLUMN "provider_order_id" VARCHAR(255),
ADD COLUMN "provider_payment_id" VARCHAR(255),
ADD COLUMN "provider_signature" TEXT;

-- CreateIndex
CREATE INDEX "payments_provider_order_id_idx" ON "payments"("provider_order_id");

-- CreateIndex
CREATE INDEX "payments_provider_payment_id_idx" ON "payments"("provider_payment_id");
