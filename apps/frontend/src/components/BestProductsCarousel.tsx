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
import type { Product } from "@/services/api";

type BestProductsCarouselProps = {
  products: Product[];
};

export default function BestProductsCarousel({
  products,
}: BestProductsCarouselProps) {
  return (
    <section className="py-4 text-center">
      {/* TITLE */}
      <h2 className="text-[#9E6E5B] font-semibold font-['Marko_One',serif] text-[24px] md:text-[28px] lg:text-[32px]">
        Best Of Pureastra
      </h2>

      {/* CONTENT */}
      {products.length === 0 ? (
        <div className="mt-4 text-[#5E2B15]">
          Products unavailable right now.
        </div>
      ) : (
        <div className="mt-4 px-4 md:px-6 lg:px-10">
          {/* SWIPER */}
          <Swiper
            spaceBetween={20}
            loop={products.length > 3}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
            }}
            navigation={{
              nextEl: ".next-btn",
              prevEl: ".prev-btn",
            }}
            breakpoints={{
              0: {
                slidesPerView: 1,
              },
              640: {
                slidesPerView: 2,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 40,
              },
            }}
            modules={[Autoplay, Navigation]}
            className="cursor-grab active:cursor-grabbing"
          >
            {products.map((product) => (
              <SwiperSlide key={product.id}>
                <ProductCard product={product} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {/* NAVIGATION BUTTONS */}
      <div className="mt-4 flex justify-center gap-3">
        <button className="prev-btn w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#f3eee7] flex items-center justify-center hover:scale-105 transition shadow-sm">
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>

        <button className="next-btn w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#f3eee7] flex items-center justify-center hover:scale-105 transition shadow-sm">
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    </section>
  );
}
