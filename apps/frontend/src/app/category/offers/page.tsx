import CategoryPage from "@/components/CategoryPage";

export default function OffersPage() {
  const products = [
    {
      slug: "vitamin-c-offer",
      name: "Vitamin C Combo",
      desc: "Special discounted combo pack",
      price: "899",
      size: "200ml",
      img: "/img/banner-1.png",
      rating: 4.6,
    },
    {
      slug: "glow-offer",
      name: "Glow Kit",
      desc: "Complete skincare routine kit",
      price: "1299",
      size: "Full Kit",
      img: "/img/banner-2.png",
      rating: 4.7,
    },
  ];

  return <CategoryPage title="Offers" products={products} />;
}