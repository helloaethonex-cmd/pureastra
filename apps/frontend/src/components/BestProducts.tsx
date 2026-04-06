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
import { useProducts } from "@/hooks/useProducts";

export default function BestProducts() {
  const { data, isLoading, isError } = useProducts({
    limit: 12,
    isActive: true,
  });

  const products = data?.data ?? [];

  return (
    <section className="py-4 text-center">
      {/* Title */}
      <h2 className="text-[#9E6E5B] font-semibold font-['Marko_One',serif] text-[24px] md:text-[28px] lg:text-[32px]">
        Best Of Pureastra
      </h2>

      {/* MOBILE + TABLET */}
      {isLoading ? (
        <div className="mt-4 text-[#5E2B15]">Loading products...</div>
      ) : isError || products.length === 0 ? (
        <div className="mt-4 text-[#5E2B15]">
          Products unavailable right now.
        </div>
      ) : (
        <div className="mt-4 px-4 md:px-6 lg:hidden">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* DESKTOP */}
      {isLoading ? (
        <div className="mt-8 text-[#5E2B15]">Loading products...</div>
      ) : isError || products.length === 0 ? (
        <div className="mt-8 text-[#5E2B15]">
          Products unavailable right now.
        </div>
      ) : (
        <div className="mt-4 px-10 hidden lg:flex">
          <Swiper
            slidesPerView={3}
            spaceBetween={50}
            centeredSlides={true}
            loop={products.length > 3}
            autoplay={{ delay: 4000 }}
            navigation={{ nextEl: ".next-btn", prevEl: ".prev-btn" }}
            modules={[Autoplay, Navigation]}
          >
            {products.map((product: any) => (
              <SwiperSlide key={product.id}>
                <ProductCard product={product} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {/* Arrows */}
      <div className="mt-3 justify-center gap-3 hidden lg:flex">
        <button className="prev-btn w-10 h-10 rounded-full bg-[#f3eee7] flex items-center justify-center">
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <button className="next-btn w-10 h-10 rounded-full bg-[#f3eee7] flex items-center justify-center">
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    </section>
  );
}