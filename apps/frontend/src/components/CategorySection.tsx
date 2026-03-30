"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import { useCategories, useProducts } from "@/hooks/useProducts";

export default function CategorySection() {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const topCategories = useMemo(
    () => (categories ?? []).filter((cat) => !cat.parentId).slice(0, 3),
    [categories]
  );

  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>();

  const { data: productsData, isLoading: productsLoading, isError: productsError } = useProducts({
    categoryId: activeCategoryId,
    limit: 6,
    isActive: true,
  });

  const products = productsData?.data ?? [];
  const selectedCategory = topCategories.find((cat) => cat.id === activeCategoryId);
  const viewAllHref = selectedCategory?.slug
    ? `/category/${selectedCategory.slug}`
    : "/category/face-care";

  return (
    <section className="bg-[#E9E2D8] px-[40px] py-[50px]">
      {/* TITLE */}
      <h2 className="text-center text-[32px] text-[#8B5E4A] font-['Marko_One',serif] mb-5">
        Shop By Category
      </h2>

      {/* CATEGORY PILLS */}
      <div className="flex justify-center gap-5 mb-[30px]">
        {!categoriesLoading && topCategories.length > 0 ? (
          topCategories.map((category) => {
            const isActive = activeCategoryId === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategoryId(isActive ? undefined : category.id)}
                className={`px-5 py-[10px] rounded-[25px] border-0 text-[#6B4A3B] font-medium cursor-pointer transition-all duration-300 ${
                  isActive
                    ? "bg-white shadow-[0_2px_6px_rgba(0,0,0,0.1)]"
                    : "bg-[#E5D9C7] hover:bg-white"
                }`}
              >
                {category.name}
              </button>
            );
          })
        ) : (
          <span className="text-sm text-[#6B4A3B]">Loading categories...</span>
        )}
      </div>

      {/* VIEW ALL */}
      <div className="text-right mb-[15px] text-[#5E2B15] text-sm">
        <Link href={viewAllHref}>
          View all &gt;
        </Link>
      </div>

      {/* PRODUCT GRID */}
      <div className="grid grid-cols-3 gap-[25px]">
        {productsLoading ? (
          [...Array(6)].map((_, index) => (
            <div key={index} className="h-105 w-full rounded-[25px] bg-[#D9D9D9] animate-pulse" />
          ))
        ) : productsError || products.length === 0 ? (
          <div className="col-span-3 text-center text-[#5E2B15] py-8">
            No products found for this section.
          </div>
        ) : (
          products.map((product) => <ProductCard key={product.id} product={product} />)
        )}
      </div>
    </section>
  );
}
