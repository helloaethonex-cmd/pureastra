import { products } from "@/data/products";
import ProductClient from "./ProductClient";

export const dynamicParams = false;

export async function generateStaticParams() {
  return products.map((p) => ({
    slug: p.slug,
  }));
}

//  IMPORTANT CHANGE → async + await params
export default async function Page({ params }: any) {
  const resolvedParams = await params; 

  const slug = resolvedParams.slug;

  const product = products.find((p) => p.slug === slug);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg">
        Product not found
      </div>
    );
  }

  return <ProductClient product={product} />;
}