import CategoryPage from "@/components/CategoryPage";

export default function HairPage() {
  return (
    <CategoryPage
      title="Hair Care"
      products={[
        {
          slug: "hair-oil",
          name: "Hair Oil",
          desc: "Hair growth oil",
          price: "599",
          size: "100ml",
          img: "/img/routine-1.png",
          rating: 4.5,
        },
      ]}
    />
  );
}