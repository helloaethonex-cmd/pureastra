import type { Product, ProductListResponse } from "@/services/api";
import ProductClient from "./ProductClient";

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

function requireBackendUrl() {
  if (!BASE) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is required for static export.");
  }
  return BASE;
}

async function fetchProductSlugs(): Promise<string[]> {
  try {
    const base = requireBackendUrl();

    const res = await fetch(`${base}/api/v1/products?limit=100`, {
      cache: "force-cache",
    });

    if (!res.ok) {
      console.warn(`[fetchProductSlugs] backend responded with ${res.status}`);
      return [];
    }

    const data = (await res.json()) as ProductListResponse;
    const slugs = data.data.map((product) => product.slug).filter(Boolean);

    return slugs;
  } catch (error) {
    console.warn("[fetchProductSlugs] backend unavailable during build");
    return [];
  }
}

async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const base = requireBackendUrl();
    const res = await fetch(`${base}/api/v1/products/slug/${slug}`, {
      cache: "force-cache",
    });

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as Product;
  } catch (error) {
    console.warn(`[fetchProductBySlug] backend unavailable for slug "${slug}" during build`);
    return null;
  }
}

export async function generateStaticParams() {
  const slugs = await fetchProductSlugs();

  // Next.js requires at least one param for export, so return a placeholder if empty
  if (slugs.length === 0) {
    return [{ slug: '__no_products__' }];
  }
  
  return slugs.map((slug) => ({ slug }));
}

export const dynamicParams = false;

export default async function Page(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const product = await fetchProductBySlug(params.slug);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF3E2] text-lg text-[#5E2B16]">
        Product not found
      </div>
    );
  }

  return <ProductClient product={product} />;
}
