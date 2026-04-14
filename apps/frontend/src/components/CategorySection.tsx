"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import { useCategories, useProducts } from "@/hooks/useProducts";
import { motion } from "framer-motion";
import { SkeletonCard, SkeletonLine } from "@/components/ui/Skeleton";

export default function CategorySection() {
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const topCategories = useMemo(
    () => (categories ?? []).filter((cat) => !cat.parentId).slice(0, 3),
    [categories]
  );

  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>();

  const {
    data: productsData,
    isLoading: productsLoading,
    isFetching: productsFetching,
    isError: productsError,
  } = useProducts({
    categoryId: activeCategoryId,
    limit: 6,
    isActive: true,
  }, {
    keepPreviousData: true,
  });

  const products = productsData?.data ?? [];

  const selectedCategory = topCategories.find(
    (cat) => cat.id === activeCategoryId
  );

  const viewAllHref = selectedCategory?.slug
    ? `/category/${selectedCategory.slug}`
    : "/category/face-care";

  return (
    <section className="bg-[#E9E2D8] px-[16px] md:px-[24px] lg:px-[40px] py-[40px] md:py-[50px]">

      {/* TITLE */}
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="text-center text-[24px] md:text-[28px] lg:text-[32px] text-[#8B5E4A] font-['Marko_One',serif] mb-5"
      >
        Shop By Category
      </motion.h2>

      {/* CATEGORY PILLS */}
      <div className="flex justify-center gap-3 sm:gap-5 mb-[30px] flex-wrap">
        {!categoriesLoading && topCategories.length > 0 ? (
          topCategories.map((category) => {
            const isActive = activeCategoryId === category.id;

            return (
              <button
                key={category.id}
                onClick={() =>
                  setActiveCategoryId(isActive ? undefined : category.id)
                }
                className={`px-4 sm:px-5 py-[8px] sm:py-[10px] rounded-[25px] text-[13px] sm:text-[14px] border-0 text-[#6B4A3B] font-medium cursor-pointer transition-all duration-300 ${
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
          <>
            <SkeletonLine className="h-8 w-24 rounded-full" />
            <SkeletonLine className="h-8 w-28 rounded-full" />
            <SkeletonLine className="h-8 w-20 rounded-full" />
          </>
        )}
      </div>

      {/* VIEW ALL */}
      <div className="text-right mb-[10px] md:mb-[15px] text-[#5E2B15] text-xs md:text-sm">
        <Link href={viewAllHref} prefetch={false}>View all &gt;</Link>
      </div>

      {/* RESPONSIVE GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[15px] md:gap-[20px] lg:gap-[25px]">
        {productsLoading && products.length === 0 ? (
          Array.from({ length: 3 }).map((_, index) => (
            <SkeletonCard key={index} className="h-105 rounded-[25px]" />
          ))
        ) : productsError || products.length === 0 ? (
          <div className="col-span-full text-center text-[#5E2B15] py-8">
            No products found for this section.
          </div>
        ) : (
          products.slice(0, 3).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>
      {productsFetching && products.length > 0 ? (
        <p className="mt-4 text-center text-xs text-[#6B4A3B]">Updating products...</p>
      ) : null}

    </section>
  );
}
