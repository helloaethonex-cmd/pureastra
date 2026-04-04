import { prisma } from "../src/lib/prisma";

async function main() {
  // 1. Create Face Care category (upsert so it's idempotent)
  const category = await prisma.category.upsert({
    where: { slug: "face-care" },
    update: {},
    create: {
      name: "Face Care",
      slug: "face-care",
      description:
        "Cleansers, serums, moisturizers and more for a radiant face",
    },
  });

  console.log("✅ Category created:", category.name, "(id:", category.id.toString(), ")");

  // 2. Create a dummy product linked to the Face Care category
  const product = await prisma.product.upsert({
    where: { slug: "vitamin-c-face-wash" },
    update: {},
    create: {
      name: "Vitamin C Face Wash",
      slug: "vitamin-c-face-wash",
      description:
        "A brightening Vitamin C face wash enriched with papaya and tangerine extracts. Gentle, toxin-free, and suitable for all skin types.",
      brand: "Pureastra",
      isActive: true,
      categories: {
        create: [{ categoryId: category.id }],
      },
      variants: {
        create: [
          {
            variantName: "100ml",
            sku: "PA-VCW-100ML",
            price: 590,
            costPrice: 200,
            stockQuantity: 150,
          },
          {
            variantName: "200ml",
            sku: "PA-VCW-200ML",
            price: 990,
            costPrice: 380,
            stockQuantity: 80,
          },
        ],
      },
    },
  });

  console.log("✅ Product created:", product.name, "(id:", product.id.toString(), ")");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
