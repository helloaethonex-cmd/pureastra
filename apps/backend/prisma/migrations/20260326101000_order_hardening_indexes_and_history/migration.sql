-- AlterTable
ALTER TABLE "order_status_history"
ALTER COLUMN "old_status" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "inventory_reservations_status_expires_at_idx"
ON "inventory_reservations"("status", "expires_at");
