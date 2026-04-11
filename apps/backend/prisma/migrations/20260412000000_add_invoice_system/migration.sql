-- CreateEnum: InvoiceStatus
CREATE TYPE "InvoiceStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateTable: invoice_number_sequences
CREATE TABLE "invoice_number_sequences" (
  "year" INTEGER NOT NULL,
  "last_value" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "invoice_number_sequences_pkey" PRIMARY KEY ("year")
);

-- CreateTable: invoices
CREATE TABLE "invoices" (
  "id" BIGSERIAL NOT NULL,
  "order_id" BIGINT NOT NULL,
  "invoice_number" VARCHAR(30) NOT NULL,
  "status" "InvoiceStatus" NOT NULL DEFAULT 'ACTIVE',
  "issued_at" TIMESTAMP(3) NOT NULL,
  "customer_name" VARCHAR(200) NOT NULL,
  "customer_phone" VARCHAR(20) NOT NULL,
  "customer_address" JSONB NOT NULL,
  "seller_name" VARCHAR(200) NOT NULL,
  "seller_address" VARCHAR(500) NOT NULL,
  "seller_gstin" VARCHAR(20) NOT NULL,
  "seller_state" VARCHAR(100) NOT NULL,
  "product_total" DECIMAL(10,2) NOT NULL,
  "shipping_amount" DECIMAL(10,2) NOT NULL,
  "tax_amount" DECIMAL(10,2) NOT NULL,
  "discount_amount" DECIMAL(10,2) NOT NULL,
  "total_amount" DECIMAL(10,2) NOT NULL,
  "cgst" DECIMAL(10,2),
  "sgst" DECIMAL(10,2),
  "igst" DECIMAL(10,2),
  "pdf_url" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable: invoice_items
CREATE TABLE "invoice_items" (
  "id" BIGSERIAL NOT NULL,
  "invoice_id" BIGINT NOT NULL,
  "product_name" TEXT NOT NULL,
  "variant_name" TEXT,
  "sku" TEXT,
  "quantity" INTEGER NOT NULL,
  "unit_price" DECIMAL(10,2) NOT NULL,
  "total_price" DECIMAL(10,2) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: invoices.order_id (UNIQUE — idempotency guard)
CREATE UNIQUE INDEX "invoices_order_id_key" ON "invoices"("order_id");

-- CreateIndex: invoices.invoice_number (UNIQUE)
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex: invoices.order_id (lookup)
CREATE INDEX "invoices_order_id_idx" ON "invoices"("order_id");

-- CreateIndex: invoice_items.invoice_id
CREATE INDEX "invoice_items_invoice_id_idx" ON "invoice_items"("invoice_id");

-- AddForeignKey: invoices → orders
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: invoice_items → invoices
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey"
  FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
