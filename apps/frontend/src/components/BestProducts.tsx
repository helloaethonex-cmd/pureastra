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

export default function BestProducts() {
<<<<<<< HEAD
  const { data, isLoading, isError } = useProducts({
    limit: 12,
    isActive: true,
  });
  const products = data?.data ?? [];
=======

  // ✅ SAME DATA STRUCTURE
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
>>>>>>> 2df67f3 (reponsive landing page and description page updation)

  return (
    <section className="py-4 text-center">
      {/* Title */}
      <h2 className="text-[#9E6E5B] font-semibold font-['Marko_One',serif] text-[24px] md:text-[28px] lg:text-[32px]">
        Best Of Pureastra
      </h2>

<<<<<<< HEAD
      {/* MOBILE + TABLET GRID */}
      {isLoading ? (
        <div className="mt-4 px-4 md:px-6 text-[#5E2B15]">
          Loading products...
=======
      {/* ✅ MOBILE + TABLET GRID */}
      <div className="mt-4 px-4 md:px-6 lg:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 md:gap-6">
          {products.map((item) => (
            <div key={item.id} className="max-w-[280px] mx-auto w-full">
              <ProductCard product={item} />
            </div>
          ))}
>>>>>>> 2df67f3 (reponsive landing page and description page updation)
        </div>
      ) : isError || products.length === 0 ? (
        <div className="mt-4 px-4 md:px-6 text-[#5E2B15]">
          Products unavailable right now.
        </div>
      ) : (
        <div className="mt-4 px-4 md:px-6 lg:hidden">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

<<<<<<< HEAD
      {/* DESKTOP SWIPER (UNCHANGED) */}
      {isLoading ? (
        <div className="mt-8 px-10 text-[#5E2B15]">Loading products...</div>
      ) : isError || products.length === 0 ? (
        <div className="mt-8 px-10 text-[#5E2B15]">
          Products unavailable right now.
        </div>
      ) : (
        <div className="mt-4 px-10 items-center hidden lg:flex">
          <Swiper
            slidesPerView={3}
            spaceBetween={50}
            centeredSlides={true}
            loop={products.length > 3}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            navigation={{ nextEl: ".next-btn", prevEl: ".prev-btn" }}
            modules={[Autoplay, Navigation]}
          >
            {products.map((product) => (
              <SwiperSlide key={product.id}>
                <ProductCard product={product} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
=======
      {/* ✅ DESKTOP SWIPER */}
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
          {products.map((item) => (
            <SwiperSlide key={item.id}>
              <ProductCard product={item} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
>>>>>>> 2df67f3 (reponsive landing page and description page updation)

      {/* Arrows */}
      <div className="mt-3 justify-center gap-3 hidden lg:flex">
        <button className="prev-btn w-10 h-10 rounded-full bg-[#f3eee7] flex items-center justify-center text-[#5E2B15] hover:bg-[#ddd]">
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <button className="next-btn w-10 h-10 rounded-full bg-[#f3eee7] flex items-center justify-center text-[#5E2B15] hover:bg-[#ddd]">
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    </section>
  );
}
