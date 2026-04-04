// import CategoryPage from "@/components/CategoryPage";

// export default function ComboPage() {
//   return <CategoryPage title="Combos" products={[]} />;
// }
import CategoryPage from "@/components/CategoryPage";

export default function ComboPage() {

  const products = [
    {
      slug: "vitamin-c-combo",
      name: "Vitamin C Combo Kit",
      desc: "Face wash + serum combo for bright glowing skin",
      price: "1099",
      size: "2 items",
      img: "/img/banner-1.webp",
      type: "All",
      tag: "Trending",
      rating: 4.6,
    },
    {
      slug: "hydration-combo",
      name: "Hydration Combo",
      desc: "Cleanser + moisturizer for deep hydration",
      price: "999",
      size: "2 items",
      img: "/img/banner-2.webp",
      type: "Dry",
      tag: "Bestseller",
      rating: 4.5,
    },
    {
      slug: "acne-control-combo",
      name: "Acne Control Combo",
      desc: "Face wash + toner for acne-prone skin",
      price: "899",
      size: "2 items",
      img: "/img/banner-3.webp",
      type: "Oily",
      rating: 4.3,
    },
    {
      slug: "glow-combo",
      name: "Glow Combo Kit",
      desc: "Complete skincare routine for radiant skin",
      price: "1299",
      size: "3 items",
      img: "/img/routine-1.webp",
      type: "Normal",
      tag: "Trending",
      rating: 4.7,
    },
    {
      slug: "sensitive-care-combo",
      name: "Sensitive Care Combo",
      desc: "Gentle care combo for sensitive skin",
      price: "950",
      size: "2 items",
      img: "/img/routine-2.webp",
      type: "Sensitive",
      rating: 4.4,
    },
    {
      slug: "daily-routine-combo",
      name: "Daily Routine Combo",
      desc: "Face wash + cream for everyday skincare",
      price: "1050",
      size: "2 items",
      img: "/img/routine-3.webp",
      type: "All",
      rating: 4.5,
    },
  ];

  return <CategoryPage title="Combos" products={products} />;
}
