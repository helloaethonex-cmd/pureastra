"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";

import { Autoplay, Pagination } from "swiper/modules";

const banners = [
  { src: "/img/banner-1.webp", alt: "Banner 1" },
  { src: "/img/banner-2.webp", alt: "Banner 2" },
  { src: "/img/banner-3.webp", alt: "Banner 3" },
];

export default function ConcernSlider() {
  return (
    <div className="bg-white my-5">
      <Swiper
        slidesPerView={1}
        loop={true}
        autoplay={{
          delay: 2500,
          disableOnInteraction: false,
        }}
        pagination={{ clickable: true }}
        modules={[Autoplay, Pagination]}
        className="h-screen max-h-[600px] w-full max-md:h-[300px]"
      >
        {banners.map((banner, index) => (
          <SwiperSlide key={banner.src}>
            <div className="relative w-full h-full">
              <Image
                src={banner.src}
                alt={banner.alt}
                fill
                className="object-top object-cover transition-transform duration-500"
                sizes="100vw"
                priority={index === 0}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
