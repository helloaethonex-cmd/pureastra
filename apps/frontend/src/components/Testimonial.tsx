"use client";

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
    <section className="bg-[#FFFAED] px-10 py-20 text-center ">
      <h2 className="text-4xl font-semibold text-[#9E6E5B] mb-12.5 font-['Marko_One',serif]">
        Trusted by Skin, Loved by You
      </h2>

      <Swiper
        slidesPerView={3}
        spaceBetween={80}
        centeredSlides={true}
        centeredSlidesBounds={true}
        loop={true}
        autoplay={{
          delay: 2500,
          disableOnInteraction: false,
        }}
        modules={[Autoplay]}
        breakpoints={{
          0: { slidesPerView: 1 },
          576: { slidesPerView: 2 },
          768: { slidesPerView: 3 },
          1024: { slidesPerView: 3 },
        }}
        className="py-5 px-2"
      >
        {testimonials.map((item, index) => (
          <SwiperSlide key={index}>
            {/* Card */}
            <div className="relative bg-white w-full h-45 mb-5 rounded-3xl px-7.5 pt-7.5 pb-7.5 pl-17.5 shadow-[0_8px_0_#e8dfd2] transition-all duration-300 z-20">
              {/* Quote Icon */}
              <div className="absolute -top-2.5 right-6 text-6xl text-[#5e2b15] font-black leading-none">
                <FontAwesomeIcon icon={faQuoteRight} />
              </div>

              {/* Content */}
              <div className="flex gap-3.75 items-center">
                <img
                  src={item.image}
                  className="absolute -left-7.5 top-10 w-23.75 h-23.75 rounded-full border-[6px] border-[#f5efe6] object-cover"
                  alt={item.name}
                />

                <div>
                  <h5 className="text-[22px] text-[#819744] font-['Roboto_Serif',serif] mb-1.25 font-semibold">
                    {item.name}
                  </h5>

                  <div className="text-[#FFF200] mb-2.5 text-base">★★★★★</div>

                  <p className="text-[15px] font-['Roboto_Serif',serif] text-[#819744] leading-relaxed max-w-[90%]">
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
