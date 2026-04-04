import CategoryPage from "@/components/CategoryPage";

export default function BodyPage() {

  const products = [
    {
      slug: "body-lotion",
      name: "Hydrating Body Lotion",
      desc: "Deep nourishing lotion for soft & smooth skin",
      price: "699",
      size: "200ml",
      img: "/img/routine-1.webp",
      type: "Dry Skin",
      tag: "Trending",
      rating: 4.5,
    },
    {
      slug: "body-wash",
      name: "Refreshing Body Wash",
      desc: "Gentle cleanser for everyday freshness",
      price: "499",
      size: "250ml",
      img: "/img/routine-2.webp",
      type: "All Skin",
      tag: "Bestseller",
      rating: 4.4,
    },
    {
      slug: "body-scrub",
      name: "Exfoliating Body Scrub",
      desc: "Removes dead skin for glowing body",
      price: "599",
      size: "150ml",
      img: "/img/routine-3.webp",
      type: "Normal Skin",
      rating: 4.3,
    },
    {
      slug: "body-butter",
      name: "Shea Body Butter",
      desc: "Ultra moisturizing butter for dry skin",
      price: "799",
      size: "200ml",
      img: "/img/routine-4.webp",
      type: "Dry Skin",
      tag: "Trending",
      rating: 4.6,
    },
    {
      slug: "spf-body-lotion",
      name: "SPF Body Lotion",
      desc: "Sun protection with hydration",
      price: "650",
      size: "200ml",
      img: "/img/routine-5.webp",
      type: "All Skin",
      rating: 4.2,
    },
    {
      slug: "glow-body-oil",
      name: "Glow Body Oil",
      desc: "Lightweight oil for radiant skin",
      price: "720",
      size: "100ml",
      img: "/img/facewash.webp",
      type: "Combination Skin",
      rating: 4.5,
    },
  ];

  return <CategoryPage title="Body Care" products={products} />;
}
