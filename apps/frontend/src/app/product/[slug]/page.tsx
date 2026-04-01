import { products } from "@/data/products";
import ProductClient from "./ProductClient";

export async function generateStaticParams() {
  return products.map((p) => ({
    slug: p.slug,
  }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; 

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