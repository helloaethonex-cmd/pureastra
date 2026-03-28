import CategoryPageContent from "@/components/CategoryPageContent";
import type { Category } from "@/services/api";

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

function requireBackendUrl() {
  if (!BASE) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is required for static export.");
  }
  return BASE;
}

async function fetchCategories(): Promise<Category[]> {
  const base = requireBackendUrl();
  const res = await fetch(`${base}/api/v1/products/categories`, {
    cache: "force-cache",
  });

  if (!res.ok) {
    return [];
  }

  return (await res.json()) as Category[];
}

function collectCategorySlugs(categories: Category[]): string[] {
  const slugs: string[] = [];
  for (const category of categories) {
    if (category.slug) {
      slugs.push(category.slug);
    }
    for (const child of category.children ?? []) {
      if (child.slug) {
        slugs.push(child.slug);
      }
    }
  }
  return slugs;
}

function findCategoryBySlug(categories: Category[], slug: string) {
  for (const category of categories) {
    if (category.slug === slug) {
      return category;
    }
    const child = category.children?.find((item) => item.slug === slug);
    if (child) {
      return child;
    }
  }
  return null;
}

export async function generateStaticParams() {
  const categories = await fetchCategories();
  const slugs = collectCategorySlugs(categories);
  console.log(`[generateStaticParams] Found ${slugs.length} category slugs`);
  
  // Next.js requires at least one param for export
  if (slugs.length === 0) {
    console.log('[generateStaticParams] No categories found, returning placeholder');
    return [{ slug: '__no_categories__' }];
  }
  
  return slugs.map((slug) => ({ slug }));
}

export const dynamicParams = false;

export default async function CategorySlugPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const categories = await fetchCategories();
  const matchedCategory = findCategoryBySlug(categories, params.slug);

  return (
    <CategoryPageContent
      categoryName={matchedCategory?.name ?? params.slug.replace(/-/g, " ")}
      categoryId={matchedCategory?.id}
    />
  );
}
