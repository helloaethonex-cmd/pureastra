import CategoryPage from "@/components/CategoryPage";

export default function BodyPage() {

  const products = [
    {
      slug: "body-lotion",
      name: "Hydrating Body Lotion",
      desc: "Deep nourishing lotion for soft & smooth skin",
      price: "699",
      size: "200ml",
      img: "/img/body1.png",
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
      img: "/img/body2.png",
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
      img: "/img/body3.png",
      type: "Normal Skin",
      rating: 4.3,
    },
    {
      slug: "body-butter",
      name: "Shea Body Butter",
      desc: "Ultra moisturizing butter for dry skin",
      price: "799",
      size: "200ml",
      img: "/img/body4.png",
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
      img: "/img/body5.png",
      type: "All Skin",
      rating: 4.2,
    },
    {
      slug: "glow-body-oil",
      name: "Glow Body Oil",
      desc: "Lightweight oil for radiant skin",
      price: "720",
      size: "100ml",
      img: "/img/body6.png",
      type: "Combination Skin",
      rating: 4.5,
    },
  ];

  return <CategoryPage title="Body Care" products={products} />;
}