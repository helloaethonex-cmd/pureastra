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
      <h2 className="text-[#9E6E5B] font-semibold font-['Marko_One',serif] text-[32px]">
        Best Of Pureastra
      </h2>

      {/* Slider */}
      <div className="mt-4 px-10 flex items-center">
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

      {/* Arrows */}
      <div className="mt-3 flex justify-center gap-3">
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
