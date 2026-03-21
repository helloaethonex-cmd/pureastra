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

      <Swiper
        slidesPerView={3}
        centeredSlides={true}
        spaceBetween={40}
        loop={true}
        navigation={{
          nextEl: ".trans-next",
          prevEl: ".trans-prev",
        }}
        modules={[Navigation]}
      >
        {data.map((item, index) => (
          <SwiperSlide key={index}>
            <div className="flex items-center justify-center gap-5 relative">
              {/* BEFORE CARD */}
              <div className="w-[260px] bg-[#FAF3E2] rounded-[20px] p-[10px_10px_16px] shadow-[0_8px_20px_rgba(0,0,0,0.08)]">
                <img
                  src={item.before}
                  alt="before"
                  className="w-full h-[300px] object-cover rounded-[16px]"
                />
                <p className="mt-2 text-sm text-[#5e2b15]">Dull Skin</p>
              </div>

              {/* CENTER ARROW */}
              <div className="w-9 h-9 bg-[#E9E2D8] rounded-full border-2 border-[#d0c6b8] flex items-center justify-center z-[2]">
                <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
              </div>

              {/* AFTER CARD */}
              <div className="w-[260px] bg-[#FAF3E2] rounded-[20px] p-[10px_10px_16px] shadow-[0_8px_20px_rgba(0,0,0,0.08)]">
                <img
                  src={item.after}
                  alt="after"
                  className="w-full h-[300px] object-cover rounded-[16px]"
                />
                <p className="mt-2 text-sm text-[#819744]">Radiant Skin</p>
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
