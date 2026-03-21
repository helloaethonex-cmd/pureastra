"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping } from "@fortawesome/free-solid-svg-icons";
import { faHeart } from "@fortawesome/free-regular-svg-icons";

export default function ProductCard({ active }: { active?: boolean }) {
  const hoverTags = [
    "Brighten Skin",
    "Promote Even Skin Tone",
    "Fights Free Radical Damage",
    "Made Safe Certified",
  ];

  return (
    <div className="group relative h-105 w-full scale-[0.85] overflow-hidden rounded-[25px] bg-[#D9D9D9] opacity-90 transition-all duration-400 ease-in-out before:pointer-events-none before:absolute before:bottom-0 before:z-1 before:h-30 before:w-full before:bg-linear-to-t before:from-black/25 before:to-transparent in-[.swiper-slide-active_&]:z-2 in-[.swiper-slide-active_&]:scale-100 in-[.swiper-slide-active_&]:opacity-100 in-[.swiper-slide-next_&]:scale-90 in-[.swiper-slide-next_&]:opacity-[0.85] in-[.swiper-slide-prev_&]:scale-90 in-[.swiper-slide-prev_&]:opacity-[0.85]">
      {/* Image */}
      <img
        src="/img/Facewash.jpeg"
        alt="product"
        className="w-full h-full object-cover"
      />

      {/* ICON CIRCLE */}
      <div className="absolute top-3.75 right-3.75 w-10 h-10 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center z-5">
        <FontAwesomeIcon
          icon={faCartShopping}
          className="absolute text-base text-white transition duration-300 group-hover:scale-[0.8] group-hover:opacity-0"
        />
        <FontAwesomeIcon
          icon={faHeart}
          className="absolute text-base text-white opacity-0 transition duration-300 group-hover:scale-110 group-hover:opacity-100"
        />
      </div>

      {/* NORMAL DETAILS */}
      <div
        className={`absolute bottom-0 z-3 flex w-full flex-col justify-end border-t border-white/15 bg-black/15 px-4.5 py-4 text-white backdrop-blur-md transition-opacity duration-300 group-hover:opacity-0 ${active ? "show" : ""}`}
      >
        <h5 className="text-[18px] font-semibold mb-1 font-['Roboto_Serif',serif]">
          Vitamin C Face wash
        </h5>

        <p className="font-['Poppins',sans-serif] text-[13px] leading-[1.4] mb-2 opacity-90">
          The first step in a skincare routine, cleansing or washing your face,
          helps eliminate excess oil, dirt, and lethargy. Pureastra Vitamin C
          Face Wash with Vitamin C and Turmeric&apos;s goodness has brightening
          properties to give your skin a natural glow.
        </p>

        <div className="flex justify-between">
          <span>100ml</span>
          <span>₹590</span>
        </div>
      </div>

      <div className="absolute bottom-0 flex h-0 w-full flex-col items-start justify-center overflow-hidden bg-linear-to-t from-black/65 to-black/20 p-7.5 text-[#D9D9D9] backdrop-blur-[10px] transition-[height] duration-400 ease-in-out group-hover:h-full">
        <h4 className="mb-4.5 translate-y-5 text-left text-[26px] font-semibold opacity-0 transition duration-400 ease-in-out group-hover:translate-y-0 group-hover:opacity-100">
          Vitamin C Face wash
        </h4>
        <div className="flex w-full flex-col items-start gap-3 opacity-0 translate-y-5 transition duration-400 ease-in-out group-hover:translate-y-0 group-hover:opacity-100">
          {hoverTags.map((tag, idx) => (
            <span
              key={tag}
              className="translate-y-5 rounded-[20px] bg-white/25 px-4 py-2 text-[14px] opacity-0 transition duration-400 ease-in-out group-hover:translate-y-0 group-hover:opacity-100"
              style={{ transitionDelay: `${(idx + 1) * 0.2}s` }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
