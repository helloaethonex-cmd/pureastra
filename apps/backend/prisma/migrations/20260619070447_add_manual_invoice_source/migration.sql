-- CreateEnum
CREATE TYPE "InvoiceSource" AS ENUM ('PLATFORM', 'MANUAL');

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_order_id_fkey";

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "source" "InvoiceSource" NOT NULL DEFAULT 'PLATFORM',
ALTER COLUMN "order_id" DROP NOT NULL,
ALTER COLUMN "customer_phone" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
