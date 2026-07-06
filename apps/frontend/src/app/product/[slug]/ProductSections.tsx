"use client";

import { useState } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faDroplet,
  faGlobe,
  faHandHoldingHeart,
  faHandSparkles,
  faLeaf,
  faMinus,
  faPaw,
  faPlus,
  faShieldAlt,
  faSkullCrossbones,
  faSnowflake,
} from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";
import type { ProductContentSection } from "@/services/api";

// ─── Benefits Section ─────────────────────────────────────────────────────────

export function BenefitsSection({
  section,
}: {
  section: ProductContentSection | undefined;
}) {
  const content = section?.content as
    | { items?: { title: string; desc: string }[] }
    | undefined;
  const items: { title: string; desc: string }[] = content?.items ?? [
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
    {
      title: "Removes Tan & Dullness",
      desc: "Papaya enzymes gently exfoliate dead skin while Vitamin C and Tangerine Extract help fade tan and restore a fresh, natural glow",
    },
  ];

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: i * 0.2 }}
          viewport={{ once: true }}
          whileHover={{ scale: 1.03 }}
          className="bg-[#D9DFC8] rounded-xl px-5 py-4"
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
  );
}

// ─── Ingredients Grid Section ─────────────────────────────────────────────────

export function IngredientsGridSection({
  section,
}: {
  section: ProductContentSection | undefined;
}) {
  const content = section?.content as
    | {
        list?: string[];
        text?: string;
        cardItems?: { title: string; desc: string }[];
      }
    | undefined;

  const list: string[] = content?.list ?? [];
  const text: string = content?.text ?? "";
  const cardItems: { title: string; desc: string }[] = content?.cardItems ?? [];

  if (!list.length && !text && !cardItems.length) return null;

  // Map ingredient → image
  const ingredientImages: Record<string, string> = {
    "Vitamin C": "/img/ingredients/vitamin-c.png",
    "Papaya Extract": "/img/ingredients/papaya.png",
    "Tangerine Extract": "/img/ingredients/tangerine.png",
    "Vitamin E": "/img/ingredients/vitamin-e.png",
    Glycerine: "/img/ingredients/glycerine.png",
    "Sodium PCA": "/img/ingredients/sodium-pca.png",
  };

  return (
    <div className="mt-12">
      {/* HEADING */}
      <h3 className="text-[#819744] font-bold text-[22px] mb-8 tracking-wide">
        INGREDIENTS
      </h3>

      {/* CARDS */}
      {cardItems.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          {cardItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              className="
              group
              bg-[#F3F6EA]/70 
              backdrop-blur-sm
              rounded-2xl 
              px-5 py-5 
              flex items-center gap-4
              border border-[#e5ead7]/60
              hover:shadow-md
              transition
            "
            >
              {/* IMAGE (FIXED) */}

              <div
                className="
                w-14 h-14 
                rounded-full 
                overflow-hidden 
                shrink-0
                border border-[#e0e6d0]
                flex items-center justify-center
                bg-transparent
              "
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- fixed avatar layout with scale/blend transforms; converting to next/image risks visual regression */}
                <img
                  src={
                    ingredientImages[item.title] ||
                    "/img/ingredients/default.png"
                  }
                  alt={item.title}
                  className="
                    w-full h-full 
                    object-cover 
                    object-center
                    scale-125
                    mix-blend-multiply
                    transition duration-300
                    group-hover:scale-140
                  "
                />
              </div>

              {/* TEXT */}
              <div>
                <h4 className="font-semibold text-[#5e2b16] text-[16px]">
                  {item.title}
                </h4>

                <p className="text-[#8b5e3c] text-[14px] mt-1 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* DESCRIPTION */}
      {text && (
        <p className="mt-5 text-[#8b5e3c] text-[14px] leading-7 max-w-[90%]">
          {text}
        </p>
      )}
    </div>
  );
}

// ─── Results Stats ─────────────────────────────────────────────────────────────

export function ResultsSection({
  section,
}: {
  section: ProductContentSection | undefined;
}) {
  const content = section?.content as { stats?: string[] } | undefined;

  const rawStats: string[] = content?.stats ?? [
    "Week 1: 60% feel hydrated & soft",
    "Week 2: 75% notice reduced dullness",
    "Week 3: 95% see brighter skin",
  ];

  // convert string → structured data
  const stats = rawStats.map((item, i) => {
    const [weekPart, rest] = item.split(":");

    const percentMatch = rest?.match(/\d+%/);
    const percent = percentMatch ? parseInt(percentMatch[0]) : 0;

    const text = rest?.replace(/\d+%/, "").trim();

    // fallback images
    const images = ["/img/week-1.png", "/img/week-2.png", "/img/week-3.png"];

    return {
      week: weekPart,
      percent,
      text,
      image: images[i % images.length],
    };
  });

  return (
    <div className="mt-8 space-y-5">
      {stats.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.2 }}
          viewport={{ once: true }}
          whileHover={{ scale: 1.02 }}
          className="
            flex items-center gap-4
            bg-white/40 backdrop-blur-md
            border border-white/30
            rounded-2xl
            px-5 py-4
            shadow-[0_10px_25px_rgba(0,0,0,0.06)]
          "
        >
          {/* IMAGE */}
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#819744] shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element -- fixed avatar layout; converting to next/image risks visual regression */}
            <img
              src={item.image}
              alt={item.week}
              className="w-full h-full object-cover"
            />
          </div>

          {/* TEXT */}
          <div className="flex-1">
            <p className="text-[#819744] font-semibold text-sm">{item.week}</p>

            <p className="text-[#8b5e3c] text-[14px] md:text-[16px]">
              {item.text}
            </p>

            {/* PROGRESS BAR */}
            <div className="mt-2 h-2 bg-[#e5ead7] rounded-full overflow-hidden relative">
              {/* MAIN FILL */}
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${item.percent}%` }}
                transition={{
                  duration: 1.2,
                  ease: "easeOut",
                  delay: i * 0.2,
                }}
                className="h-full bg-[#819744] rounded-full relative overflow-hidden"
              >
                {/* SHIMMER EFFECT (moving light) */}
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                />
              </motion.div>
            </div>
          </div>

          {/* % */}
          <div className="text-[#5E2B16] font-bold text-lg md:text-2xl">
            {item.percent}%
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Highlights / Why Us ──────────────────────────────────────────────────────

export function HighlightsSection({
  section,
}: {
  section: ProductContentSection | undefined;
}) {
  const content = section?.content as
    | { tagline?: string; title?: string; items?: { text: string }[] }
    | undefined;
  const tagline: string =
    content?.tagline ??
    "Toxin-free | Fragrance-free | Paraben-free | Sulfate-free | SLS-free | pH balanced";
  const whyUsTitle: string = content?.title ?? "Why Us";

  const iconsMap = [
    faLeaf,
    faSkullCrossbones,
    faHandHoldingHeart,
    faGlobe,
    faPaw,
  ];
  const defaultItems = [
    "Crafted with pure, real ingredients",
    "Free from parabens, sulfates, and harsh additives",
    "A portion of every purchase supports cancer patients",
    "Committed to people, society, and the planet",
    "Never tested on animals",
  ];

  const items: { text: string }[] =
    content?.items ?? defaultItems.map((t) => ({ text: t }));

  return (
    <div className="bg-[#EBF1DC] py-12 md:py-16 text-center">
      <div className="bg-[radial-gradient(circle,_#EBF1DC_60%,_#CCD7B2_100%)] py-6 md:py-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-[22px] sm:text-[26px] md:text-[32px] font-bold text-[#819744] font-['Roboto_Flex'] mb-3"
        >
          {whyUsTitle}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
          className="text-[#5C6936] text-[13px] sm:text-[15px] md:text-[18px] font-['Roboto_Flex'] font-bold max-w-[90%] md:max-w-none mx-auto"
        >
          {tagline}
        </motion.p>
      </div>
      <div className="bg-[url('/img/why-us-banner.webp')] bg-cover bg-center py-10 md:py-12">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
            {items.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.08 }}
                className="flex flex-col items-center text-white cursor-pointer"
              >
                <motion.div
                  whileHover={{ rotate: 5 }}
                  className="text-[36px] sm:text-[42px] md:text-[50px] mb-3 md:mb-4"
                >
                  <FontAwesomeIcon icon={iconsMap[i] ?? faLeaf} />
                </motion.div>
                <p className="text-[12px] sm:text-[14px] md:text-[16px] max-w-[140px] md:max-w-[160px] font-['Roboto_Flex'] font-bold leading-snug">
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Suitable For Section ─────────────────────────────────────────────────────

export function SuitableForSection({
  section,
}: {
  section: ProductContentSection | undefined;
}) {
  const content = section?.content as
    | { fields?: { label: string; value: string }[] }
    | undefined;

  const fields: { label: string; value: string }[] = content?.fields ?? [
    {
      label: "Skin Type",
      value:
        "All skin types, including sensitive, dry, oily, and combination skin",
    },
    { label: "Texture", value: "Smooth gel, gentle on skin" },
    {
      label: "Age",
      value: "Ideal for teenagers (15+) and adults",
    },
    {
      label: "Special Conditions",
      value: "Safe for use during pregnancy",
    },
    { label: "Gender", value: "Suitable for all genders" },
  ];

  return (
    <div>
      {/* HEADING */}
      <h3 className="text-[#819744] font-bold text-[18px] sm:text-[20px] md:text-[24px] font-['Roboto_Flex'] mb-6 tracking-wide">
        SUITABLE FOR:
      </h3>

      <div className="space-y-4">
        {fields.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            className="
              bg-white/40 
              backdrop-blur-md 
              border border-white/30 
              rounded-2xl 
              px-5 py-4 
              shadow-[0_8px_20px_rgba(0,0,0,0.05)]
              hover:shadow-[0_12px_25px_rgba(0,0,0,0.08)]
              transition
            "
          >
            <h4 className="font-semibold text-[#5E2B16] text-[15px] md:text-[18px]">
              {f.label}
            </h4>

            <p className="text-[#8B5E3C] text-[13px] md:text-[16px] mt-1 leading-relaxed">
              {f.value}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Usage Instructions Section ───────────────────────────────────────────────

export function UsageInstructionSection({
  section,
}: {
  section: ProductContentSection | undefined;
}) {
  const content = section?.content as { steps?: string[] } | undefined;

  const steps: string[] = content?.steps ?? [
    "Wet your face with lukewarm water. Take a coin-sized amount of face wash.",
    "Gently massage in circular motions for 30–60 seconds, avoiding the eye area.",
    "Rinse thoroughly and pat dry. Follow with a moisturizer.",
    "Always patch test before first use, especially if you have sensitive skin.",
    "Store in a cool, dry place away from direct sunlight.",
  ];

  const stepIcons = [
    faDroplet,
    faHandSparkles,
    faLeaf,
    faShieldAlt,
    faSnowflake,
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      {/* HEADING */}
      <h3 className="text-[#819744] font-bold text-[18px] sm:text-[20px] md:text-[24px] mb-8 tracking-wide">
        USAGE INSTRUCTION:
      </h3>

      <div className="space-y-6">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            className="relative"
          >
            {/* CARD */}
            <div
              className="
              bg-white/40 backdrop-blur-md 
              border border-white/30 
              rounded-2xl 
              px-6 py-5 
              shadow-[0_10px_25px_rgba(0,0,0,0.06)]
              hover:shadow-[0_12px_30px_rgba(0,0,0,0.1)]
              transition
            "
            >
              <p className="text-[#8b5e3c] text-[14px] md:text-[16px] leading-relaxed pl-10">
                {step}
              </p>
            </div>

            {/* FLOATING ICON */}
            <div
              className="
              absolute 
              -left-4 top-1/2 -translate-y-1/2 
              w-12 h-12 
              flex items-center justify-center 
              rounded-full 
              bg-[#819744] text-white 
              shadow-lg
            "
            >
              <FontAwesomeIcon icon={stepIcons[i % stepIcons.length]} />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Before/After Section ─────────────────────────────────────────────────────

export function BeforeAfterSection({
  section,
  fallbackImage,
}: {
  section: ProductContentSection | undefined;
  fallbackImage?: string;
}) {
  const content = section?.content as
    | {
        beforeLabel?: string;
        afterLabel?: string;
        beforeImage?: string;
        afterImage?: string;
        caption?: string;
      }
    | undefined;
  const beforeLabel: string = content?.beforeLabel ?? "Dull Skin";
  const afterLabel: string = content?.afterLabel ?? "Radiant Skin";
  const beforeImg: string =
    content?.beforeImage ?? fallbackImage ?? "/img/before1.webp";
  const afterImg: string =
    content?.afterImage ?? fallbackImage ?? "/img/after1.webp";
  const caption: string = content?.caption ?? "Brighter skin in just 2 weeks";

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div className="flex justify-center items-center gap-4 md:gap-6 mb-6 text-[#819744] font-semibold text-[18px] sm:text-[22px] md:text-[28px]">
        <div className="w-[140px] sm:w-[200px] md:w-[284px] text-center">
          Before
        </div>
        <div className="w-[140px] sm:w-[200px] md:w-[284px] text-center">
          After
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 sm:gap-4 relative">
        {/* BEFORE */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="w-[140px] h-[200px] sm:w-[200px] sm:h-[260px] md:w-[284px] md:h-[368px] bg-[#FAF3E2] rounded-[20px] md:rounded-[29px] overflow-hidden border border-black shadow-[0_6px_15px_rgba(0,0,0,0.08)] flex flex-col transition-all duration-300"
        >
          <div className="relative w-full h-[160px] sm:h-[220px] md:h-[313px]">
            <Image src={beforeImg} alt="before" fill className="object-cover" />
          </div>
          <div className="h-[40px] md:h-[55px] flex items-center justify-center bg-[#FAF3E2]">
            <p className="text-[12px] md:text-sm text-[#819744] font-bold">
              {beforeLabel}
            </p>
          </div>
        </motion.div>

        {/* CENTER ARROW */}
        <div className="absolute left-1/2 -translate-x-1/2 z-10 top-[45%] md:top-auto">
          <div className="w-[60px] h-[35px] sm:w-[80px] sm:h-[45px] md:w-[114px] md:h-[59px] bg-[#FAF3E2] rounded-full border border-black flex items-center justify-center shadow-md">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
        </div>

        {/* AFTER */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="w-[140px] h-[200px] sm:w-[200px] sm:h-[260px] md:w-[284px] md:h-[368px] bg-[#FAF3E2] rounded-[20px] md:rounded-[29px] overflow-hidden border border-black shadow-[0_6px_15px_rgba(0,0,0,0.08)] flex flex-col transition-all duration-300"
        >
          <div className="relative w-full h-[160px] sm:h-[220px] md:h-[313px]">
            <Image src={afterImg} alt="after" fill className="object-cover object-top" />
          </div>
          <div className="h-[40px] md:h-[55px] flex items-center justify-center bg-[#FAF3E2]">
            <p className="text-[12px] md:text-sm text-[#819744] font-bold">
              {afterLabel}
            </p>
          </div>
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 text-[#819744] text-[16px] sm:text-[18px] md:text-[24px] font-bold"
      >
        {caption}
      </motion.p>
    </motion.div>
  );
}

// ─── FAQ Section ──────────────────────────────────────────────────────────────

export function FaqSection({
  section,
}: {
  section: ProductContentSection | undefined;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const content = section?.content as
    | { items?: { q: string; a: string }[] }
    | undefined;
  const faqs: { q: string; a: string }[] = content?.items ?? [
    {
      q: "Is this product safe for sensitive skin?",
      a: "Yes! Our formula is dermatologically tested and gentle enough for sensitive skin.",
    },
    {
      q: "Is this product vegan and cruelty-free?",
      a: "Yes! It is 100% vegan, cruelty-free, and never tested on animals.",
    },
  ];

  return (
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
          <button
            onClick={() => setActiveIndex(activeIndex === i ? null : i)}
            className="w-full flex justify-between items-center px-4 sm:px-5 md:px-6 py-3 md:py-4 text-left"
          >
            <span className="font-semibold text-[#5E2B16] text-[14px] sm:text-[15px] md:text-[16px] pr-2">
              {item.q}
            </span>
            <FontAwesomeIcon
              icon={activeIndex === i ? faMinus : faPlus}
              className="text-[#819744] text-sm md:text-base"
            />
          </button>
          <AnimatePresence>
            {activeIndex === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="px-4 sm:px-5 md:px-6 pb-4 text-[#8B5E3C] text-[13px] sm:text-[14px] leading-5 md:leading-6"
              >
                {item.a}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}
