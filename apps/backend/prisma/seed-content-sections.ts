import { prisma } from "../src/lib/prisma";

const PRODUCT_SLUG = "vitamin-c-face-wash";

async function main() {
  const product = await prisma.product.findFirst({
    where: { slug: PRODUCT_SLUG, deletedAt: null },
  });

  if (!product) {
    console.error(`❌ Product "${PRODUCT_SLUG}" not found. Run seed-face-care.ts first.`);
    process.exit(1);
  }

  const sections = [
    {
      sectionType: "BENEFITS",
      title: "BENEFITS:",
      position: 0,
      content: {
        items: [
          {
            title: "Brightens and Evens Tone",
            desc: "Vitamin C helps naturally brighten your skin and reduce uneven tone",
          },
          {
            title: "Hydrates and Plumps",
            desc: "Sodium PCA and Glycerin deeply hydrate and lock in moisture for soft, supple skin",
          },
          {
            title: "Refreshes and Boosts Glow",
            desc: "Tangerine Extract enhances radiance while Papaya rejuvenates and refreshes",
          },
          {
            title: "Controls Oiliness and Dryness",
            desc: "Balanced ingredients help maintain hydration and regulate excess oil",
          },
        ],
      },
    },
    {
      sectionType: "HIGHLIGHTS",
      title: "Why Us",
      position: 0,
      content: {
        title: "Why Us",
        tagline:
          "Toxin-free | Fragrance-free | Paraben-free | Sulfate-free | SLS-free | pH balanced",
        items: [
          { text: "Crafted with pure, real ingredients" },
          { text: "Free from parabens, sulfates, and harsh additives" },
          { text: "A portion of every purchase supports cancer patients" },
          { text: "Committed to people, society, and the planet" },
          { text: "Never tested on animals" },
        ],
      },
    },
    {
      sectionType: "SUITABLE_FOR",
      title: "Suitable For",
      position: 0,
      content: {
        skinType: "all skin types",
        fields: [
          {
            label: "Skin Type",
            value: "All skin types, including sensitive, dry, oily, and combination skin",
          },
          { label: "Texture", value: "Smooth gel, gentle on skin" },
          { label: "Age", value: "Ideal for teenagers (15+) and adults" },
          { label: "Special Conditions", value: "Safe for use during pregnancy" },
          { label: "Gender", value: "Suitable for all genders" },
        ],
      },
    },
    {
      sectionType: "USAGE_INSTRUCTION",
      title: "Usage Instructions",
      position: 0,
      content: {
        steps: [
          "Wet your face with lukewarm water. Take a coin-sized amount of face wash.",
          "Gently massage in circular motions for 30–60 seconds, avoiding the eye area.",
          "Rinse thoroughly and pat dry. Follow with a moisturizer.",
          "Always patch test before first use, especially if you have sensitive skin.",
          "Store in a cool, dry place away from direct sunlight.",
        ],
      },
    },
    {
      sectionType: "BEFORE_AFTER",
      title: "Before & After",
      position: 0,
      content: {
        beforeLabel: "Dull Skin",
        afterLabel: "Radiant Skin",
        beforeImage: "/img/before1.webp",
        afterImage: "/img/after1.webp",
        caption: "Brighter skin in just 2 weeks",
      },
    },
    {
      sectionType: "FAQ",
      title: "Frequently Asked Questions",
      position: 0,
      content: {
        items: [
          {
            q: "Is this face wash safe to use during pregnancy?",
            a: "Yes! Our Vitamin C Facewash is pregnancy-safe and gentle on sensitive skin, making it suitable for expecting mothers.",
          },
          {
            q: "How is this face wash different from other Vitamin C face washes?",
            a: "Unlike many face washes that only use fruit extracts, our formula contains a stable, active form of Vitamin C along with rice extract. It brightens skin, removes tan, and maintains a healthy skin barrier.",
          },
          {
            q: "Can this face wash help with dullness and uneven skin tone?",
            a: "Absolutely! Vitamin C, Tangerine, and Papaya Extracts work together to even skin tone, brighten your complexion, and reduce dullness over time.",
          },
          {
            q: "Will this face wash hydrate my skin or make it dry?",
            a: "Yes! With Glycerine and Sodium PCA, it hydrates, plumps, and balances skin, leaving it soft without dryness.",
          },
          {
            q: "How quickly can I see results?",
            a: "Many users notice softer skin from the first wash, with visible brightening and tan removal in 2–4 weeks.",
          },
          {
            q: "Is this face wash suitable for all skin types?",
            a: "Yes! It is gentle and effective for oily, dry, combination, and sensitive skin.",
          },
          {
            q: "Is this face wash vegan and cruelty-free?",
            a: "Yes! It is 100% vegan, cruelty-free, and never tested on animals.",
          },
        ],
      },
    },
    {
      sectionType: "INGREDIENTS",
      title: "Ingredients",
      position: 0,
      content: {
        text: "Aqua, Sodium Lauryl Glucose Carboxylate, Glycerin, Sodium PCA, Ascorbic Acid (Vitamin C), Carica Papaya Fruit Extract, Citrus Reticulata (Tangerine) Peel Oil, Panthenol, Allantoin, Disodium EDTA, Citric Acid, Phenoxyethanol, Ethylhexylglycerin.",
        list: [
          "Vitamin C",
          "Sodium PCA",
          "Glycerin",
          "Papaya Extract",
          "Tangerine Extract",
          "Panthenol",
          "Allantoin",
        ],
      },
    },
  ];

  console.log(`🌱 Seeding ${sections.length} content sections for "${PRODUCT_SLUG}"...`);

  for (const section of sections) {
    // Delete existing section of same type (idempotent)
    await prisma.productContentSection.deleteMany({
      where: {
        productId: product.id,
        sectionType: section.sectionType,
      },
    });

    const created = await prisma.productContentSection.create({
      data: {
        productId: product.id,
        sectionType: section.sectionType,
        title: section.title,
        content: section.content as any,
        position: section.position,
        isActive: true,
      },
    });

    console.log(`  ✅ ${created.sectionType} (id: ${created.id})`);
  }

  console.log("\n✅ All content sections seeded!");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
