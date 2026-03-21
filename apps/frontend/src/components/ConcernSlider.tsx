"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";

import { Autoplay, Pagination } from "swiper/modules";

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
        <SwiperSlide>
          <img src="/img/banner-1.png" alt="banner1" className="w-full h-full object-top object-cover transition-transform duration-500" />
        </SwiperSlide>

        <SwiperSlide>
          <img src="/img/banner-2.png" alt="banner2" className="w-full h-full object-top object-cover transition-transform duration-500" />
        </SwiperSlide>

        <SwiperSlide>
          <img src="/img/banner-3.png" alt="banner3" className="w-full h-full object-top object-cover transition-transform duration-500" />
        </SwiperSlide>
      </Swiper>
    </div>
  );
}
