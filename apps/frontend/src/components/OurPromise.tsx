"use client";

import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLeaf,
  faFlask,
  faHandHoldingHeart,
  faGlobe,
  faPaw,
} from "@fortawesome/free-solid-svg-icons";

const features = [
  {
    icon: faLeaf,
    title: "Crafted with pure, real ingredients",
  },
  {
    icon: faFlask,
    title: "Free from parabens, sulfates & harsh additives",
  },
  {
    icon: faHandHoldingHeart,
    title: "A portion supports cancer patients",
  },
  {
    icon: faGlobe,
    title: "Committed to people, society & planet",
  },
  {
    icon: faPaw,
    title: "Never tested on animals",
  },
];

export default function WhyUs() {
  return (
    <section className="w-full bg-[#dfe8d2] py-12 md:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 text-center">
        
        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-xl md:text-2xl lg:text-3xl font-semibold text-[#556b2f] tracking-wide"
        >
          Our Promise: Gentle, Honest, Thoughtfully Formulated Skincare
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-3 text-xs md:text-sm lg:text-base text-gray-600"
        >
          Toxin-free | Fragrance-free | Paraben-free | Sulfate-free | pH balanced
        </motion.p>

        {/* Grid */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 md:gap-8">
          {features.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className="flex flex-col items-center text-center group"
            >
              {/* Icon */}
              <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-full bg-[#cfdcb3] group-hover:scale-110 transition">
                <FontAwesomeIcon
                  icon={item.icon}
                  className="text-2xl md:text-3xl text-[#556b2f]"
                />
              </div>

              {/* Text */}
              <p className="mt-3 text-xs md:text-sm text-gray-700 max-w-[140px]">
                {item.title}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}