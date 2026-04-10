-- AlterTable: Add user_id FK to influencers (nullable, unique)
ALTER TABLE "influencers"
  ADD COLUMN "user_id" BIGINT;

-- CreateIndex
CREATE UNIQUE INDEX "influencers_user_id_key" ON "influencers"("user_id");

-- CreateIndex: DESC index on total_earnings for top-influencer queries
CREATE INDEX "influencers_total_earnings_idx" ON "influencers"("total_earnings" DESC);

-- AddForeignKey
ALTER TABLE "influencers" ADD CONSTRAINT "influencers_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
