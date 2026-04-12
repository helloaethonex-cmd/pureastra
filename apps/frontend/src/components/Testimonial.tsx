"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuoteRight } from "@fortawesome/free-solid-svg-icons";

const testimonials = [
  {
    name: "Victoria Linton",
    text: "Omg! I totally love it. I can see the results in just 7 days",
    image: "/img/user1.png",
  },
  {
    name: "Emma Watson",
    text: "My skin feels so fresh and glowing after using this!",
    image: "/img/user1.png",
  },
  {
    name: "Sophia Lee",
    text: "Amazing results in just a week. Highly recommend!",
    image: "/img/user1.png",
  },
  {
    name: "Olivia Brown",
    text: "Best skincare product I've ever used. Totally worth it.",
    image: "/img/user1.png",
  },
  {
    name: "Ava Johnson",
    text: "My skin looks brighter and healthier than ever!",
    image: "/img/user1.png",
  },
];

export default function Testimonial() {
  return (
    <section className="bg-[#FFFAED] px-4 sm:px-6 md:px-10 py-14 md:py-20 text-center">
      
      {/* HEADING */}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[#9E6E5B] mb-10 md:mb-12 font-['Marko_One',serif]">
        Trusted by Skin, Loved by You
      </h2>

      <Swiper
        spaceBetween={20} 
        centeredSlides={true}
        centeredSlidesBounds={true}
        loop={true}
        autoplay={{
          delay: 2500,
          disableOnInteraction: false,
        }}
        modules={[Autoplay]}
        breakpoints={{
          0: { slidesPerView: 1, spaceBetween: 20 },
          576: { slidesPerView: 2, spaceBetween: 30 },
          768: { slidesPerView: 2, spaceBetween: 40 },
          1024: { slidesPerView: 3, spaceBetween: 80 }, 
        }}
        className="py-5 px-2"
      >
        {testimonials.map((item, index) => (
          <SwiperSlide key={index}>
            
            {/* CARD */}
            <div className="
              relative bg-white w-full 
              min-h-[180px] md:h-45  
              mb-5 rounded-3xl 
              px-5 sm:px-6 md:px-7.5 
              pt-6 md:pt-7.5 
              pb-6 md:pb-7.5 
              pl-14 sm:pl-16 md:pl-17.5
              shadow-[0_8px_0_#e8dfd2] 
              transition-all duration-300 z-20
            "> 

              {/* QUOTE ICON */}
              <div className="absolute -top-2 right-4 md:right-6 text-4xl md:text-6xl text-[#5e2b15]">
                <FontAwesomeIcon icon={faQuoteRight} />
              </div>

              {/* CONTENT */}
              <div className="flex gap-3 items-center">

                {/* IMAGE */}
                {/* <div
                  className="
                    absolute 
                    -left-5 sm:-left-6 md:-left-7.5 
                    top-8 md:top-10 
                    w-16 h-16 
                    sm:w-20 sm:h-20 
                    md:w-23.75 md:h-23.75 
                    rounded-full 
                    border-[4px] md:border-[6px] border-[#f5efe6] 
                    overflow-hidden
                  "
                > */}
                <div
  className="
    absolute 
    -left-8 md:-left-10   /* ADJUSTED */
    top-8 md:top-10 
    w-16 h-16 
    sm:w-20 sm:h-20 
    md:w-24 md:h-24 
    rounded-full 
    border-[4px] md:border-[6px] border-[#f5efe6] 
    overflow-hidden
  "
>
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 64px, (max-width: 1024px) 80px, 95px"
                    loading="lazy"
                  />
                </div>

                <div>
                  <h5 className="text-base sm:text-lg md:text-[22px] text-[#819744] font-['Roboto_Serif',serif] mb-1 font-semibold">
                    {item.name}
                  </h5>

                  <div className="text-[#FFF200] mb-2 text-sm md:text-base">
                    ★★★★★
                  </div>

                  <p className="text-sm md:text-[15px] font-['Roboto_Serif',serif] text-[#819744] leading-relaxed max-w-[95%] md:max-w-[90%]">
                    {item.text}
                  </p>
                </div>

              </div>
            </div>

          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
