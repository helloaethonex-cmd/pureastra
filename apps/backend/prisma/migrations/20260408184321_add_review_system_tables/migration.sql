-- CreateEnum
CREATE TYPE "MetricUnit" AS ENUM ('PERCENT', 'RATING');

-- CreateTable
CREATE TABLE "reviews" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "order_id" BIGINT,
    "rating" INTEGER NOT NULL,
    "title" VARCHAR(255),
    "comment" TEXT,
    "is_verified_purchase" BOOLEAN NOT NULL DEFAULT false,
    "is_approved" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_images" (
    "id" BIGSERIAL NOT NULL,
    "review_id" BIGINT NOT NULL,
    "image_url" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_metrics" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(50),
    "min_value" INTEGER NOT NULL DEFAULT 0,
    "max_value" INTEGER NOT NULL DEFAULT 100,
    "unit" "MetricUnit" NOT NULL DEFAULT 'PERCENT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_review_metrics" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "metric_id" BIGINT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_review_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_metric_responses" (
    "id" BIGSERIAL NOT NULL,
    "review_id" BIGINT NOT NULL,
    "metric_id" BIGINT NOT NULL,
    "value" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_metric_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_review_summaries" (
    "product_id" BIGINT NOT NULL,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "avg_rating" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "metric_averages" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_review_summaries_pkey" PRIMARY KEY ("product_id")
);

-- CreateIndex
CREATE INDEX "reviews_product_id_is_approved_idx" ON "reviews"("product_id", "is_approved");

-- CreateIndex
CREATE INDEX "reviews_user_id_idx" ON "reviews"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_user_id_product_id_key" ON "reviews"("user_id", "product_id");

-- CreateIndex
CREATE INDEX "review_images_review_id_idx" ON "review_images"("review_id");

-- CreateIndex
CREATE UNIQUE INDEX "review_metrics_name_key" ON "review_metrics"("name");

-- CreateIndex
CREATE INDEX "product_review_metrics_product_id_display_order_idx" ON "product_review_metrics"("product_id", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "product_review_metrics_product_id_metric_id_key" ON "product_review_metrics"("product_id", "metric_id");

-- CreateIndex
CREATE INDEX "review_metric_responses_metric_id_idx" ON "review_metric_responses"("metric_id");

-- CreateIndex
CREATE UNIQUE INDEX "review_metric_responses_review_id_metric_id_key" ON "review_metric_responses"("review_id", "metric_id");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_images" ADD CONSTRAINT "review_images_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_review_metrics" ADD CONSTRAINT "product_review_metrics_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_review_metrics" ADD CONSTRAINT "product_review_metrics_metric_id_fkey" FOREIGN KEY ("metric_id") REFERENCES "review_metrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_metric_responses" ADD CONSTRAINT "review_metric_responses_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_metric_responses" ADD CONSTRAINT "review_metric_responses_metric_id_fkey" FOREIGN KEY ("metric_id") REFERENCES "review_metrics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_review_summaries" ADD CONSTRAINT "product_review_summaries_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
