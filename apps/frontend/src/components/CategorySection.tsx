"use client";

<<<<<<< HEAD
import { useMemo, useState } from "react";
import Link from "next/link";
=======
import { useState } from "react";
import { motion } from "framer-motion";
>>>>>>> 2df67f3 (reponsive landing page and description page updation)
import ProductCard from "./ProductCard";
import { useCategories, useProducts } from "@/hooks/useProducts";

const categories = ["Face Care", "Body Care", "Hair Care"];

export default function CategorySection() {
<<<<<<< HEAD
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
=======
  const [active, setActive] = useState("Face Care");

  type Category = "Face Care" | "Body Care" | "Hair Care";

type Product = {
  id: number;
  title: string;
  desc: string;
  price: number;
  size: string;
  img: string;
  category: Category;
};

  //  FULL PRODUCT DATA
  const products: Product[] = [
  {
    id: 1,
    title: "Vitamin C Face Wash",
    desc: "Brightens skin and removes dirt & oil",
    price: 590,
    size: "100ml",
    img: "/img/Facewash.jpeg",
    category: "Face Care",
  },
  {
    id: 2,
    title: "Hydrating Body Lotion",
    desc: "Deep hydration for soft glowing skin",
    price: 499,
    size: "200ml",
    img: "/img/Facewash.jpeg",
    category: "Body Care",
  },
  {
    id: 3,
    title: "Hair Strength Serum",
    desc: "Reduces hair fall and promotes growth",
    price: 699,
    size: "50ml",
    img: "/img/Facewash.jpeg",
    category: "Hair Care",
  },
  {
    id: 4,
    title: "Vitamin C Cleanser",
    desc: "Gentle cleanser for daily use",
    price: 550,
    size: "100ml",
    img: "/img/Facewash.jpeg",
    category: "Face Care",
  },
  {
    id: 5,
    title: "Body Butter",
    desc: "Nourishes and repairs dry skin",
    price: 650,
    size: "150ml",
    img: "/img/Facewash.jpeg",
    category: "Body Care",
  },
  {
    id: 6,
    title: "Hair Oil",
    desc: "Strengthens roots and adds shine",
    price: 399,
    size: "100ml",
    img: "/img/Facewash.jpeg",
    category: "Hair Care",
  },
];

  //  FIXED FILTER LOGIC
  const filtered = products.filter((p) => p.category === active);
>>>>>>> 2df67f3 (reponsive landing page and description page updation)

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
<<<<<<< HEAD
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
=======
      <div className="flex justify-center gap-3 md:gap-5 mb-[25px] md:mb-[30px] flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-4 md:px-5 py-[8px] md:py-[10px] rounded-[25px] text-sm md:text-base transition-all duration-300 ${
              active === cat
                ? "bg-white shadow-md text-[#6B4A3B]"
                : "bg-[#E5D9C7] text-[#6B4A3B] hover:bg-white"
            }`}
          >
            {cat}
          </button>
        ))}
>>>>>>> 2df67f3 (reponsive landing page and description page updation)
      </div>

      {/* VIEW ALL */}
      <div className="text-right mb-[10px] md:mb-[15px] text-[#5E2B15] text-xs md:text-sm">
<<<<<<< HEAD
        <Link href={viewAllHref}>
          View all &gt;
        </Link>
      </div>

      {/* RESPONSIVE GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-[15px] md:gap-[20px] lg:gap-[25px]">
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
=======
        <button
          onClick={() => alert("Navigate to all products")}
          className="hover:underline"
        >
          View all &gt;
        </button>
      </div>

      {/* GRID */}
      <motion.div
        key={active}
        initial="hidden"
        animate="show"
        variants={{
          show: { transition: { staggerChildren: 0.15 } },
        }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-[20px]"
      >
        {filtered.map((item) => (
          <motion.div
            key={`${active}-${item.id}`}
            variants={{
              hidden: { opacity: 0, y: 40 },
              show: { opacity: 1, y: 0 },
            }}
            whileHover={{ scale: 1.03 }}
            className="w-full mx-auto lg:w-[433px] lg:h-[427px]"
          >
            {/*  FIXED HERE */}
            <ProductCard product={item} />
          </motion.div>
        ))}
      </motion.div>
>>>>>>> 2df67f3 (reponsive landing page and description page updation)
    </section>
  );
}