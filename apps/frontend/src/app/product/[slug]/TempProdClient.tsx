"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faStar,
  faMinus,
  faPlus,
  faLeaf,
  faSkullCrossbones,
  faHandHoldingHeart,
  faGlobe,
  faPaw,
  faClipboardCheck,
  faSnowflake,
  faArrowRight,
  faBolt,
  faDroplet,
  faSun,
  faCheckCircle,
  faStarHalfStroke,
  faShoppingBag,
  faIndustry,
  faBox,
  faBuilding,
  faThumbsUp,
  faThumbsDown,
  faBalanceScale,
} from "@fortawesome/free-solid-svg-icons";

import { motion, AnimatePresence } from "framer-motion";

export default function ProductClient({ product }: any) {
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [tab, setTab] = useState("desc");
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  // SWIPE HANDLER
  const handleSwipe = (direction: "left" | "right") => {
    if (direction === "left") {
      setActiveImg((prev) => (prev + 1) % product.images.length);
    } else {
      setActiveImg((prev) =>
        prev === 0 ? product.images.length - 1 : prev - 1,
      );
    }
  };

  let startX = 0;

  const products = [
    {
      img: "/img/facewash.png",
      title: "Vitamin C Face wash",
      price: 590,
    },
    {
      img: "/img/facewash.png",
      title: "Rice Face Wash",
      price: 690,
    },
    {
      img: "/img/facewash.png",
      title: "Glow Cleanser",
      price: 750,
    },
  ];

  const faqs = [
    {
      q: "Is this face wash safe to use during pregnancy?",
      a: "Yes! Our Vitamin C Facewash is pregnancy-safe and gentle on sensitive skin, making it suitable for expecting mothers.",
    },
    {
      q: "How is this face wash different from other Vitamin C face washes?",
      a: "Unlike many face washes that only use fruit extracts, our formula contains a stable, active form of Vitamin C along with rice extract. It brightens skin, removes tan, and maintains a healthy skin barrier.",
    },
    {
      q: "Can this face wash help with dullness and uneven skin tone?",
      a: "Absolutely! Vitamin C, Tangerine, and Papaya Extracts work together to even skin tone, brighten your complexion, and reduce dullness over time.",
    },
    {
      q: "Will this face wash hydrate my skin or make it dry?",
      a: "Yes! With Glycerine and Sodium PCA, it hydrates, plumps, and balances skin, leaving it soft without dryness.",
    },
    {
      q: "How quickly can I see results?",
      a: "Many users notice softer skin from the first wash, with visible brightening and tan removal in 2–4 weeks.",
    },
    {
      q: "Is this face wash suitable for all skin types?",
      a: "Yes! It is gentle and effective for oily, dry, combination, and sensitive skin.",
    },
    {
      q: "Is this face wash vegan and cruelty-free?",
      a: "Yes! It is 100% vegan, cruelty-free, and never tested on animals.",
    },
  ];
  return (
    <section className="bg-[#FAF3E2]">
      {/* TOP HEADER BANNER */}
      <div
        className="relative px-4 sm:px-6 md:px-12 py-6 md:py-10 flex items-center justify-between
        bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/img/facewash.jpeg')",
        }}
      >
        {/* OVERLAY (for readability) */}
        <div className="absolute inset-0 bg-black/30"></div>

        {/* CONTENT */}
        <div className="relative z-10 flex items-center justify-between w-full">
          {/* LEFT TITLE */}
          <h1 className="text-white text-[18px] sm:text-[22px] md:text-[34px] font-semibold md:font-bold font-['Roboto',serif]">
            Face wash
          </h1>

          {/* RIGHT IMAGE (CIRCLE) */}
          <div
            className="w-[70px] h-[70px] sm:w-[60px] sm:h-[60px] md:w-[90px] md:h-[90px] 
          bg-white rounded-full flex items-center justify-center shadow-md"
          >
            <img
              src="/img/thumb.png"
              alt="product"
              className="w-[70%] h-[70%] md:w-[60%] md:h-[60%] object-contain"
            />
          </div>
        </div>
      </div>

      {/* TOP */}
      {/* <div className="px-6 md:px-12 py-10 grid grid-cols-2 gap-10 max-md:grid-cols-1">   */}
      <div className="px-4 md:px-12 py-6 md:py-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        {/* LEFT */}
        <div>
          {/* MAIN IMAGE */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
            className="w-full h-[500px] sm:h-[320px] md:h-[500px] flex items-center justify-center overflow-hidden"
            onTouchStart={(e) => (startX = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              const endX = e.changedTouches[0].clientX;
              if (startX - endX > 50) handleSwipe("left");
              if (endX - startX > 50) handleSwipe("right");
            }}
          >
            <motion.div
              whileHover={{ scale: 1.2 }}
              transition={{ duration: 0.4 }}
              className="w-full h-full"
            >
              <Image
                src={product.images[activeImg]}
                alt={product.name}
                width={665}
                height={646}
                className="w-full h-full object-contain"
              />
            </motion.div>
          </motion.div>

          {/* THUMBNAILS */}
          <div className="flex gap-4 mt-4 overflow-x-auto scroll-smooth">
            {product.images.map((img: string, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ scale: 1.05 }}
                // onClick={() => setActiveImg(i)}
                // className={`w-[90px] h-[90px] rounded-lg overflow-hidden cursor-pointer border transition ${
                //   activeImg === i
                //     ? "border-2 border-[#819744]"
                //     : "border-transparent opacity-70 hover:opacity-100"
                // }`}
                onClick={() => setActiveImg(i)}
                className={`min-w-[90px] h-[90px] sm:min-w-[70px] sm:h-[70px] md:w-[90px] md:h-[90px]
                rounded-lg overflow-hidden cursor-pointer border ${
                  activeImg === i ? "border-2 border-[#819744]" : "opacity-70"
                }`}
              >
                <Image
                  src={img}
                  alt="thumb"
                  width={100}
                  height={100}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="pt-2">
          {/* TITLE */}
          <motion.h2 className="text-[30px] sm:text-[24px] md:text-[30px] font-bold text-[#5E2B16] mb-2">
            {product.name}
          </motion.h2>

          {/* RATING */}
          <div className="flex items-center gap-2 mt-2 mb-4">
            <div className="flex text-[#FACC15]">
              {[...Array(5)].map((_, i) => (
                <FontAwesomeIcon key={i} icon={faStar} />
              ))}
            </div>
            <span className="text-sm text-[#8B5E3C] text-[14px] text-semibold">
              12 Customer review
            </span>
          </div>

          {/* QUICK INFO */}
          <div className="space-y-2 mb-4">
            <p className="text-green-700 font-semibold text-[14px] flex items-center gap-2">
              <FontAwesomeIcon icon={faShoppingBag} />
              1,000+ Units Sold in 7 Days
            </p>

            <p className="text-[14px] text-[#8B5E3C] flex items-center gap-2">
              <FontAwesomeIcon
                icon={faStarHalfStroke}
                className="text-yellow-500"
              />
              4.8/5 Rating
            </p>

            <div className="flex flex-wrap gap-2 text-[12px]">
              {[
                { text: "Brightens", icon: faSun },
                { text: "Refresh", icon: faBolt },
                { text: "Gentle", icon: faDroplet },
                { text: "Non-Drying", icon: faCheckCircle },
                { text: "pH Balanced", icon: faLeaf },
              ].map((tag, i) => (
                <span
                  key={i}
                  className="bg-[#E6F0D6] text-[#5E2B16] px-3 py-1 rounded-full flex items-center gap-1"
                >
                  <FontAwesomeIcon icon={tag.icon} className="text-[10px]" />
                  {tag.text}
                </span>
              ))}
            </div>

            <p className="text-[#5E2B16] font-semibold flex items-center gap-2">
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="text-green-600"
              />
              Try It Once. You’ll Reorder.
            </p>
          </div>

          {/* DESCRIPTION */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-[14px] text-[#5E2B16] leading-6 mb-6 max-w-[500px]"
          >
            Discover the power of our Vitamin C Face Wash, enriched with stable
            Vitamin C, natural papaya and tangerine extracts, and hydrating
            sodium PCA. This gentle, toxin-free, fragrance-free, paraben-free,
            sulfate-free, and SLS-free formula cleanses effectively while
            keeping your skin balanced, refreshed, and nourished. Say goodbye to
            dullness and uneven skin, lock in moisture for soft, supple skin,
            and enjoy balanced care that leaves your face feeling clean,
            energized, and healthy.
          </motion.p>

          {/* SIZE */}
          <div className="mb-5 flex items-center gap-4">
            {/* HEADING */}
            <p className="font-['Roboto_Flex'] font-semibold text-[20px] text-[#3B7509]">
              Size :
            </p>

            {/* BUTTONS */}
            <div className="flex items-center gap-3">
              {/* 50 ml */}
              <button
                onClick={() => setActiveIndex(0)}
                className={`px-4 py-1.5 text-[12px] rounded-full shadow-sm ${
                  activeIndex === 0
                    ? "bg-[#819744] text-[#5E2B16] font-semibold"
                    : "bg-[#EBF1DC] text-[#5E2B16]"
                }`}
              >
                50 ml
              </button>

              {/* 100 ml */}
              <button
                onClick={() => setActiveIndex(1)}
                className={`px-4 py-1.5 text-[12px] rounded-full shadow-sm ${
                  activeIndex === 1
                    ? "bg-[#819744] text-[#5E2B16] font-semibold"
                    : "bg-[#EBF1DC] text-[#5E2B16]"
                }`}
              >
                100 ml
              </button>
            </div>
          </div>

          {/* PRICE */}
          <div className="mb-4">
            {/* PRICE ROW */}
            <div className="flex items-center gap-3 mb-5">
              <p className="text-[28px] md:text-[24px] font-bold text-[#5E2B16]">
                ₹370
              </p>

              <span className="text-[#5E2B16]/60 line-through text-[16px]">
                ₹390
              </span>

              <p className="text-sm text-[#8B5E3C]">
                (MRP Inclusive of all taxes)
              </p>
            </div>

            {/* SAVING TEXT */}
            <p className="text-[#819744] font-semibold text-[14px] mt-1">
              You’ll save ₹20
            </p>
          </div>

          {/* BEST SUITED */}
          <p className="mb-6 text-[15px]">
            <span className="font-['Roboto_Flex'] font-semibold text-[20px] text-[#3B7509]">
              Best suited for:
            </span>{" "}
            <span className="font-['Roboto_Flex'] font-semibold text-[18px] text-[#5E2B16]">
              all skin types
            </span>
          </p>

          {/* QUANTITY + CART */}
          <div className="flex flex-col items-center sm:flex-row gap-6 sm:gap-6 mb-8">
            {/*  QUANTITY BOX */}
            <div className="flex border border-[#cfc7b8] h-[42px] rounded-lg font-semibold text-[14px] text-[#5E2B16]">
              {/* MINUS */}
              <button
                onClick={() => setQty(qty > 1 ? qty - 1 : 1)}
                className="w-[42px] flex items-center justify-center text-[#5E2B16]"
              >
                <FontAwesomeIcon icon={faMinus} />
              </button>

              {/* VALUE */}
              <span className="w-[42px] flex items-center justify-center border-l border-r border-[#cfc7b8] text-[#819744] font-semibold">
                {qty}
              </span>

              {/* PLUS */}
              <button
                onClick={() => setQty(qty + 1)}
                className="w-[42px] flex items-center justify-center text-[#5E2B16]"
              >
                <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>
            <div className="hidden md:flex flex-col sm:flex-row gap-4 sm:gap-6">
              {/* ADD TO CART */}
              <button className="flex h-[42px] w-full sm:w-auto hover:scale-105 transition rounded-lg font-semibold">
                <span className="bg-[#E5EAD9] text-[#5E2B16] px-6 flex items-center font-semibold text-[14px] tracking-wide">
                  ADD TO CART
                </span>
                <span className="bg-[#819744] text-white px-4 flex items-center">
                  <FontAwesomeIcon icon={faCartShopping} />
                </span>
              </button>

              {/* BUY NOW */}
              <button className="bg-[#819744] text-white px-5 h-[42px] rounded-lg font-semibold flex items-center gap-2 w-full sm:w-auto hover:opacity-90 hover:scale-105 transition">
                <FontAwesomeIcon icon={faBolt} />
                Buy Now
              </button>
            </div>
          </div>

          {/* TABS */}
          <div className="overflow-x-auto">
            <div className="flex gap-10 border-b mb-4 md:gap-10 min-w-max">
              <button
                onClick={() => setTab("desc")}
                className={`pb-2 font-semibold text-[14px] md:text-[16px] whitespace-nowrap ${
                  tab === "desc"
                    ? "text-[#3B7509] border-b-2 border-[#5E2B16]"
                    : "text-gray-500"
                }`}
              >
                Description
              </button>

              <button
                onClick={() => setTab("reviews")}
                className={`pb-2 font-semibold text-[14px] md:text-[16px] whitespace-nowrap ${
                  tab === "reviews"
                    ? "text-[#3B7509] border-b-2 border-[#5E2B16]"
                    : "text-gray-500"
                }`}
              >
                Reviews
              </button>
            </div>
          </div>

          {/* TAB CONTENT */}
          <div className="space-y-4">
            {/* DESCRIPTION */}
            {tab === "desc" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-[#5E2B16] text-[13px] sm:text-[14px] md:text-[15px] leading-5 md:leading-6 max-w-full md:max-w-[600px] mb-6"
              >
                Discover the power of our Vitamin C Face Wash, enriched with
                stable Vitamin C, natural papaya and tangerine extracts, and
                hydrating sodium PCA. This gentle, toxin-free, fragrance-free,
                paraben-free, sulfate-free, and SLS-free formula cleanses
                effectively while keeping your skin balanced, refreshed, and
                nourished.
              </motion.div>
            )}

            {/* REVIEWS */}
            {tab === "reviews" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* RATING */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[18px] md:text-[22px] text-[#5e2b16] font-bold">
                    4.3
                  </span>
                  <FontAwesomeIcon icon={faStar} className="text-green-600" />
                  <span className="bg-green-100 text-green-700 px-2 py-[2px] rounded text-xs md:text-sm">
                    Very Good
                  </span>
                </div>

                <p className="text-[12px] md:text-[14px] text-[#8B5E3C] mb-4">
                  based on 42,213 ratings by Verified Buyers
                </p>

                {/* IMAGE GRID */}
                <div className="flex gap-2 overflow-x-auto mb-5 scroll-smooth">
                  {[1, 2, 3, 4].map((_, i) => (
                    <div
                      key={i}
                      className="min-w-[80px] md:min-w-[100px] h-[80px] md:h-[100px] bg-gray-200 rounded-lg"
                    />
                  ))}
                </div>

                {/* REVIEW SLIDER */}
                <div className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2">
                  {[1, 2, 3, 4].map((_, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.04, y: -5 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                      }}
                      className="snap-start min-w-[85%] sm:min-w-[48%] md:min-w-[350px] 
                        bg-[#F5F0E6] p-4 rounded-xl shadow-sm hover:shadow-xl space-y-3"
                    >
                      {/* HEADER */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1 text-[#819744] text-[13px] md:text-[14px]">
                          {[...Array(5)].map((_, j) => (
                            <FontAwesomeIcon key={j} icon={faStar} />
                          ))}
                        </div>

                        <span className="text-[10px] md:text-xs text-[#8B5E3C]">
                          6 Month ago
                        </span>
                      </div>

                      {/* PROGRESS BARS */}
                      <div className="space-y-2 text-[11px] md:text-[12px]">
                        {/* Brightening */}
                        <div>
                          <div className="flex justify-between items-center text-[#5E2B16] mb-1">
                            <div className="flex items-center gap-1">
                              <FontAwesomeIcon
                                icon={faSun}
                                className="text-[#819744]"
                              />
                              <span>Brightening</span>
                            </div>
                            <span>85%</span>
                          </div>
                          <div className="w-full bg-white/60 rounded-full h-2">
                            <div className="bg-[#819744] h-2 rounded-full w-[85%]" />
                          </div>
                        </div>

                        {/* Hydration */}
                        <div>
                          <div className="flex justify-between items-center text-[#5E2B16] mb-1">
                            <div className="flex items-center gap-1">
                              <FontAwesomeIcon
                                icon={faDroplet}
                                className="text-[#5C8D89]"
                              />
                              <span>Hydration</span>
                            </div>
                            <span>70%</span>
                          </div>
                          <div className="w-full bg-white/60 rounded-full h-2">
                            <div className="bg-[#A5B67A] h-2 rounded-full w-[70%]" />
                          </div>
                        </div>

                        {/* Sebum Balance */}
                        <div>
                          <div className="flex justify-between items-center text-[#5E2B16] mb-1">
                            <div className="flex items-center gap-1">
                              <FontAwesomeIcon
                                icon={faBalanceScale}
                                className="text-[#A67C52]"
                              />
                              <span>Sebum Balance</span>
                            </div>
                            <span>65%</span>
                          </div>
                          <div className="w-full bg-white/60 rounded-full h-2">
                            <div className="bg-[#C3CF9A] h-2 rounded-full w-[65%]" />
                          </div>
                        </div>
                      </div>

                      {/* STATUS + RATING */}
                      <div className="flex justify-between items-center text-[11px] md:text-[12px]">
                        {/* VERIFIED */}
                        <div className="flex items-center gap-2 text-[#819744] font-semibold">
                          <FontAwesomeIcon icon={faCheckCircle} />
                          Verified
                        </div>

                        {/* STARS */}
                        <div className="flex text-[#819744]">
                          {[...Array(5)].map((_, i) => (
                            <FontAwesomeIcon key={i} icon={faStar} />
                          ))}
                        </div>
                      </div>

                      {/* STATUS + RATING */}
                      <div className="flex justify-between items-center text-[11px] md:text-[12px]">
                        {/* VERIFIED */}
                        <div className="flex items-center gap-2 text-[#819744] font-semibold">
                          <FontAwesomeIcon icon={faCheckCircle} />
                          Verified
                        </div>

                        {/* STARS */}
                        <div className="flex text-[#819744]">
                          {[...Array(5)].map((_, i) => (
                            <FontAwesomeIcon key={i} icon={faStar} />
                          ))}
                        </div>
                      </div>

                      {/* REVIEW TEXT */}
                      <p className="text-[12px] md:text-[14px] text-[#5E2B16] italic leading-5">
                        Lightweight and absorbs quickly. Perfect for daily use.
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* STICKY MOBILE BAR */}
        <div className="fixed bottom-0 left-0 w-full bg-white border-t p-3 flex items-center justify-between md:hidden z-50">
          <div>
            <p className="text-[#5E2B16] font-bold">₹370</p>
            <p className="text-[11px] text-[#8B5E3C]">Inclusive of taxes</p>
          </div>

          <button className="flex-1 ml-3 bg-[#819744] text-white py-3 rounded-lg flex items-center justify-center gap-2">
            <FontAwesomeIcon icon={faCartShopping} />
            Add to Cart
          </button>
        </div>
      </div>

      {/*  ADDITIONAL INFO */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="text-center font-['Marko-One'] 
        text-[24px] sm:text-[30px] md:text-[42px] 
        font-semibold text-[#819744] mb-8 md:mb-12"
      >
        Additional Information
      </motion.h2>

      <div className="bg-[#EBF1DC] py-8 md:py-10">
        <div
          className="
          max-w-7xl mx-auto 
          grid grid-cols-1 
          md:grid-cols-2 
          gap-8 md:gap-10 
          px-4 sm:px-6 items-center
        "
        >
          {/* LEFT */}
          <div>
            <motion.h3 className="text-[#819744] font-['Roboto_Flex'] font-bold text-[18px] sm:text-[20px] md:text-[24px] mb-5 md:mb-6">
              BENEFITS:
            </motion.h3>

            <div className="space-y-3 md:space-y-4">
              {[
                {
                  title: "Brightens and Evens Tone",
                  desc: "Vitamin C helps naturally brighten your skin and reduce uneven tone",
                },
                {
                  title: "Hydrates and Plumps",
                  desc: "Sodium PCA and Glycerin deeply hydrate and lock in moisture for soft, supple skin",
                },
                {
                  title: "Refreshes and Boosts Glow",
                  desc: "Tangerine Extract enhances radiance while Papaya rejuvenates and refreshes",
                },
                {
                  title: "Controls Oiliness and Dryness",
                  desc: "Balanced ingredients help maintain hydration and regulate excess oil",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.2 }}
                  viewport={{ once: true }}
                  className="bg-[#D9DFC8] rounded-lg md:rounded-xl px-4 md:px-5 py-3 md:py-4"
                >
                  <h4 className="font-semibold text-[#5E2B16] text-[15px] md:text-[18px]">
                    {item.title}
                  </h4>
                  <p className="text-[#8B5E3C] text-[13px] md:text-[16px] mt-1">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* INGREDIENTS */}
            <div className="mt-8 md:mt-10">
              <h3 className="text-[#819744] font-bold text-[18px] sm:text-[20px] md:text-[22px] mb-5 md:mb-6">
                INGREDIENTS:
              </h3>

              <div
                className="
                grid grid-cols-1 
                sm:grid-cols-2 
                gap-4 md:gap-5 
                text-[13px] md:text-[14px]
              "
              >
                {[
                  {
                    title: "Vitamin C",
                    desc: "Even, radiant skin",
                    icon: faSun,
                  },
                  {
                    title: "Tangerine Extract",
                    desc: "Refresh & energize",
                    icon: faBolt,
                  },
                  {
                    title: "Papaya Extract",
                    desc: "Tan-free & clear",
                    icon: faLeaf,
                  },
                  {
                    title: "Vitamin E",
                    desc: "Glow & protect",
                    icon: faCheckCircle,
                  },
                  {
                    title: "Sodium PCA",
                    desc: "Plump & hydrated",
                    icon: faDroplet,
                  },
                  {
                    title: "Glycerine",
                    desc: "Smooth & nourished",
                    icon: faDroplet,
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    className="bg-[#D9DFC8] border border-[#E6E6E6] rounded-lg md:rounded-xl p-3 md:p-4 flex items-start gap-3 shadow-sm"
                  >
                    <div className="w-[32px] h-[32px] md:w-[36px] md:h-[36px] rounded-full bg-[#EBF1DC] flex items-center justify-center">
                      <FontAwesomeIcon
                        icon={item.icon}
                        className="text-[#819744] text-sm md:text-base"
                      />
                    </div>

                    <div>
                      <h4 className="font-semibold text-[#5E2B16] text-[14px] md:text-[16px]">
                        {item.title}
                      </h4>
                      <p className="text-[#8B5E3C] text-[12px] md:text-[14px] mt-1">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* BUTTON */}
              <Link href="/ingredients">
                <button className="mt-4 bg-[#819744] text-white px-4 md:px-5 py-2 rounded-lg font-semibold flex items-center gap-2 hover:opacity-90 transition text-[13px] md:text-[14px]">
                  View Full Ingredients
                  <FontAwesomeIcon icon={faArrowRight} />
                </button>
              </Link>
            </div>

            {/* RESULTS */}
            <div className="mt-6 md:mt-8 space-y-2 md:space-y-3">
              {[
                "Week 1: 60% feel hydrated & soft",
                "Week 2: 75% notice reduced dullness",
                "Week 3: 95% see brighter skin",
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-[#D9DFC8] px-3 md:px-4 py-2 md:py-3 rounded-lg text-[#5E2B16] text-[12px] md:text-[14px] flex items-center gap-2"
                >
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="text-[#819744]"
                  />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT IMAGE */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="flex justify-center md:justify-end"
          >
            <div className="relative w-[260px] h-[220px] sm:w-[350px] sm:h-[300px] md:w-[520px] md:h-[420px]">
              <Image
                src="/img/aditional.png"
                alt="illustration"
                fill
                className="object-contain"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* WHY US */}
      <div className="bg-[#EBF1DC] py-12 md:py-16 text-center">
        {/* RADIAL BACKGROUND (ONLY FOR HEADING AREA) */}
        <div className="bg-[radial-gradient(circle,_#EBF1DC_60%,_#CCD7B2_100%)] py-6 md:py-10">
          {/* TITLE */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-[22px] sm:text-[26px] md:text-[32px] font-bold text-[#819744] font-['Roboto_Flex'] mb-3"
          >
            Whyus
          </motion.h2>

          {/* SUBTEXT */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="text-[#5C6936] text-[13px] sm:text-[15px] md:text-[18px] font-['Roboto_Flex'] font-bold max-w-[90%] md:max-w-none mx-auto"
          >
            Toxin-free | Fragrance-free | Paraben-free{" "}
            <br className="sm:hidden" />
            Sulfate-free | SLS-free ph balanced
          </motion.p>
        </div>

        {/* BACKGROUND IMAGE SECTION */}
        <div className="bg-[url('/img/why-us-banner.png')] bg-cover bg-center py-10 md:py-12">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            {/* RESPONSIVE GRID */}
            <div
              className="
                grid 
                grid-cols-2 
                sm:grid-cols-2 
                md:grid-cols-3 
                lg:grid-cols-5 
                gap-6 md:gap-8
              "
            >
              {[
                { icon: faLeaf, text: "Crafted with pure, real ingredients" },
                {
                  icon: faSkullCrossbones,
                  text: "Free from parabens, sulfates, and harsh additives",
                },
                {
                  icon: faHandHoldingHeart,
                  text: "A portion of every purchase supports cancer patients",
                },
                {
                  icon: faGlobe,
                  text: "Committed to people, society, and the planet",
                },
                { icon: faPaw, text: "Never tested on animals" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.08 }}
                  className="flex flex-col items-center text-white cursor-pointer"
                >
                  {/* ICON */}
                  <motion.div
                    whileHover={{ rotate: 5 }}
                    className="text-[36px] sm:text-[42px] md:text-[50px] mb-3 md:mb-4"
                  >
                    <FontAwesomeIcon icon={item.icon} />
                  </motion.div>

                  {/* TEXT */}
                  <p className="text-[12px] sm:text-[14px] md:text-[16px] max-w-[140px] md:max-w-[160px] font-['Roboto_Flex'] font-bold leading-snug">
                    {item.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/*  SUITABLE + USAGE + BEFORE AFTER */}
      <div className="bg-[#EBF1DC] py-10 px-4 md:px-12">
        {/* TOP GRID */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-12">
          {/* LEFT - SUITABLE */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-[#819744] font-bold text-[18px] sm:text-[20px] md:text-[24px] font-['Roboto_Flex'] mb-5 tracking-wide">
              SUITABLE FOR:
            </h3>

            <div className="space-y-3 text-[#5E2B16] text-[13px] sm:text-[14px] md:text-[16px]">
              {[
                [
                  "Skin Type:",
                  "All skin types, including sensitive, dry, oily, and combination skin",
                ],
                ["Texture:", "Smooth gel, gentle on skin"],
                ["Age:", "Ideal for teenagers (15+) and adults"],
                ["Special Conditions:", "Safe for use during pregnancy"],
                ["Gender:", "Suitable for all gender"],
              ].map((item, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <span className="text-[#5C6936] font-semibold">
                    {item[0]}
                  </span>{" "}
                  {item[1]}
                </motion.p>
              ))}
            </div>
          </motion.div>

          {/* RIGHT - USAGE */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-[#819744] font-bold text-[18px] sm:text-[20px] md:text-[24px] font-['Roboto_Flex'] mb-5 tracking-wide">
              USAGE INSTRUCTION:
            </h3>

            <div className="space-y-4 text-[#5C6936] text-[13px] sm:text-[14px] md:text-[16px]">
              {[
                {
                  icon: faClipboardCheck,
                  text: "Always patch test before first use, especially if you have sensitive skin.",
                },
                {
                  icon: faSnowflake,
                  text: "Store in a cool, dry place away from direct sunlight.",
                },
                {
                  icon: faLeaf,
                  text: "Handle with care—natural ingredients may separate slightly, which is normal.",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="flex gap-3 items-start"
                >
                  <FontAwesomeIcon
                    icon={item.icon}
                    className="mt-1 text-[#819744]"
                  />
                  <p>{item.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* BEFORE AFTER */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          {/* HEADINGS */}
          <div className="flex justify-center items-center gap-4 md:gap-6 mb-6 text-[#819744] font-semibold text-[18px] sm:text-[22px] md:text-[28px]">
            <div className="w-[140px] sm:w-[200px] md:w-[284px] text-center">
              Before
            </div>
            <div className="w-[140px] sm:w-[200px] md:w-[284px] text-center">
              After
            </div>
          </div>

          {/* IMAGES */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 relative">
            {/* BEFORE */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-[140px] h-[200px] sm:w-[200px] sm:h-[260px] md:w-[284px] md:h-[368px]
              bg-[#FAF3E2] rounded-[20px] md:rounded-[29px] overflow-hidden border border-black 
              shadow-[0_6px_15px_rgba(0,0,0,0.08)] flex flex-col transition-all duration-300"
            >
              <div className="relative w-full h-[160px] sm:h-[220px] md:h-[313px]">
                <Image
                  src="/img/before1.png"
                  alt="before"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="h-[40px] md:h-[55px] flex items-center justify-center bg-[#FAF3E2]">
                <p className="text-[12px] md:text-sm text-[#819744] font-bold">
                  Dull Skin
                </p>
              </div>
            </motion.div>

            {/* ARROW */}
            <div className="absolute left-1/2 -translate-x-1/2 z-10 top-[45%] md:top-auto">
              <div
                className="w-[60px] h-[35px] sm:w-[80px] sm:h-[45px] md:w-[114px] md:h-[59px]
              bg-[#FAF3E2] rounded-full border border-black flex items-center justify-center shadow-md"
              >
                <FontAwesomeIcon icon={faArrowRight} />
              </div>
            </div>

            {/* AFTER */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-[140px] h-[200px] sm:w-[200px] sm:h-[260px] md:w-[284px] md:h-[368px]
              bg-[#FAF3E2] rounded-[20px] md:rounded-[29px] overflow-hidden border border-black 
              shadow-[0_6px_15px_rgba(0,0,0,0.08)] flex flex-col transition-all duration-300"
            >
              <div className="relative w-full h-[160px] sm:h-[220px] md:h-[313px]">
                <Image
                  src="/img/after1.png"
                  alt="after"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="h-[40px] md:h-[55px] flex items-center justify-center bg-[#FAF3E2]">
                <p className="text-[12px] md:text-sm text-[#819744] font-bold">
                  Radiant Skin
                </p>
              </div>
            </motion.div>
          </div>

          {/* TEXT */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-[#819744] text-[16px] sm:text-[18px] md:text-[24px] font-bold"
          >
            Brighter skin in just 2 weeks
          </motion.p>
        </motion.div>
      </div>

      {/* RELATED PRODUCTS */}
      <div className="py-10 md:py-16 px-4 sm:px-6 bg-[#F5F0E6]">
        {/* TITLE */}
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-[#819744] font-['Marko_One'] 
          text-[20px] sm:text-[24px] md:text-[34px] font-semibold mb-6 md:mb-10"
        >
          Related Products
        </motion.h2>

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-8 max-w-6xl mx-auto">
          {products.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              viewport={{ once: true }}
              whileHover={{ y: -8 }}
              className="relative rounded-[18px] md:rounded-[20px] overflow-hidden group cursor-pointer shadow-sm md:shadow-md"
            >
              {/* IMAGE */}
              <div className="overflow-hidden">
                <Image
                  src={item.img}
                  alt={item.title}
                  width={433}
                  height={427}
                  className="w-full h-[220px] sm:h-[260px] md:h-[320px] object-cover transition duration-500 group-hover:scale-110"
                />
              </div>

              {/* CART ICON */}
              <motion.div
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-4 right-4 
                w-[30px] h-[30px] md:w-[38px] md:h-[38px] 
                bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-md"
              >
                <FontAwesomeIcon
                  icon={faCartShopping}
                  className="text-[#5E2B16] text-sm md:text-base"
                />
              </motion.div>

              {/* OVERLAY */}
              <div className="absolute bottom-0 left-0 w-full bg-black/50 backdrop-blur-md text-white p-3 md:p-4">
                <div className="flex items-center justify-between gap-2">
                  {/* TITLE */}
                  <motion.h3 className="font-semibold text-[14px] md:text-[16px] leading-tight truncate">
                    {item.title}
                  </motion.h3>

                  {/* STAR */}
                  <div
                    className="flex items-center gap-1 bg-[#F5A623] text-white 
                px-2 py-[2px] rounded-full text-[11px] md:text-[13px] font-semibold shrink-0"
                  >
                    <FontAwesomeIcon icon={faStar} />
                    <span>4.5</span>
                  </div>
                </div>

                {/* DESC */}
                <p className="text-[11px] md:text-[13px] opacity-90 mt-1 leading-4 md:leading-5">
                  Rice Dewy Bright Face Wash With Rice Water & Niacinamide
                </p>

                {/* PRICE */}
                <div className="flex justify-between items-center mt-2 md:mt-3 text-[12px] md:text-[13px]">
                  <span>100ml</span>
                  <span className="font-semibold">₹{item.price}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* FAQ + ADDITIONAL INFO */}
      <div className="bg-[#F5F0E6] py-10 px-4 sm:px-6 md:py-16">
        {/* TITLE */}
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-[#819744] font-['Marko_One'] 
          text-[22px] sm:text-[26px] md:text-[34px] font-semibold mb-8 md:mb-12"
        >
          Frequently Asked Questions
        </motion.h2>

        <div className="max-w-4xl mx-auto space-y-3 md:space-y-4">
          {faqs.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-lg md:rounded-xl shadow-sm md:shadow-md overflow-hidden"
            >
              {/* QUESTION */}
              <button
                onClick={() => setActiveIndex(activeIndex === i ? null : i)}
                className="w-full flex justify-between items-center 
                px-4 sm:px-5 md:px-6 py-3 md:py-4 text-left"
              >
                <span
                  className="font-semibold text-[#5E2B16] 
                text-[14px] sm:text-[15px] md:text-[16px] pr-2"
                >
                  {item.q}
                </span>

                <FontAwesomeIcon
                  icon={activeIndex === i ? faMinus : faPlus}
                  className="text-[#819744] text-sm md:text-base"
                />
              </button>

              {/* ANSWER */}
              <AnimatePresence>
                {activeIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-4 sm:px-5 md:px-6 pb-4 text-[#8B5E3C] 
                    text-[13px] sm:text-[14px] leading-5 md:leading-6"
                  >
                    {item.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* ADDITIONAL INFO */}
        <div className="max-w-4xl mx-auto mt-10 md:mt-16 bg-white rounded-lg md:rounded-xl shadow-sm md:shadow-md p-4 sm:p-5 md:p-6">
          <h3
            className="text-[#819744] font-semibold 
          text-[18px] sm:text-[20px] md:text-[22px] mb-4 md:mb-6"
          >
            Additional Information
          </h3>

          {/* RESPONSIVE GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 text-[13px] sm:text-[14px] text-[#5E2B16]">
            <div className="flex items-start gap-2">
              <FontAwesomeIcon icon={faGlobe} className="text-[#819744] mt-1" />
              <div>
                <p className="font-semibold">Country of Origin</p>
                <p>India</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FontAwesomeIcon
                icon={faBuilding}
                className="text-[#819744] mt-1"
              />
              <div>
                <p className="font-semibold">Marketed By</p>
                <p>PureAstra Pvt. Ltd.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FontAwesomeIcon
                icon={faIndustry}
                className="text-[#819744] mt-1"
              />
              <div>
                <p className="font-semibold">Manufactured By</p>
                <p>PureAstra Labs</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FontAwesomeIcon icon={faBox} className="text-[#819744] mt-1" />
              <div>
                <p className="font-semibold">Quantity</p>
                <p>100ml</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
