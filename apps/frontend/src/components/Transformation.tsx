"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Navigation } from "swiper/modules";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

export default function Transformation() {
  const data = [
    { before: "/img/before1.png", after: "/img/after1.png" },
    { before: "/img/before1.png", after: "/img/after1.png" },
    { before: "/img/before1.png", after: "/img/after1.png" },
    { before: "/img/before1.png", after: "/img/after1.png" },
    { before: "/img/before1.png", after: "/img/after1.png" },
  ];

  return (
    <section className="bg-[#FAF3E2] text-center px-[40px] py-[60px] relative">
      <h2 className="text-[28px] font-['Marko_One',serif] text-[#9E6E5B] mb-[40px]">
        Visible Transformation with Pureastra
      </h2>

      {/* <Swiper
        slidesPerView={3}
        centeredSlides={true}
        spaceBetween={40}
        loop={true}
        navigation={{
          nextEl: ".trans-next",
          prevEl: ".trans-prev",
        }}
        modules={[Navigation]}
      > */}
      <Swiper
        slidesPerView={3}
        centeredSlides={true}
        spaceBetween={20}
        loop={true}
        navigation={{
          nextEl: ".trans-next",
          prevEl: ".trans-prev",
        }}
        modules={[Navigation]}
        breakpoints={{
          320: { slidesPerView: 1.2 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
      >
        {data.map((item, index) => (
          <SwiperSlide key={index}>
            <div className="flex items-center justify-center gap-2 relative">
              {/* BEFORE CARD */}
              <div className="w-[284px] h-[368px] bg-[#FAF3E2] rounded-[29px] overflow-hidden border border-black shadow-[0_8px_20px_rgba(0,0,0,0.08)] flex flex-col transition-transform duration-300 hover:-translate-y-1">

                {/* IMAGE */}
                <img
                  src={item.before}
                  alt="before"
                  className="w-full h-[313px] object-cover"
                />

                {/* BOTTOM LABEL */}
                <div className="h-[55px] flex items-center justify-center bg-[#FAF3E2]">
                  <p className="text-sm text-[#819744] font-bold font-['Roboto_Serif',serif]">
                    Dull Skin
                  </p>
                </div>

              </div>

              
              {/* CENTER ARROW */}
              <div className="absolute left-1/2 -translate-x-1/2 z-10">
                <div className="w-[114px] h-[59px] bg-[#FAF3E2] rounded-[40px] border border-black flex items-center justify-center shadow-md">
                  <FontAwesomeIcon icon={faArrowRight} className="text-lg" />
                </div>
              </div>

              {/* AFTER CARD */}
              <div className="w-[284px] h-[368px] bg-[#FAF3E2] rounded-[29px] overflow-hidden border border-black shadow-[0_8px_20px_rgba(0,0,0,0.08)] flex flex-col transition-transform duration-300 hover:-translate-y-1">

                <img
                  src={item.after}
                  alt="after"
                  className="w-full h-[313px] object-cover"
                />

                <div className="h-[55px] flex items-center justify-center bg-[#FAF3E2]">
                  <p className="text-sm text-[#819744] font-bold font-['Roboto_Serif',serif]">
                    Radiant Skin
                  </p>
                </div>

              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* NAV BUTTONS — absolute positioned relative to section */}
      <button className="trans-prev absolute top-1/2 -translate-y-1/2 left-[10px] w-10 h-10 rounded-full border-none bg-white shadow-[0_4px_10px_rgba(0,0,0,0.1)] cursor-pointer z-10">
        <FontAwesomeIcon icon={faChevronLeft} />
      </button>

      <button className="trans-next absolute top-1/2 -translate-y-1/2 right-[10px] w-10 h-10 rounded-full border-none bg-white shadow-[0_4px_10px_rgba(0,0,0,0.1)] cursor-pointer z-10">
        <FontAwesomeIcon icon={faChevronRight} />
      </button>

      <p className="mt-5 text-[#819744] text-[18px] font-medium font-['Roboto_Serif',serif]">
        Brighter skin in just 2 weeks
      </p>
    </section>
  );
}
