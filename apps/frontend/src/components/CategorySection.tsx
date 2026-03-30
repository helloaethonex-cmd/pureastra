"use client";

import ProductCard from "./ProductCard";

export default function CategorySection() {
  return (
    <section className="bg-[#E9E2D8] px-[16px] md:px-[24px] lg:px-[40px] py-[40px] md:py-[50px]">
      
      {/* TITLE */}
      <h2 className="text-center text-[24px] md:text-[28px] lg:text-[32px] text-[#8B5E4A] font-['Marko_One',serif] mb-5">
        Shop By Category
      </h2>

      {/* CATEGORY PILLS */}
      <div className="flex justify-center gap-3 md:gap-5 mb-[25px] md:mb-[30px] flex-wrap">
        <button className="px-4 md:px-5 py-[8px] md:py-[10px] rounded-[25px] border-0 bg-white text-[#6B4A3B] font-medium cursor-pointer transition-all duration-300 shadow-[0_2px_6px_rgba(0,0,0,0.1)] text-sm md:text-base">
          Face Care
        </button>
        <button className="px-4 md:px-5 py-[8px] md:py-[10px] rounded-[25px] border-0 bg-[#E5D9C7] text-[#6B4A3B] font-medium cursor-pointer transition-all duration-300 hover:bg-white text-sm md:text-base">
          Body Care
        </button>
        <button className="px-4 md:px-5 py-[8px] md:py-[10px] rounded-[25px] border-0 bg-[#E5D9C7] text-[#6B4A3B] font-medium cursor-pointer transition-all duration-300 hover:bg-white text-sm md:text-base">
          Hair Care
        </button>
      </div>

      {/* VIEW ALL */}
      <div className="text-right mb-[10px] md:mb-[15px] text-[#5E2B15] text-xs md:text-sm cursor-pointer">
        <span>View all &gt;</span>
      </div>

      {/* RESPONSIVE GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-[15px] md:gap-[20px] lg:gap-[25px]">
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