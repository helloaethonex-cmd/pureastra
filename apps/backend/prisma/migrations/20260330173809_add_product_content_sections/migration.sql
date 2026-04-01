-- CreateTable
CREATE TABLE "product_content_sections" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "section_type" VARCHAR(50) NOT NULL,
    "title" TEXT,
    "content" JSONB NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_content_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_content_sections_product_id_section_type_is_active__idx" ON "product_content_sections"("product_id", "section_type", "is_active", "position");

-- CreateIndex
CREATE INDEX "product_content_sections_product_id_is_active_position_idx" ON "product_content_sections"("product_id", "is_active", "position");

-- CreateIndex
CREATE UNIQUE INDEX "product_content_sections_product_id_section_type_position_key" ON "product_content_sections"("product_id", "section_type", "position");

-- AddForeignKey
ALTER TABLE "product_content_sections" ADD CONSTRAINT "product_content_sections_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
