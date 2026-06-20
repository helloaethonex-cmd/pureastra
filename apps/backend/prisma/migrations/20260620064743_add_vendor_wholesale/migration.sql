-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterEnum
ALTER TYPE "InvoiceSource" ADD VALUE 'WHOLESALE';

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "customer_gstin" VARCHAR(20),
ADD COLUMN     "vendor_id" BIGINT;

-- CreateTable
CREATE TABLE "vendors" (
    "id" BIGSERIAL NOT NULL,
    "store_name" VARCHAR(200) NOT NULL,
    "contact_name" VARCHAR(200),
    "contact_phone" VARCHAR(20),
    "contact_email" VARCHAR(255),
    "gstin" VARCHAR(20),
    "address_line1" VARCHAR(255),
    "address_line2" VARCHAR(255),
    "city" VARCHAR(120),
    "state" VARCHAR(120) NOT NULL,
    "postal_code" VARCHAR(20),
    "country" VARCHAR(120) NOT NULL DEFAULT 'India',
    "status" "VendorStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vendors_status_idx" ON "vendors"("status");

-- CreateIndex
CREATE INDEX "vendors_store_name_idx" ON "vendors"("store_name");

-- CreateIndex
CREATE INDEX "invoices_vendor_id_idx" ON "invoices"("vendor_id");

-- CreateIndex
CREATE INDEX "invoices_source_idx" ON "invoices"("source");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
