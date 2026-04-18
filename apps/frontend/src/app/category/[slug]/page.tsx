import CategoryPageContent from "@/components/CategoryPageContent";
import type { Category } from "@/services/api";
import {
  listCategories,
  listProducts,
} from "@/services/server-api";

export const revalidate = 300;
export const dynamicParams = true;

const CATEGORY_REVALIDATE_SECONDS = 300;

const KNOWN_CATEGORY_SLUGS = [
  "body-care",
  "hair-care",
  "face-care",
  "combos",
  "mini-products",
  "offers",
  "about",
  "blogs",
] as const;

type CategorySlugPageProps = {
  params: Promise<{ slug: string }>;
};

function collectCategories(categories: Category[]): Category[] {
  return categories.flatMap((category) => [
    category,
    ...(category.children ?? []),
  ]);
}

function findCategoryBySlug(categories: Category[], slug: string) {
  return collectCategories(categories).find((category) => category.slug === slug);
}

export async function generateStaticParams() {
  return KNOWN_CATEGORY_SLUGS.map((slug) => ({ slug }));
}

export default async function CategorySlugPage(props: CategorySlugPageProps) {
  const { slug } = await props.params;
  const categories = await listCategories(CATEGORY_REVALIDATE_SECONDS).catch(
    () => undefined,
  );
  const categoryList = categories ?? [];
  const matchedCategory = findCategoryBySlug(categoryList, slug);
  const initialProducts = matchedCategory
    ? await listProducts(
        {
          categoryId: matchedCategory.id,
          isActive: true,
          limit: 50,
        },
        CATEGORY_REVALIDATE_SECONDS,
      ).catch(() => undefined)
    : undefined;

  return (
    <CategoryPageContent
      categoryName={matchedCategory?.name ?? slug.replace(/-/g, " ")}
      categoryId={matchedCategory?.id}
      categorySlug={slug}
      initialCategories={categories}
      initialProducts={initialProducts}
    />
  );
}
