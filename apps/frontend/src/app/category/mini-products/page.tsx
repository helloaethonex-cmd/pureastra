import CategoryPage from "@/components/CategoryPage";

export default function MiniProductsPage() {
  const products = [
    {
      slug: "mini-facewash",
      name: "Mini Face Wash",
      desc: "Travel size face wash",
      price: "199",
      size: "50ml",
      img: "/img/banner-3.webp",
      rating: 4.3,
    },
    {
      slug: "mini-cleanser",
      name: "Mini Cleanser",
      desc: "Compact daily cleanser",
      price: "149",
      size: "50ml",
      img: "/img/banner-1.webp",
      rating: 4.2,
    },
  ];

  return <CategoryPage title="Mini Products" products={products} />;
}