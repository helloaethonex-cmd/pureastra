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
    <section className="bg-[#FAF3E2] text-center px-4 sm:px-6 md:px-[40px] py-10 md:py-[60px] relative">
      
      {/* HEADING */}
      <h2 className="text-xl sm:text-2xl md:text-[28px] font-['Marko_One',serif] text-[#9E6E5B] mb-6 md:mb-[40px]">
        Visible Transformation with Pureastra
      </h2>

      <Swiper
        centeredSlides={true}
        spaceBetween={16}
        loop={true}
        navigation={{
          nextEl: ".trans-next",
          prevEl: ".trans-prev",
        }}
        modules={[Navigation]}
        breakpoints={{
          320: { slidesPerView: 1.1, spaceBetween: 12 },
          480: { slidesPerView: 1.2 },
          768: { slidesPerView: 2, spaceBetween: 16 },
          1024: { slidesPerView: 3, spaceBetween: 20 }, // desktop SAME
        }}
      >
        {data.map((item, index) => (
          <SwiperSlide key={index}>
            <div className="flex items-center justify-center gap-2 sm:gap-3 relative">

              {/* BEFORE CARD */}
              <div className="
                w-[160px] h-[230px]
                sm:w-[220px] sm:h-[300px]
                md:w-[284px] md:h-[368px]   /* desktop SAME */
                bg-[#FAF3E2] rounded-[20px] md:rounded-[29px]
                overflow-hidden border border-black
                shadow-[0_8px_20px_rgba(0,0,0,0.08)]
                flex flex-col transition-transform duration-300 hover:-translate-y-1
              ">
                <img
                  src={item.before}
                  alt="before"
                  className="w-full h-[70%] md:h-[313px] object-cover"
                />
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xs sm:text-sm text-[#819744] font-bold font-['Roboto_Serif',serif]">
                    Dull Skin
                  </p>
                </div>
              </div>

              {/* ARROW */}
              <div className="absolute left-1/2 -translate-x-1/2 z-10">
                <div className="
                  w-[60px] h-[35px]
                  sm:w-[80px] sm:h-[45px]
                  md:w-[114px] md:h-[59px]  /* desktop SAME */
                  bg-[#FAF3E2] rounded-full border border-black
                  flex items-center justify-center shadow-md
                ">
                  <FontAwesomeIcon icon={faArrowRight} className="text-sm md:text-lg" />
                </div>
              </div>

              {/* AFTER CARD */}
              <div className="
                w-[160px] h-[230px]
                sm:w-[220px] sm:h-[300px]
                md:w-[284px] md:h-[368px]  /* desktop SAME */
                bg-[#FAF3E2] rounded-[20px] md:rounded-[29px]
                overflow-hidden border border-black
                shadow-[0_8px_20px_rgba(0,0,0,0.08)]
                flex flex-col transition-transform duration-300 hover:-translate-y-1
              ">
                <img
                  src={item.after}
                  alt="after"
                  className="w-full h-[70%] md:h-[313px] object-cover"
                />
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xs sm:text-sm text-[#819744] font-bold font-['Roboto_Serif',serif]">
                    Radiant Skin
                  </p>
                </div>
              </div>

            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* NAV BUTTONS */}
      <button className="trans-prev absolute top-1/2 -translate-y-1/2 left-2 md:left-[10px] w-8 h-8 md:w-10 md:h-10 rounded-full bg-white shadow-md z-10">
        <FontAwesomeIcon icon={faChevronLeft} />
      </button>

      <button className="trans-next absolute top-1/2 -translate-y-1/2 right-2 md:right-[10px] w-8 h-8 md:w-10 md:h-10 rounded-full bg-white shadow-md z-10">
        <FontAwesomeIcon icon={faChevronRight} />
      </button>

      {/* FOOTER TEXT */}
      <p className="mt-4 md:mt-5 text-[#819744] text-sm sm:text-base md:text-[18px] font-medium font-['Roboto_Serif',serif]">
        Brighter skin in just 2 weeks
      </p>

    </section>
  );
}