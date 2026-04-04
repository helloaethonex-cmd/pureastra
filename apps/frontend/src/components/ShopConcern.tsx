"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";

/* TYPES */
type TabType = "skin" | "hair" | "body";

type ConcernItem = {
  name: string;
  img: string;
};

/* DATA */
const concernsData: Record<TabType, ConcernItem[]> = {
  skin: [
    { name: "Dull / Uneven Skin", img: "/img/concerns/dull.png" },
    { name: "Tanned Skin", img: "/img/concerns/tanned.png" },
    { name: "Damaged Barrier", img: "/img/concerns/barrier.png" },
    { name: "Acne / Breakouts", img: "/img/concerns/acne.png" },
    { name: "Dark Spots", img: "/img/concerns/spots.png" },
    { name: "Blackheads", img: "/img/concerns/blackheads.png" },
    { name: "Dark Circles", img: "/img/concerns/dark-circles.png" },
    { name: "Dry Lips", img: "/img/concerns/lips.png" },
    { name: "Oily Skin", img: "/img/concerns/oily.png" },
    { name: "Polluted Skin", img: "/img/concerns/pollution.png" },
    { name: "Dead Skin", img: "/img/concerns/deadskin.png" },
  ],
  hair: [
    { name: "Frizzy Hair", img: "/img/concerns/frizzy.png" },
    { name: "Hair Fall", img: "/img/concerns/hairfall.png" },
  ],
  body: [
    { name: "Underarm Pigmentation", img: "/img/concerns/underarm.png" },
    { name: "Cracked Feet", img: "/img/concerns/feet.png" },
  ],
};

export default function ShopConcern() {
  const [activeTab, setActiveTab] = useState<TabType>("skin");

  /* IMPORTANT: tabs MUST be inside component */
  const tabs: { key: TabType; label: string }[] = [
    { key: "skin", label: "Skin" },
    { key: "hair", label: "Hair" },
    { key: "body", label: "Body" },
  ];

  return (
    <section className="py-10 sm:py-12 px-4 sm:px-6 md:px-10 bg-[#F5F0E6]" id="shop-concern">

      {/* HEADING */}
      <h2 className="text-2xl md:text-3xl text-center text-[#6B3E2E] font-semibold mb-6">
        Shop by Concern
      </h2>

      {/* TABS */}
      <div className="flex justify-center gap-3 mb-8 sm:mb-10 flex-wrap">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                px-5 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300
                ${
                  isActive
                    ? "bg-[#819744] text-white shadow-lg scale-105"
                    : "bg-white/70 text-[#5A3A2A] backdrop-blur-md border border-[#e6d5c3] hover:bg-white"
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* BACKGROUND SECTION */}
      <div className="relative rounded-2xl overflow-hidden py-8 sm:py-10 md:py-12 px-2 sm:px-4 md:px-6">
        <Image
          src="/img/shopbyconcern-banner.png"
          alt="Shop by concern background"
          fill
          className="object-cover"
          sizes="100vw"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/20"></div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
          className="
            relative z-10
            grid gap-5 sm:gap-6 md:gap-8
            grid-cols-3
            sm:grid-cols-4
            md:grid-cols-5
            lg:grid-cols-6
            xl:grid-cols-7
          "
        >
          {concernsData[activeTab].map((item, idx) => (
            <motion.div
              key={idx}
              variants={{
                hidden: { opacity: 0, y: 40 },
                visible: { opacity: 1, y: 0 },
              }}
              whileHover={{ scale: 1.08, y: -5 }}
              className="flex flex-col items-center text-center cursor-pointer"
            >
              <div className="
                w-[65px] h-[65px]
                sm:w-[75px] sm:h-[75px]
                md:w-[85px] md:h-[85px]
                rounded-full bg-white/80 backdrop-blur-sm
                flex items-center justify-center
                overflow-hidden
                border border-[#e6d5c3]
                shadow-md
              ">
                <Image
                  src={item.img}
                  alt={item.name}
                  width={85}
                  height={85}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  sizes="(max-width: 768px) 65px, (max-width: 1024px) 75px, 85px"
                />
              </div>

              <p className="text-[11px] sm:text-xs md:text-sm mt-2 text-[#2f1e14] font-medium">
                {item.name}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

    </section>
  );
}
