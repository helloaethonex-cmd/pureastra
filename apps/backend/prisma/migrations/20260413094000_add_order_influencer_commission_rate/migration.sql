ALTER TABLE "orders"
ADD COLUMN "influencer_commission_rate" DECIMAL(5,2);

UPDATE "orders" o
SET "influencer_commission_rate" = i."commission_rate"
FROM "influencers" i
WHERE o."influencer_id" = i."id"
  AND o."influencer_commission_rate" IS NULL;
