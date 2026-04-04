export type ProductType = {
  slug: string;
  name: string;
  price: number;
  rating: number;
  images: string[];
  desc: string;
};

export const products: ProductType[] = [
  {
    slug: "vitamin-c-face-wash",
    name: "Vitamin C Face Wash",
    price: 590,
    rating: 4.5,
    images: [
      "/img/facewash.webp",
      "/img/product-1.webp",
      "/img/banner-2.webp",
    ],
    desc: "Brightens skin with Vitamin C & Niacinamide",
  },
  {
    slug: "rice-cleanser",
    name: "Rice Cleanser",
    price: 499,
    rating: 4.4,
    images: [
      "/img/banner-2.webp",
      "/img/banner-3.webp",
    ],
    desc: "Hydrating cleanser for glowing skin",
  },
  {
    slug: "aloe-face-wash",
    name: "Aloe Face Wash",
    price: 549,
    rating: 4.2,
    images: [
      "/img/banner-3.webp",
    ],
    desc: "Soothing cleanser for sensitive skin",
  },
];