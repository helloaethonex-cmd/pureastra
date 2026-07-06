"use client";

import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";

export default function GlowRoutine() {
  const steps = [
    {
      title: "Refresh",
      img: "/img/routine-1.webp",
    },
    {
      title: "Tone",
      img: "/img/routine-2.webp",
    },
    {
      title: "Nourish",
      img: "/img/routine-3.webp",
    },
    {
      title: "Moisturize",
      img: "/img/routine-4.webp",
    },
    {
      title: "Shield",
      img: "/img/routine-5.webp",
    },
  ];

  return (
    <section className="bg-[#EBF1DC] px-[16px] md:px-[30px] lg:px-[40px] py-[50px]">

      {/* HEADING (UNCHANGED) */}
      <h2 className="text-center text-[#9E6E5B] font-['Marko_One',serif] text-[22px] md:text-[26px] lg:text-[28px] mb-[30px] md:mb-[40px]">
        Your Daily Organic Glow Routine
      </h2>

      {/* ================= MOBILE ================= */}
      <div className="block sm:hidden">
        <Swiper
          modules={[Autoplay]}
          autoplay={{ delay: 2500, disableOnInteraction: false }}
          spaceBetween={14}
          slidesPerView={1.2}
        >
          {steps.map((step, index) => (
            <SwiperSlide key={index}>
              <Card step={step} index={index} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* ================= TABLET ================= */}
      <div className="hidden sm:block lg:hidden">
        <Swiper
          modules={[Autoplay]}
          autoplay={{ delay: 2500, disableOnInteraction: false }}
          spaceBetween={16}
          slidesPerView={2.2}
        >
          {steps.map((step, index) => (
            <SwiperSlide key={index}>
              <Card step={step} index={index} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* ================= DESKTOP (5 CARDS FIXED) ================= */}
      <div className="hidden lg:grid grid-cols-5 gap-4">

        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative rounded-xl overflow-hidden group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- fixed layout with hover-scale transform; converting to next/image risks visual regression */}
            <img
              src={step.img}
              alt={step.title}
              className="w-full h-[260px] xl:h-[300px] object-cover transition duration-300 group-hover:scale-105"
            />

            {/* overlay */}
            <div className="absolute inset-0 bg-black/20" />

            {/* text */}
            <div className="absolute bottom-4 w-full text-center">
              <h3 className="text-white text-[16px] xl:text-[18px] font-semibold">
                {step.title}
              </h3>
            </div>
          </motion.div>
        ))}

      </div>

    </section>
  );
}

/* ================= CARD ================= */
function Card({
  step,
  index,
}: {
  step: { title: string; img: string };
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className="relative rounded-xl overflow-hidden"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed layout; converting to next/image risks visual regression */}
      <img
        src={step.img}
        alt={step.title}
        className="w-full h-[260px] object-cover"
      />

      <div className="absolute inset-0 bg-black/20" />

      <div className="absolute bottom-4 w-full text-center">
        <h3 className="text-white text-[16px] font-semibold">
          {step.title}
        </h3>
      </div>
    </motion.div>
  );
}
