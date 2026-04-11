-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "pdf_status" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "invoices_created_at_idx" ON "invoices"("created_at");
