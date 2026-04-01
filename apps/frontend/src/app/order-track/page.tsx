"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBox,
  faArrowsRotate,
  faMotorcycle,
  faGift,faCheck
} from "@fortawesome/free-solid-svg-icons";

export default function OrderTrackPage() {

  const steps = [
    {
      title: "Order Confirmed",
      desc: "Order Placed and confirmed",
      icon: faBox,
      color: "text-[#7BAE3C]", // green
      active: true,
    },
    {
      title: "Shipping",
      desc: "Order Placed and confirmed",
      icon: faArrowsRotate,
      color: "text-[#3B82F6]", // blue
    },
    {
      title: "Transit",
      desc: "Order Placed and confirmed",
      icon: faMotorcycle,
      color: "text-[#F97316]", // orange
    },
    {
      title: "Delivered Successfully",
      desc: "Order Placed and confirmed",
      icon: faGift,
      color: "text-[#EC4899]", // pink
    },
  ];

  return (
    <div className="bg-[#F5F0E6] min-h-screen py-16">

      {/* MAIN CONTAINER */}
      <div className="w-[1144px] mx-auto flex items-end justify-between">

        {/* ================= LEFT TIMELINE ================= */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-[762px] h-[565px] bg-[#EDE3D2] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
        >

          <div className="relative">

            {/* VERTICAL LINE */}
             <div className="absolute left-[12px] top-2 bottom-2 w-[2px] border-l-2  border-[#989898]" />

            {/* STEPS */}
            <div className="space-y-20">

              {steps.map((step, index) => (
                <div key={index} className="grid grid-cols-[30px_60px_1fr] items-center gap-4">

                  {/* STEP DOT */}
                  <div className="relative z-10">
                    {index === 0 ? (
                      <div className="w-6 h-6 bg-[#7BAE3C] rounded-full flex items-center justify-center">
                        <FontAwesomeIcon icon={faCheck} className="text-white text-[12px]" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 border border-[#C9B8A5] rounded-full text-xs flex items-center justify-center text-[#7B6A58] bg-[#EDE3D2]">
                        {index + 1}
                      </div>
                    )}
                  </div>

                  {/* ICON */}
                  <div className={`text-3xl ${step.color}`}>
                    <FontAwesomeIcon icon={step.icon} />
                  </div>

                  {/* TEXT */}
                  <div>
                    <h3 className="text-[#5E2B15] font-semibold text-[18px] font-['Poppins']">
                      {step.title}
                    </h3>
                    <p className="text-[#8C7A68] text-sm">
                      {step.desc}
                    </p>
                  </div>

                </div>
              ))}

            </div>

          </div>

        </motion.div>

        {/* ================= RIGHT SIDEBAR ================= */}
        <div className="relative w-[382px] h-[620px] bg-[#5E2B15] text-white shadow-xl flex flex-col -ml-6">

          {/* CUT SHAPES */}
          <div className="absolute top-0 -left-[30px] w-0 h-0 border-l-[60px] border-l-transparent border-b-[60px] border-b-[#5E2B15]" />
          <div className="absolute bottom-0 -left-[30px] w-0 h-0 border-l-[60px] border-l-transparent border-t-[60px] border-t-[#5E2B15]" />

          {/* HEADER */}
          <Link href="/profile">
            <div className="text-center py-6 text-[20px] font-semibold border-b border-white/20 ">
              Profile
            </div>
          </Link>
          {/* MENU */}
          <div className="flex flex-col flex-1 justify-around text-center text-[20px]">

            {[
              { name: "Order Track", href: "/order-track" },
              { name: "Order History", href: "/order-history" },
              { name: "Wishlist", href: "/wishlist" },
              { name: "Offer", href: "/offers" },
              { name: "Log out", href: "#" },
            ].map((item, i) => (
              <Link key={i} href={item.href}>
                <div
                  className={`py-6 border-b border-white/20 cursor-pointer ${
                    item.name === "Order Track"
                      ? "bg-[#4a1f0f]"
                      : "hover:bg-[#4a1f0f]"
                  }`}
                >
                  {item.name}
                </div>
              </Link>
            ))}

          </div>

        </div>

      </div>
    </div>
  );
}