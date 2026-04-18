import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductClient from "./ProductClient";
import {
  ServerApiError,
  getProductBySlug,
  listProducts,
} from "@/services/server-api";

export const revalidate = 60;
export const dynamicParams = true;

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

const isMissingResource = (error: unknown) =>
  error instanceof ServerApiError && error.status === 404;

export async function generateStaticParams() {
  const products = await listProducts({
    limit: 100,
    isActive: true,
  }).catch(() => undefined);

  return (products?.data ?? [])
    .filter((product) => Boolean(product.slug))
    .map((product) => ({ slug: product.slug }));
}

export async function generateMetadata(
  props: ProductPageProps,
): Promise<Metadata> {
  const { slug } = await props.params;

  try {
    const product = await getProductBySlug(slug);

    return {
      title: `${product.name} | Pureastra`,
      description: product.description ?? "Natural skincare products",
    };
  } catch {
    return {
      title: "Product | Pureastra",
      description: "Natural skincare products",
    };
  }
}

export default async function Page(props: ProductPageProps) {
  const { slug } = await props.params;

  try {
    const product = await getProductBySlug(slug);
    const categoryId = product.categories?.[0]?.category?.id;
    const relatedProducts = categoryId
      ? await listProducts({
          categoryId,
          isActive: true,
          limit: 4,
        }).catch(() => undefined)
      : undefined;

    return (
      <ProductClient
        product={product}
        initialRelatedProducts={relatedProducts}
      />
    );
  } catch (error) {
    if (isMissingResource(error)) {
      notFound();
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center text-[#5E2B16]">
        <h1 className="text-2xl font-semibold">Product unavailable</h1>
        <p className="max-w-md text-sm text-[#7B6A58]">
          We could not load this product right now. Please try again in a
          moment.
        </p>
      </div>
    );
  }
}
