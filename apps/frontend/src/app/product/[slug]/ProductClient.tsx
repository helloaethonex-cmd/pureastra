"use client";

import { useState } from "react";
import Image from "next/image";
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
} from "@fortawesome/free-solid-svg-icons";

import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "@/services/api";
import { useAddCartItem } from "@/hooks/useCart";
import { useAuthStore } from "@/store/auth.store";

export default function ProductClient({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [tab, setTab] = useState("desc");
  const [activeIndex, setActiveIndex] = useState<number | null>(0);
  const [activeVariantId, setActiveVariantId] = useState<string | null>(
    product.variants[0]?.id ?? null,
  );
  const { user } = useAuthStore();
  const addCartItem = useAddCartItem();

  // Map API images to array of URLs (sorted by position)
  const images = [...product.images]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((img) => img.imageUrl);

  // Fallback image if none
  const displayImages = images.length > 0 ? images : ["/img/facewash.png"];

  const activeVariant = product.variants.find((v) => v.id === activeVariantId);

  const handleAddToCart = () => {
    if (!user) {
      alert("Please sign in to add items to your cart.");
      return;
    }

    if (!activeVariant?.id) {
      alert("Please select a valid variant.");
      return;
    }

    addCartItem.mutate(
      { productVariantId: activeVariant.id, quantity: qty },
      {
        onSuccess: () => {
          alert("Item added to cart");
        },
        onError: (error) => {
          const message =
            error instanceof Error ? error.message : "Failed to add to cart";
          alert(message);
        },
      },
    );
  };

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
      <div className="bg-[#EDE3D2] py-6 px-6 md:px-12 flex items-center justify-between">
        {/* LEFT TITLE */}
        <h1 className="text-[28px] md:text-[34px] font-bold text-[#5E2B16] font-['Roboto',serif]">
          Face wash
        </h1>

        {/* RIGHT IMAGE (CIRCLE) */}
        <div className="w-[70px] h-[70px] md:w-[90px] md:h-[90px] bg-white rounded-full flex items-center justify-center shadow-md">
          <img
            src="/img/thumb.png"
            alt="product"
            className="w-[60%] h-[60%] object-contain"
          />
        </div>
      </div>

      {/* TOP */}
      <div className="px-6 md:px-12 py-10 grid grid-cols-2 gap-10 max-md:grid-cols-1">
        {/* LEFT */}
        <div>
          {/* MAIN IMAGE (NO CARD) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
            className="w-full h-[500px] flex items-center justify-center"
          >
            <Image
              src={displayImages[activeImg]}
              alt={product.name}
              width={665}
              height={646}
              className="w-full h-full object-contain"
            />
          </motion.div>

          {/* THUMBNAILS */}
          <div className="flex gap-4 mt-4">
            {displayImages.map((img: string, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => setActiveImg(i)}
                className={`w-[90px] h-[90px] rounded-lg overflow-hidden cursor-pointer border transition ${
                  activeImg === i
                    ? "border-2 border-[#819744]"
                    : "border-transparent opacity-70 hover:opacity-100"
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
          <h2 className="text-[30px] font-bold text-black mb-2">
            {product.name}
          </h2>

          {/* RATING */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex text-[#FACC15]">
              {[...Array(5)].map((_, i) => (
                <FontAwesomeIcon key={i} icon={faStar} />
              ))}
            </div>
            <span className="text-sm text-gray-700">12 Customer review</span>
          </div>

          {/* DESCRIPTION */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-[14px] text-[#5f5f5f] leading-6 mb-6 max-w-[500px]"
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
          {product.variants.length > 0 && (
            <div className="mb-5 flex items-center gap-4">
              {/* HEADING */}
              <p className="font-['Roboto_Flex'] font-semibold text-[20px] text-black">
                Size :
              </p>

              {/* BUTTONS */}
              <div className="flex items-center gap-3 flex-wrap">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setActiveVariantId(v.id)}
                    className={`px-4 py-1.5 text-[12px] rounded-full shadow-sm transition ${
                      activeVariantId === v.id
                        ? "bg-[#819744] text-white"
                        : "bg-[#EBF1DC] text-[#5E2B16] hover:bg-[#d9e0c5]"
                    }`}
                  >
                    {v.variantName ?? v.sku ?? `Variant ${v.id}`}
                    {activeVariant?.price != null &&
                      activeVariantId === v.id && (
                        <span className="ml-1 opacity-80">
                          · ₹{activeVariant.price}
                        </span>
                      )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* BEST SUITED */}
          <p className="mb-6 text-[15px]">
            <span className="font-['Roboto_Flex'] font-semibold text-[20px] text-black">
              Best suited for:
            </span>{" "}
            <span className="font-['Roboto_Flex'] font-semibold text-[18px] text-[#535353]">
              all skin types
            </span>
          </p>

          {/* QUANTITY + CART */}
          <div className="flex items-center gap-6 mb-8">
            {/*  QUANTITY BOX */}
            <div className="flex border border-[#cfc7b8] h-[42px]">
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

            {/*  ADD TO CART */}
            <button
              onClick={handleAddToCart}
              disabled={addCartItem.isPending}
              className="flex h-[42px] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {/* TEXT PART */}
              <span className="bg-[#E5EAD9] text-[#5E2B16] px-6 flex items-center font-semibold text-[14px] tracking-wide">
                {addCartItem.isPending ? "ADDING..." : "ADD TO CART"}
              </span>

              {/* ICON PART */}
              <span className="bg-[#819744] text-white px-4 flex items-center">
                <FontAwesomeIcon icon={faCartShopping} />
              </span>
            </button>
          </div>

          {/* TABS */}
          <div className="flex gap-10 border-b mb-4">
            <button
              onClick={() => setTab("desc")}
              className={`pb-2 font-semibold ${
                tab === "desc"
                  ? "text-[#5E2B16] border-b-2 border-[#5E2B16]"
                  : "text-gray-500"
              }`}
            >
              Description
            </button>

            <button
              onClick={() => setTab("reviews")}
              className={`pb-2 font-semibold ${
                tab === "reviews"
                  ? "text-[#5E2B16] border-b-2 border-[#5E2B16]"
                  : "text-gray-500"
              }`}
            >
              Reviews
            </button>
          </div>

          {/* TAB CONTENT */}
          <div className="text-sm text-gray-600 leading-6 space-y-3">
            {tab === "desc" ? (
              <>
                <p>
                  {product.description ??
                    "No description available for this product."}
                </p>
              </>
            ) : (
              <p>No reviews yet</p>
            )}
          </div>
        </div>
      </div>

      {/*  ADDITIONAL INFO */}
      {/* TITLE */}
      <h2 className="text-center font-['Marko-One'] text-[42px] font-semibold text-[#819744] mb-12 font-serif">
        Additional Information
      </h2>
      <div className="bg-[#EBF1DC] py-10">
        {/*  CENTERED CONTAINER */}
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 px-6 items-center">
          {/* LEFT */}
          <div>
            <h3 className="text-[#819744] font-['Roboto_Flex'] font-bold text-[24px] mb-6">
              BENEFITS:
            </h3>

            <div className="space-y-4">
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
                  whileHover={{ scale: 1.03 }}
                  className="bg-[#D9DFC8] rounded-xl px-5 py-4"
                >
                  <h4 className="font-semibold text-[#2C2C2C] font-['Roboto_Flex'] text-[18px]">
                    {item.title}
                  </h4>
                  <p className="text-sm text-[#535353] font-['Roboto_Flex'] text-[16px] mt-1">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.03 }}
            className="flex justify-end"
          >
            <div className="relative w-[520px] h-[420px]">
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
      <div className="bg-[#EBF1DC] py-16 text-center">
        {/* TITLE */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-[32px] font-bold text-[#819744] font-['Roboto_Flex']  mb-4"
        >
          Whyus
        </motion.h2>

        {/* SUBTEXT */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
          className="text-[#5C6936] text-[18px] font-['Roboto_Flex'] font-bold mb-10"
        >
          Toxin-free | Fragrance-free | Paraben-free | Sulfate-free | SLS-free
          ph balanced
        </motion.p>

        {/* BACKGROUND */}
        <div className="bg-[url('/img/why-us-banner.png')] bg-cover bg-center py-12">
          <div className="max-w-6xl mx-auto grid grid-cols-5 gap-6 px-6 max-md:grid-cols-2">
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
                transition={{ delay: i * 0.2, duration: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.1 }}
                className="flex flex-col items-center text-white cursor-pointer"
              >
                {/* ICON */}
                <motion.div
                  whileHover={{ rotate: 5 }}
                  className="text-[50px] mb-4"
                >
                  <FontAwesomeIcon icon={item.icon} />
                </motion.div>

                {/* TEXT */}
                <p className="text-[16] max-w-[160px] font-['Roboto_Flex'] font-bold">
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/*  SUITABLE + USAGE + BEFORE AFTER */}
      <div className="bg-[#EBF1DC] py-10 px-6 md:px-12">
        {/* TOP GRID */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 mb-12">
          {/* LEFT - SUITABLE */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-[#819744] font-bold text-[24px]  font-['Roboto_Flex'] mb-6 tracking-wide">
              SUITABLE FOR:
            </h3>

            <div className="space-y-3 text-[#5E2B16] text-[16px]">
              <p>
                <span className="text-[#5C6936] font-['Roboto_Flex'] text-[14] font-semibold">
                  Skin Type:
                </span>{" "}
                All skin types, including sensitive, dry, oily, and combination
                skin
              </p>

              <p>
                <span className="text-[#5C6936] font-['Roboto_Flex'] text-[14] font-semibold">
                  Texture:
                </span>{" "}
                Smooth gel, gentle on skin
              </p>

              <p>
                <span className="text-[#5C6936] font-['Roboto_Flex'] text-[14] font-semibold">
                  Age:
                </span>{" "}
                Ideal for teenagers (15+) and adults
              </p>

              <p>
                <span className="text-[#5C6936] font-['Roboto_Flex'] text-[14] font-semibold">
                  Special Conditions:
                </span>{" "}
                Safe for use during pregnancy
              </p>

              <p>
                <span className="text-[#5C6936] font-['Roboto_Flex'] text-[14] font-semibold">
                  Gender:
                </span>{" "}
                Suitable for all gender
              </p>
            </div>
          </motion.div>

          {/* RIGHT - USAGE */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-[#819744] font-bold text-[24px]  font-['Roboto_Flex'] mb-6 tracking-wide">
              USAGE INSTRUCTION:
            </h3>

            <div className="space-y-4 text-[#5E2B16] text-[16px]">
              <div className="flex gap-3 items-start font-['Roboto_Flex'] text-[14px] text-[#5C6936] ">
                <FontAwesomeIcon
                  icon={faClipboardCheck}
                  className="mt-1 text-[#819744]"
                />
                <p>
                  Always patch test before first use, especially if you have
                  sensitive skin.
                </p>
              </div>

              <div className="flex gap-3 items-start font-['Roboto_Flex'] text-[14px] text-[#5C6936] ">
                <FontAwesomeIcon
                  icon={faSnowflake}
                  className="mt-1 text-[#819744]"
                />
                <p>Store in a cool, dry place away from direct sunlight.</p>
              </div>

              <div className="flex gap-3 items-start font-['Roboto_Flex'] text-[14px] text-[#5C6936] ">
                <FontAwesomeIcon
                  icon={faLeaf}
                  className="mt-1 text-[#819744]"
                />
                <p>
                  Handle with care—natural ingredients may separate slightly,
                  which is normal.
                </p>
              </div>
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
          <div className="flex justify-center items-center gap-6 mb-6 text-[#819744] font-['Roboto_Flex'] font-semibold text-[28px]">
            <div className="w-[284px] text-center">Before</div>
            <div className="w-[284px] text-center">After</div>
          </div>

          {/* IMAGES */}
          <div className="flex items-center justify-center gap-2 relative">
            {/* BEFORE */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-[284px] h-[368px] bg-[#FAF3E2] rounded-[29px] overflow-hidden border border-black shadow-[0_8px_20px_rgba(0,0,0,0.08)] flex flex-col transition-transform duration-300 hover:-translate-y-1"
            >
              {/* BEFORE */}
              <div className="relative w-full h-[313px]">
                <Image
                  src="/img/before1.png"
                  alt="before"
                  fill
                  className="object-cover"
                />
              </div>
              {/* BOTTOM LABEL */}
              <div className="h-[55px] flex items-center justify-center bg-[#FAF3E2]">
                <p className="text-sm text-[#819744] font-bold font-['Roboto_Serif',serif]">
                  Dull Skin
                </p>
              </div>
            </motion.div>
            {/* CENTER ARROW */}
            <div className="absolute left-1/2 -translate-x-1/2 z-10">
              <div className="w-[114px] h-[59px] bg-[#FAF3E2] rounded-[40px] border border-black flex items-center justify-center shadow-md">
                <FontAwesomeIcon icon={faArrowRight} className="text-lg" />
              </div>
            </div>

            {/* AFTER */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-[284px] h-[368px] bg-[#FAF3E2] rounded-[29px] overflow-hidden border border-black shadow-[0_8px_20px_rgba(0,0,0,0.08)] flex flex-col transition-transform duration-300 hover:-translate-y-1"
            >
              {/* AFTER */}
              <div className="relative w-full h-[313px]">
                <Image
                  src="/img/after1.png"
                  alt="after"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="h-[55px] flex items-center justify-center bg-[#FAF3E2]">
                <p className="text-sm text-[#819744] font-bold font-['Roboto_Serif',serif]">
                  Radiant Skin
                </p>
              </div>
            </motion.div>
          </div>

          {/* TEXT */}
          <p className="mt-6 text-[#819744] text-[24px] font-['Roboto_Flex'] font-bold font-medium">
            Brighter skin in just 2 weeks
          </p>
        </motion.div>
      </div>

      {/* RELATED PRODUCTS */}

      <div className="py-16 px-6 bg-[#F5F0E6]">
        {/* TITLE */}
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center text-[#819744] font-['Marko_One'] text-[34px] font-semibold mb-10"
        >
          Related Products
        </motion.h2>

        {/* GRID */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {products.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
              viewport={{ once: true }}
              whileHover={{ y: -8 }}
              className="relative rounded-[20px] overflow-hidden group cursor-pointer shadow-md"
            >
              {/* IMAGE */}
              <div className="overflow-hidden">
                <Image
                  src={item.img}
                  alt={item.title}
                  width={433}
                  height={427}
                  className="w-full h-[320px] object-cover transition duration-500 group-hover:scale-110"
                />
              </div>

              {/* CART ICON */}
              <motion.div
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-4 right-4 w-[38px] h-[38px] bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg"
              >
                <FontAwesomeIcon
                  icon={faCartShopping}
                  className="text-[#5E2B16]"
                />
              </motion.div>

              {/* OVERLAY */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="absolute bottom-0 left-0 w-full bg-[#7A736A]/80 backdrop-blur-md text-white p-4"
              >
                {/* TITLE */}
                <h3 className="font-semibold text-[16px]">{item.title}</h3>

                {/* DESC */}
                <p className="text-[13px] opacity-90 mt-1 leading-5">
                  Rice Dewy Bright Face Wash With Rice Water & Niacinamide
                </p>

                {/* PRICE */}
                <div className="flex justify-between items-center mt-3 text-[13px]">
                  <span>100ml</span>
                  <span className="font-semibold">₹{item.price}</span>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-[#F5F0E6] py-16 px-6">
        {/* TITLE */}
        <h2 className="text-center text-[#819744] font-['Marko_One'] text-[34px] font-semibold mb-12">
          Frequently Asked Questions
        </h2>

        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              {/* QUESTION */}
              <button
                onClick={() => setActiveIndex(activeIndex === i ? null : i)}
                className="w-full flex justify-between items-center px-6 py-4 text-left"
              >
                <span className="font-semibold text-[#5E2B16] text-[16px]">
                  {item.q}
                </span>

                <FontAwesomeIcon
                  icon={activeIndex === i ? faMinus : faPlus}
                  className="text-[#819744]"
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
                    className="px-6 pb-4 text-[#5f5f5f] text-[14px] leading-6"
                  >
                    {item.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* ADDITIONAL INFO */}
        <div className="max-w-4xl mx-auto mt-16 bg-white rounded-xl shadow-md p-6">
          <h3 className="text-[#819744] font-semibold text-[22px] mb-6">
            Additional Information
          </h3>

          <div className="grid grid-cols-2 gap-6 text-[14px] text-[#5E2B16]">
            <div>
              <p className="font-semibold">Country of Origin</p>
              <p>India</p>
            </div>

            <div>
              <p className="font-semibold">Marketed By</p>
              <p>PureAstra</p>
            </div>

            <div>
              <p className="font-semibold">Manufactured By</p>
              <p>PureAstra Labs</p>
            </div>

            <div>
              <p className="font-semibold">Quantity</p>
              <p>100ml</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
