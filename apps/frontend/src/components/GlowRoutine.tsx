"use client";

import { motion } from "framer-motion";

export default function GlowRoutine() {
  const steps = [
    {
      title: "Refresh",
      desc: "Start your day by cleansing your face to remove overnight oil and toxins",
      img: "/img/routine-1.webp",
    },
    {
      title: "Tone",
      desc: "Apply a natural toner to shrink pores and restore pH balance",
      img: "/img/routine-2.webp",
    },
    {
      title: "Nourish",
      desc: "Use a lightweight serum or essence packed with natural extracts",
      img: "/img/routine-3.webp",
    },
    {
      title: "Moisturize",
      desc: "Keep your skin hydrated and smooth with a moisturizer",
      img: "/img/routine-4.webp",
    },
    {
      title: "Shield",
      desc: "Apply sunscreen to protect from sun damage and pollution",
      img: "/img/routine-5.webp",
    },
  ];

  return (
    <section className="bg-[#EBF1DC] px-[16px] md:px-[30px] lg:px-[60px] py-[50px] md:py-[70px] lg:py-[80px]">
      
      {/* TITLE */}
      <h2 className="text-center text-[#9E6E5B] font-['Marko_One',serif] text-[22px] md:text-[26px] lg:text-[28px] mb-[30px] md:mb-[40px]">
        Your Daily Organic Glow Routine
      </h2>

      {/* ================= MOBILE VIEW ================= */}
      <div className="md:hidden flex flex-col items-center">

        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center">

            {/* CARD */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="w-[230px] bg-[#E3E8D5] rounded-xl p-3 shadow-sm text-center"
            >
              <img
                src={step.img}
                alt={step.title}
                className="w-full h-[140px] object-cover rounded-lg mb-2"
              />

              <h4 className="text-[#3B7509] font-semibold text-[14px]">
                {step.title}
              </h4>

              <p className="text-[12px] text-[#3B7509] mt-1 leading-tight">
                {step.desc}
              </p>
            </motion.div>

            {/* CONNECTOR (except last item) */}
            {index !== steps.length - 1 && (
              <>
                {/* LINE */}
                <div className="h-[40px] w-[4px] bg-[#819743]" />

                {/* DOT */}
                <div className="h-5 w-5 rounded-full border-4 border-[#B0900F] bg-white my-2" />

                {/* LINE */}
                <div className="h-[40px] w-[4px] bg-[#819743]" />
              </>
            )}

          </div>
        ))}

      </div>

      {/* ================= DESKTOP VIEW ================= */}
      <div className="hidden md:block relative">

        <div className="absolute left-1/2 top-0 bottom-0 w-[6px] -translate-x-1/2 rounded-[10px] 
        bg-[linear-gradient(to_bottom,#819743_0%,#B0900F_51%,#5E2B16_100%)]" />

        {steps.map((step, index) => {
          const isLeft = index % 2 === 0;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="mb-[50px] grid grid-cols-[1fr_60px_1fr] items-center"
            >

              {/* LEFT */}
              <div className="px-5">
                {isLeft ? (
                  <motion.img
                    src={step.img}
                    alt={step.title}
                    whileHover={{ scale: 1.05 }}
                    className="w-full rounded-md"
                  />
                ) : (
                  <div>
                    <h4 className="text-[#3B7509] font-semibold mb-2">
                      {step.title}
                    </h4>
                    <p className="text-sm text-[#3B7509]">
                      {step.desc}
                    </p>
                  </div>
                )}
              </div>

              {/* DOT */}
              <div className="z-[2] m-auto h-5 w-5 rounded-full border-4 border-[#B0900F] bg-white" />

              {/* RIGHT */}
              <div className="px-5">
                {isLeft ? (
                  <div>
                    <h4 className="text-[#3B7509] font-semibold mb-2">
                      {step.title}
                    </h4>
                    <p className="text-sm text-[#3B7509]">
                      {step.desc}
                    </p>
                  </div>
                ) : (
                  <motion.img
                    src={step.img}
                    alt={step.title}
                    whileHover={{ scale: 1.05 }}
                    className="w-full rounded-md"
                  />
                )}
              </div>

            </motion.div>
          );
        })}
      </div>

    </section>
  );
}