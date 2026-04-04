"use client";

import Image from "next/image";

export default function AboutPureAstra() {
  return (
    <section className="relative bg-[#E9E2D8] px-[60px] py-[80px] overflow-hidden
      before:content-[''] before:absolute before:inset-0 before:bg-[url('/img/leaf-shadow.png')] before:bg-no-repeat before:bg-left-top before:bg-cover before:opacity-35 before:z-0
      after:content-[''] after:absolute after:top-0 after:left-0 after:inset-0 after:w-[55%] after:h-full after:z-[1]">
      <div className="relative z-[2] grid grid-cols-[1.2fr_1fr] items-center gap-[60px] max-md:grid-cols-1 max-md:text-center">
        {/* LEFT CONTENT */}
        <div className="animate-[fadeInLeft_1s_ease]">
          <h2 className="text-[36px] font-bold mb-5 text-black font-['Amaranth',sans-serif]">
            Why Pureastra?
          </h2>

          <p className="text-[15px] leading-[1.7] text-[#333] mb-[14px] font-['Amaranth',sans-serif] italic font-normal text-[#555]">
            <strong>PureAstra</strong> was created with a clear purpose to develop skincare
            that is gentle, transparent, and thoughtfully formulated.
          </p>

          <p className="text-[15px] leading-[1.7] text-[#333] mb-[14px] font-['Amaranth',sans-serif] italic font-normal">
            We believe many skincare products today focus only on quick results,
            sometimes overlooking how certain ingredients may irritate the skin
            or cause breakouts. PureAstra takes a different approach. Our
            formulations are developed with carefully selected plant-based
            ingredients and a mindful philosophy focused on skin comfort,
            hydration, and balance.
          </p>

          <p className="text-[15px] leading-[1.7] text-[#333] mb-[14px] font-['Amaranth',sans-serif] italic font-normal">
            Our products are cruelty-free and created with a toxin-conscious
            approach, focusing on ingredients that support healthy skin without
            unnecessary harshness. Each formula is designed to be suitable for
            everyday use and to address common skin concerns, especially those
            experienced by Indian skin types.
          </p>

          <p className="text-[15px] leading-[1.7] text-[#333] mb-[14px] font-['Amaranth',sans-serif] italic font-normal">
            At PureAstra, every formula has a story a process of research,
            testing, and continuous improvement to create skincare that people
            can trust.
          </p>

        </div>

        {/* RIGHT IMAGE */}
        <div className="relative flex justify-center items-end">
          {/* Background circle */}
          <div className="absolute w-[420px] h-[420px] rounded-full top-0 z-0" />
          <div className="relative z-[2] w-full max-w-[380px] h-[420px] mt-[40px] transition-transform duration-300 hover:scale-105">
            <Image
              src="/img/why.png"
              alt="Why PureAstra"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 90vw, 380px"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
