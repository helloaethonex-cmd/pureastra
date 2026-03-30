"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Autoplay, Navigation } from "swiper/modules";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import ProductCard from "./ProductCard";

export default function BestProducts() {
  return (
    <section className="py-4 text-center">
      
      {/* Title */}
      <h2 className="text-[#9E6E5B] font-semibold font-['Marko_One',serif] text-[24px] md:text-[28px] lg:text-[32px]">
        Best Of Pureastra
      </h2>

      {/* MOBILE + TABLET GRID */}
      <div className="mt-4 px-4 md:px-6 lg:hidden">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCard key={i} />
          ))}
        </div>
      </div>

      {/* DESKTOP SWIPER (UNCHANGED) */}
      <div className="mt-4 px-10 items-center hidden lg:flex">
        <Swiper
          slidesPerView={3}
          spaceBetween={50}
          centeredSlides={true}
          loop={true}
          autoplay={{ delay: 2500, disableOnInteraction: false }}
          navigation={{ nextEl: ".next-btn", prevEl: ".prev-btn" }}
          modules={[Autoplay, Navigation]}
        >
          <SwiperSlide>
            <ProductCard />
          </SwiperSlide>
          <SwiperSlide>
            <ProductCard />
          </SwiperSlide>
          <SwiperSlide>
            <ProductCard />
          </SwiperSlide>
          <SwiperSlide>
            <ProductCard />
          </SwiperSlide>
          <SwiperSlide>
            <ProductCard />
          </SwiperSlide>
          <SwiperSlide>
            <ProductCard />
          </SwiperSlide>
        </Swiper>
      </div>

      {/* Arrows (only desktop) */}
      <div className="mt-3 justify-center gap-3 hidden lg:flex">
        <button className="prev-btn w-10 h-10 rounded-full border-none bg-[#f3eee7] flex items-center justify-center text-[#5E2B15] text-base transition-all duration-200 cursor-pointer hover:bg-[#ddd]">
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <button className="next-btn w-10 h-10 rounded-full border-none bg-[#f3eee7] flex items-center justify-center text-[#5E2B15] text-base transition-all duration-200 cursor-pointer hover:bg-[#ddd]">
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    </section>
  );
}