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
      img: "/img/combo1.png",
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
      img: "/img/combo2.png",
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
      img: "/img/combo3.png",
      type: "Oily",
      rating: 4.3,
    },
    {
      slug: "glow-combo",
      name: "Glow Combo Kit",
      desc: "Complete skincare routine for radiant skin",
      price: "1299",
      size: "3 items",
      img: "/img/combo4.png",
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
      img: "/img/combo5.png",
      type: "Sensitive",
      rating: 4.4,
    },
    {
      slug: "daily-routine-combo",
      name: "Daily Routine Combo",
      desc: "Face wash + cream for everyday skincare",
      price: "1050",
      size: "2 items",
      img: "/img/combo6.png",
      type: "All",
      rating: 4.5,
    },
  ];

  return <CategoryPage title="Combos" products={products} />;
}