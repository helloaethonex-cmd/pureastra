/*
  Warnings:

  - You are about to drop the column `buffer_stock` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `low_stock_threshold` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the `inventory_movements` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "inventory_movements" DROP CONSTRAINT "inventory_movements_product_variant_id_fkey";

-- DropIndex
DROP INDEX "inventory_reservations_order_id_product_variant_id_key";

-- DropIndex
DROP INDEX "inventory_reservations_order_id_status_idx";

-- DropIndex
DROP INDEX "inventory_reservations_product_variant_id_status_idx";

-- AlterTable
ALTER TABLE "product_variants" DROP COLUMN "buffer_stock",
DROP COLUMN "low_stock_threshold",
ADD COLUMN     "mrp" DECIMAL(10,2);

-- DropTable
DROP TABLE "inventory_movements";
