"use client";

import ProductCard from "./ProductCard";

export default function CategorySection() {
  return (
    <section className="bg-[#E9E2D8] px-[40px] py-[50px]">
      {/* TITLE */}
      <h2 className="text-center text-[32px] text-[#8B5E4A] font-['Marko_One',serif] mb-5">
        Shop By Category
      </h2>

      {/* CATEGORY PILLS */}
      <div className="flex justify-center gap-5 mb-[30px]">
        <button className="px-5 py-[10px] rounded-[25px] border-0 bg-white text-[#6B4A3B] font-medium cursor-pointer transition-all duration-300 shadow-[0_2px_6px_rgba(0,0,0,0.1)]">
          Face Care
        </button>
        <button className="px-5 py-[10px] rounded-[25px] border-0 bg-[#E5D9C7] text-[#6B4A3B] font-medium cursor-pointer transition-all duration-300 hover:bg-white">
          Body Care
        </button>
        <button className="px-5 py-[10px] rounded-[25px] border-0 bg-[#E5D9C7] text-[#6B4A3B] font-medium cursor-pointer transition-all duration-300 hover:bg-white">
          Hair Care
        </button>
      </div>

      {/* VIEW ALL */}
      <div className="text-right mb-[15px] text-[#5E2B15] text-sm cursor-pointer">
        <span>View all &gt;</span>
      </div>

      {/* PRODUCT GRID */}
      <div className="grid grid-cols-3 gap-[25px]">
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
        <ProductCard />
      </div>
    </section>
  );
}
