export type BlogType = {
  slug: string;
  title: string;
  img: string;
  content: string;
};

export const blogs: BlogType[] = [
  {
    slug: "vitamin-c-benefits",
    title: "Benefits of Vitamin C for Skin",
    img: "/img/banner-1.png",
    content:
      "Vitamin C helps brighten skin, reduce pigmentation, and improve overall skin texture. It boosts collagen production and protects against damage.",
  },
  {
    slug: "daily-skincare-routine",
    title: "Daily Skincare Routine",
    img: "/img/banner-2.png",
    content:
      "A proper skincare routine includes cleansing, toning, moisturizing, and sunscreen. Consistency is key for healthy skin.",
  },
  {
    slug: "natural-ingredients",
    title: "Natural Ingredients Guide",
    img: "/img/banner-3.png",
    content:
      "Natural ingredients like aloe vera, papaya, and turmeric help nourish and repair skin naturally.",
  },
];