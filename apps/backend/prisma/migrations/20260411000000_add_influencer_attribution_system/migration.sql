-- CreateEnum
CREATE TYPE "InfluencerStatus" AS ENUM ('ACTIVE', 'PAUSED', 'BANNED');

-- CreateEnum
CREATE TYPE "InfluencerSaleStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PayoutMethod" AS ENUM ('UPI', 'BANK');

-- CreateEnum
CREATE TYPE "InfluencerPayoutStatus" AS ENUM ('INITIATED', 'COMPLETED', 'FAILED');

-- AlterTable: Add influencer attribution columns to orders
ALTER TABLE "orders"
  ADD COLUMN "influencer_id" BIGINT,
  ADD COLUMN "referral_code" VARCHAR(30);

-- CreateTable
CREATE TABLE "influencers" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "referral_code" VARCHAR(30) NOT NULL,
    "commission_rate" DECIMAL(5,2) NOT NULL,
    "total_earnings" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "can_view_dashboard" BOOLEAN NOT NULL DEFAULT false,
    "status" "InfluencerStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "influencers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "influencer_sales" (
    "id" BIGSERIAL NOT NULL,
    "influencer_id" BIGINT NOT NULL,
    "order_id" BIGINT NOT NULL,
    "commission_rate" DECIMAL(5,2) NOT NULL,
    "commission_amount" DECIMAL(10,2) NOT NULL,
    "status" "InfluencerSaleStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "influencer_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "influencer_payout_details" (
    "influencer_id" BIGINT NOT NULL,
    "payout_method" "PayoutMethod" NOT NULL,
    "upi_id" VARCHAR(100),
    "bank_account_number" VARCHAR(20),
    "bank_ifsc" VARCHAR(20),
    "account_holder_name" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "influencer_payout_details_pkey" PRIMARY KEY ("influencer_id")
);

-- CreateTable
CREATE TABLE "influencer_payouts" (
    "id" BIGSERIAL NOT NULL,
    "influencer_id" BIGINT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "InfluencerPayoutStatus" NOT NULL DEFAULT 'INITIATED',
    "reference_note" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "influencer_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "influencers_email_key" ON "influencers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "influencers_referral_code_key" ON "influencers"("referral_code");

-- CreateIndex
CREATE INDEX "influencers_referral_code_idx" ON "influencers"("referral_code");

-- CreateIndex
CREATE INDEX "influencers_status_idx" ON "influencers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "influencer_sales_order_id_key" ON "influencer_sales"("order_id");

-- CreateIndex
CREATE INDEX "influencer_sales_influencer_id_status_idx" ON "influencer_sales"("influencer_id", "status");

-- CreateIndex
CREATE INDEX "influencer_sales_order_id_idx" ON "influencer_sales"("order_id");

-- CreateIndex
CREATE INDEX "influencer_payouts_influencer_id_status_idx" ON "influencer_payouts"("influencer_id", "status");

-- CreateIndex
CREATE INDEX "orders_influencer_id_idx" ON "orders"("influencer_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_influencer_id_fkey"
  FOREIGN KEY ("influencer_id") REFERENCES "influencers"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "influencer_sales" ADD CONSTRAINT "influencer_sales_influencer_id_fkey"
  FOREIGN KEY ("influencer_id") REFERENCES "influencers"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "influencer_sales" ADD CONSTRAINT "influencer_sales_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "influencer_payout_details" ADD CONSTRAINT "influencer_payout_details_influencer_id_fkey"
  FOREIGN KEY ("influencer_id") REFERENCES "influencers"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "influencer_payouts" ADD CONSTRAINT "influencer_payouts_influencer_id_fkey"
  FOREIGN KEY ("influencer_id") REFERENCES "influencers"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
