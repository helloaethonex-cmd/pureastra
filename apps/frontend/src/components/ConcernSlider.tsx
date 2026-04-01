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
        
        //  RESPONSIVE HEIGHT FIX
        className="
          w-full 
          h-[220px] 
          sm:h-[260px] 
          md:h-[350px] 
          lg:h-screen lg:max-h-[600px]
        "
      >
        <SwiperSlide>
          <img
            src="/img/banner-1.png"
            alt="banner1"
            className="w-full h-full object-contain md:object-cover object-center bg-[#f5f5f5]"
          />
        </SwiperSlide>

        <SwiperSlide>
          <img
            src="/img/banner-2.png"
            alt="banner2"
            className="w-full h-full object-contain md:object-cover object-center bg-[#f5f5f5]"
          />
        </SwiperSlide>

        <SwiperSlide>
          <img
            src="/img/banner-3.png"
            alt="banner3"
            className="w-full h-full object-contain md:object-cover object-center bg-[#f5f5f5]"
          />
        </SwiperSlide>
      </Swiper>
    </div>
  );
}