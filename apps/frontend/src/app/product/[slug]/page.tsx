import type { Product, ProductListResponse } from "@/services/api";
import { products } from "@/data/products";
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
    // Use limit=100 to avoid backend validation errors
    console.log(`[fetchProductSlugs] Fetching from: ${base}/api/v1/products?limit=100`);
    
    const res = await fetch(`${base}/api/v1/products?limit=100`, {
      cache: "force-cache",
    });

    console.log(`[fetchProductSlugs] Response status: ${res.status}`);

    if (!res.ok) {
      console.error(`[fetchProductSlugs] Failed with status ${res.status}`);
      return [];
    }

    const data = (await res.json()) as ProductListResponse;
    console.log(`[fetchProductSlugs] Found ${data.data?.length || 0} products`);
    
    const slugs = data.data.map((product) => product.slug).filter(Boolean);
    console.log(`[fetchProductSlugs] Returning ${slugs.length} valid slugs`);
    
    return slugs;
  } catch (error) {
    console.error('[fetchProductSlugs] Error:', error);
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
    console.error(`[fetchProductBySlug] Error for slug "${slug}":`, error);
    return null;
  }
}

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