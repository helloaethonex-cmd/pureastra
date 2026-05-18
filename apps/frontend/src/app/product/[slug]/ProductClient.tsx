"use client";
import toast from "react-hot-toast";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
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
  faHandSparkles,
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
  faBalanceScale,
  faTrash,
  faShieldAlt,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

import { motion, AnimatePresence } from "framer-motion";
import type {
  Product,
  ProductContentSection,
  ProductListResponse,
  Address,
  ReviewMetric,
} from "@/services/api";
import {
  createAddress,
  previewBuyNowCheckout,
  uploadReviewImage,
} from "@/services/api";
import { useAddCartItem } from "@/hooks/useCart";
import { useAuthStore } from "@/store/auth.store";
import { useProducts } from "@/hooks/useProducts";
import { useBuyNowCheckout, useMyAddresses } from "@/hooks/useCheckout";
import {
  useCreateProductReview,
  useProductReviewMetrics,
  useProductReviews,
  useProductReviewSummary,
  useReviewEligibility,
} from "@/hooks/useReviews";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getActiveReferralAttribution } from "@/lib/referral";
import AuthModal from "@/components/AuthModal";

// ─── Section Helper ────────────────────────────────────────────────────────────

function getSection(
  sections: ProductContentSection[],
  type: string,
): ProductContentSection | undefined {
  return sections.find((s) => s.sectionType === type);
}

const metricIconMap: Record<string, IconDefinition> = {
  brightening: faSun,
  hydration: faDroplet,
  sebum: faBalanceScale,
  balance: faBalanceScale,
};

function getMetricIcon(metricName: string, metricIcon?: string | null) {
  const key = (metricIcon ?? metricName).toLowerCase();
  for (const [matcher, icon] of Object.entries(metricIconMap)) {
    if (key.includes(matcher)) {
      return icon;
    }
  }
  return faLeaf;
}

function getRelativeDateLabel(dateISO: string) {
  const createdAt = new Date(dateISO).getTime();
  if (Number.isNaN(createdAt)) return "Just now";
  const diffMs = Date.now() - createdAt;
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.max(1, Math.floor(diffMs / dayMs));
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}

type ProductGalleryImage = {
  imageUrl: string;
  heroImageUrl?: string | null;
  thumbnailImageUrl?: string | null;
  placeholder?: string | null;
  width?: number | null;
  height?: number | null;
};

// ─── Benefits Section ─────────────────────────────────────────────────────────

function BenefitsSection({
  section,
}: {
  section: ProductContentSection | undefined;
}) {
  const content = section?.content as any;
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

function IngredientsGridSection({
  section,
}: {
  section: ProductContentSection | undefined;
}) {
  const content = section?.content as any;

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

function ResultsSection({
  section,
}: {
  section: ProductContentSection | undefined;
}) {
  const content = section?.content as any;

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

function HighlightsSection({
  section,
}: {
  section: ProductContentSection | undefined;
}) {
  const content = section?.content as any;
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

function SuitableForSection({
  section,
}: {
  section: ProductContentSection | undefined;
}) {
  const content = section?.content as any;

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

function UsageInstructionSection({
  section,
}: {
  section: ProductContentSection | undefined;
}) {
  const content = section?.content as any;

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

function BeforeAfterSection({
  section,
  fallbackImage,
}: {
  section: ProductContentSection | undefined;
  fallbackImage?: string;
}) {
  const content = section?.content as any;
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

function FaqSection({
  section,
}: {
  section: ProductContentSection | undefined;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const content = section?.content as any;
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

const EMPTY_FORM = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "INDIA",
  isDefault: false,
};

function BuyNowAddressForm({
  onSaved,
  onCancel,
}: {
  onSaved: (addr: Address) => void;
  onCancel: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);

  const save = useMutation({
    mutationFn: () => createAddress(form),
    onSuccess: (addr) => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      onSaved(addr);
    },
  });

  const field = (
    key: keyof typeof EMPTY_FORM,
    label: string,
    type = "text",
    half = false,
  ) => (
    <div className={half ? "col-span-1" : "col-span-2"}>
      <label className="block text-xs font-semibold text-[#7B6A58] mb-1 uppercase tracking-wide">
        {label}
      </label>
      <input
        type={type}
        value={String(form[key])}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full px-3 py-2 rounded-lg border border-[#D6C9B6] bg-white/80 text-[#3d2b1a] text-sm focus:outline-none focus:ring-2 focus:ring-[#819744]/40"
      />
    </div>
  );

  return (
    <div className="mt-4 bg-[#F5F0E6] border border-[#D6C9B6] rounded-xl p-4">
      <p className="text-sm font-semibold text-[#5E2B15] mb-3">
        Add new address
      </p>
      <div className="grid grid-cols-2 gap-3">
        {field("fullName", "Full Name")}
        {field("phone", "Phone", "tel")}
        {field("line1", "Address Line 1")}
        {field("line2", "Address Line 2 (optional)")}
        {field("city", "City", "text", true)}
        {field("state", "State", "text", true)}
        {field("postalCode", "Postal Code", "text", true)}
        {field("country", "Country", "text", true)}
      </div>
      {save.isError && (
        <p className="mt-2 text-xs text-red-500">
          {(save.error as Error)?.message ?? "Failed to save address"}
        </p>
      )}
      <div className="flex gap-3 mt-4">
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="flex-1 bg-[#5E2B15] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#4a200f] transition disabled:opacity-60"
        >
          {save.isPending ? "Saving..." : "Save Address"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-[#D6C9B6] rounded-lg text-sm text-[#7B6A58] hover:bg-[#efe2cf] transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function BuyNowPanel({
  productVariantId,
  quantity,
  onClose,
  onSuccess,
}: {
  productVariantId: string;
  quantity: number;
  onClose: () => void;
  onSuccess: (orderNumber: string) => void;
}) {
  const { user } = useAuthStore();
  const { data: addresses, isLoading: addrLoading } = useMyAddresses(
    Boolean(user),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState<"address" | "preview">("address");
  const [preview, setPreview] = useState<{ grandTotal: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const activeReferral = getActiveReferralAttribution();

  // Auto-select the default address once addresses load
  useEffect(() => {
    if (selectedId !== null) return; // user already picked one
    const defaultAddr = addresses?.find((a) => a.isDefault);
    if (defaultAddr) setSelectedId(defaultAddr.id);
  }, [addresses]);

  const buyNow = useBuyNowCheckout();

  const handleNext = async () => {
    if (!selectedId) return;
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const data = await previewBuyNowCheckout({
        productVariantId,
        quantity,
        addressId: selectedId,
        referralCode: activeReferral?.code,
      });
      setPreview({ grandTotal: data.totals.grandTotal });
      setStep("preview");
    } catch (err) {
      setPreviewError((err as Error)?.message ?? "Could not load preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePay = () => {
    if (!selectedId) return;
    buyNow.mutate(
      {
        productVariantId,
        quantity,
        addressId: selectedId,
        referralCode: activeReferral?.code,
      },
      {
        onSuccess: ({ orderNumber }) => onSuccess(orderNumber),
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-end sm:justify-center overflow-x-hidden">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full sm:w-[92vw] sm:max-w-[480px] max-h-screen sm:max-h-[90vh] bg-[#FDF8F1] sm:rounded-2xl shadow-2xl overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#D6C9B6] shrink-0">
          <h2 className="text-xl font-bold text-[#5E2B15]">
            {step === "address" ? "Choose Delivery Address" : "Order Summary"}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#EDE3D2] text-[#7B6A58] hover:bg-[#D6C9B6] transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === "address" && (
            <div>
              {addrLoading ? (
                <p className="text-sm text-[#7B6A58] py-6 text-center">
                  Loading addresses...
                </p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {(addresses ?? []).map((addr) => (
                    <button
                      key={addr.id}
                      onClick={() => setSelectedId(addr.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        selectedId === addr.id
                          ? "border-[#819744] bg-[#f0f6e8]"
                          : "border-[#D6C9B6] bg-white/60 hover:border-[#9ab964]"
                      }`}
                    >
                      <p className="font-semibold text-sm text-[#3d2b1a]">
                        {addr.fullName}
                      </p>
                      <p className="text-xs text-[#7B6A58] mt-0.5">
                        {addr.phone}
                      </p>
                      <p className="text-xs text-[#7B6A58]">
                        {addr.line1}
                        {addr.line2 ? `, ${addr.line2}` : ""}
                      </p>
                      <p className="text-xs text-[#7B6A58]">
                        {addr.city}, {addr.state} – {addr.postalCode}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-[#C4B59E] rounded-xl text-sm text-[#7B6A58] hover:border-[#819744] hover:text-[#819744] transition"
                >
                  + Add a new address
                </button>
              )}

              {showForm && (
                <BuyNowAddressForm
                  onSaved={(addr) => {
                    setSelectedId(addr.id);
                    setShowForm(false);
                  }}
                  onCancel={() => setShowForm(false)}
                />
              )}

              {previewError && (
                <p className="mt-2 text-xs text-red-500 text-center">
                  {previewError}
                </p>
              )}

              <button
                onClick={handleNext}
                disabled={!selectedId || previewLoading}
                className="mt-5 w-full bg-[#5E2B15] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#4a200f] transition disabled:opacity-40"
              >
                {previewLoading ? "Loading..." : "Review Order →"}
              </button>
            </div>
          )}

          {step === "preview" && preview && (
            <div>
              <div className="bg-[#F5F0E6] border border-[#D6C9B6] rounded-xl p-4 mb-5">
                <div className="flex justify-between text-sm text-[#5E2B15] font-semibold">
                  <span>Total to Pay</span>
                  <span>₹{Number(preview.grandTotal).toFixed(2)}</span>
                </div>
                <p className="text-xs text-[#9a7a65] mt-1">
                  Inclusive of all taxes &amp; FREE shipping
                </p>
                {activeReferral?.code && (
                  <p className="text-xs text-[#5E2B15] mt-2">
                    Referral applied:{" "}
                    <span className="font-semibold">{activeReferral.code}</span>
                  </p>
                )}
              </div>

              {buyNow.isError && (
                <p className="mb-3 text-xs text-red-600 text-center">
                  {(buyNow.error as Error)?.message ?? "Payment failed"}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("address")}
                  disabled={buyNow.isPending}
                  className="px-4 py-2.5 border-2 border-[#D6C9B6] rounded-xl text-sm text-[#7B6A58] hover:bg-[#efe2cf] transition disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handlePay}
                  disabled={buyNow.isPending}
                  className="flex-1 bg-[#819744] text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#6f873a] transition disabled:opacity-60"
                >
                  {buyNow.isPending
                    ? "Processing..."
                    : `Pay ₹${Number(preview.grandTotal).toFixed(2)}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main ProductClient ───────────────────────────────────────────────────────

export default function ProductClient({
  product,
  initialRelatedProducts,
}: {
  product: Product;
  initialRelatedProducts?: ProductListResponse;
}) {
  const MAX_REVIEW_IMAGES = 5;

  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [showAddReview, setShowAddReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImageUrls, setReviewImageUrls] = useState<string[]>([]);
  const [isUploadingReviewImage, setIsUploadingReviewImage] = useState(false);
  const [metricRatings, setMetricRatings] = useState<Record<string, number>>(
    {},
  );
  const [activeVariantId, setActiveVariantId] = useState<string | null>(
    product.variants[0]?.id ?? null,
  );
  const [showBuyNow, setShowBuyNow] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [resumeBuyNowAfterLogin, setResumeBuyNowAfterLogin] = useState(false);
  const { user } = useAuthStore();
  const addCartItem = useAddCartItem();
  const reviewsQuery = useProductReviews(product.id, {
    page: 1,
    limit: 10,
    sortBy: "newest",
  });
  const reviewSummaryQuery = useProductReviewSummary(product.id);
  const reviewMetricsQuery = useProductReviewMetrics(product.id);
  const reviewEligibilityQuery = useReviewEligibility(
    product.id,
    Boolean(user),
  );
  const createReview = useCreateProductReview(product.id);

  const reviewMetrics = reviewMetricsQuery.data ?? [];

  useEffect(() => {
    if (!reviewMetrics.length) return;
    setMetricRatings((prev) => {
      const next: Record<string, number> = { ...prev };
      for (const metric of reviewMetrics) {
        if (next[metric.id] === undefined) {
          next[metric.id] = Math.round((metric.minValue + metric.maxValue) / 2);
        }
      }
      return next;
    });
  }, [reviewMetrics]);

  const reviewSummary = reviewSummaryQuery.data;
  const reviewList = reviewsQuery.data?.data ?? [];
  const allReviewImages = reviewList.flatMap((r) => r.images ?? []);
  const reviewEligibility = reviewEligibilityQuery.data;

  const reviewMetricDefinitionById = useMemo(
    () => new Map(reviewMetrics.map((metric) => [metric.id, metric])),
    [reviewMetrics],
  );

  const reviewSummaryMetrics = reviewSummary?.metrics ?? [];
  const reviewMetricSummary = useMemo(() => {
    if (reviewSummaryMetrics.length > 0) {
      return reviewSummaryMetrics.map((metric) => {
        const definition = reviewMetricDefinitionById.get(metric.metricId);
        return {
          metricId: metric.metricId,
          name: metric.name,
          icon: metric.icon,
          average: Number(metric.average ?? 0),
          unit: definition?.unit ?? "PERCENT",
          minValue: definition?.minValue ?? 0,
          maxValue:
            definition?.maxValue ??
            ((definition?.unit ?? "PERCENT") === "RATING" ? 5 : 100),
        };
      });
    }

    if (reviewList.length === 0) {
      return [];
    }

    const grouped = new Map<
      string,
      {
        metricId: string;
        name: string;
        icon: string | null;
        unit: ReviewMetric["unit"];
        total: number;
        count: number;
        minValue: number;
        maxValue: number;
      }
    >();

    for (const review of reviewList) {
      for (const metric of review.metrics ?? []) {
        const definition = reviewMetricDefinitionById.get(metric.metricId);
        const existing = grouped.get(metric.metricId);

        if (existing) {
          existing.total += Number(metric.value ?? 0);
          existing.count += 1;
          continue;
        }

        grouped.set(metric.metricId, {
          metricId: metric.metricId,
          name: metric.name,
          icon: metric.icon,
          unit: metric.unit,
          total: Number(metric.value ?? 0),
          count: 1,
          minValue: definition?.minValue ?? 0,
          maxValue:
            definition?.maxValue ?? (metric.unit === "RATING" ? 5 : 100),
        });
      }
    }

    return Array.from(grouped.values()).map((metric) => ({
      metricId: metric.metricId,
      name: metric.name,
      icon: metric.icon,
      unit: metric.unit,
      average: metric.count > 0 ? metric.total / metric.count : 0,
      minValue: metric.minValue,
      maxValue: metric.maxValue,
    }));
  }, [reviewSummaryMetrics, reviewList, reviewMetricDefinitionById]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    console.info("[ProductClient] review metrics", {
      summaryMetrics: reviewSummaryMetrics.length,
      renderedMetrics: reviewMetricSummary.length,
      metricDefinitions: reviewMetrics.length,
      reviews: reviewList.length,
    });
  }, [
    reviewSummaryMetrics.length,
    reviewMetricSummary.length,
    reviewMetrics.length,
    reviewList.length,
  ]);

  // Related products from same category
  const categoryId = product.categories?.[0]?.category?.id;
  const { data: relatedData } = useProducts({
    categoryId,
    limit: 4,
    isActive: true,
  }, {
    enabled: Boolean(categoryId),
    initialData: initialRelatedProducts,
  });
  const relatedProducts = (relatedData?.data ?? [])
    .filter((p) => p.id !== product.id)
    .slice(0, 3);

  // Images (sorted by position)
  const images = [...product.images]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map<ProductGalleryImage>((img) => ({
      imageUrl: img.imageUrl,
      heroImageUrl: img.heroImageUrl ?? img.imageUrl,
      thumbnailImageUrl: img.thumbnailImageUrl ?? img.imageUrl,
      placeholder: img.placeholder ?? null,
      width: img.width ?? null,
      height: img.height ?? null,
    }));
  const displayImages: ProductGalleryImage[] =
    images.length > 0
      ? images
      : [
          {
            imageUrl: "/img/facewash.webp",
            heroImageUrl: "/img/facewash.webp",
            thumbnailImageUrl: "/img/facewash.webp",
          },
        ];

  const activeImage = displayImages[activeImg] ?? displayImages[0];
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    setHeroLoaded(false);
  }, [activeImg]);

  const defaultFallbackImage = useMemo(
    () =>
      displayImages[0]?.heroImageUrl ??
      displayImages[0]?.imageUrl ??
      "/img/facewash.webp",
    [displayImages],
  );
  const showHeroImage = heroLoaded || !activeImage.placeholder;

  const activeVariant = product.variants.find((v) => v.id === activeVariantId);

  // Compute price display
  const activePrice =
    activeVariant?.price != null ? Number(activeVariant.price) : null;
  const activeMrp =
    activeVariant?.mrp != null ? Number(activeVariant.mrp) : null;
  const hasActiveDiscount =
    activePrice != null && activeMrp != null && activeMrp > activePrice;

  // Content sections
  const sections = product.contentSections ?? [];
  const benefitsSection = getSection(sections, "BENEFITS");
  const highlightsSection = getSection(sections, "HIGHLIGHTS");
  const suitableSection = getSection(sections, "SUITABLE_FOR");
  const usageSection = getSection(sections, "USAGE_INSTRUCTION");
  const beforeAfterSection = getSection(sections, "BEFORE_AFTER");
  const faqSection = getSection(sections, "FAQ");
  const ingredientsSection = getSection(sections, "INGREDIENTS");
  const ingredientsContent = ingredientsSection?.content as any;
  const hasIngredients =
    Boolean(ingredientsContent?.text) ||
    (ingredientsContent?.list?.length ?? 0) > 0 ||
    (ingredientsContent?.cardItems?.length ?? 0) > 0;
  const [showIngredients, setShowIngredients] = useState(false);

  // Quick info badges — from HIGHLIGHTS or HIGHLIGHTS.badges
  const highlightsContent = highlightsSection?.content as any;
  const quickBadges: { text: string; iconKey?: string }[] =
    highlightsContent?.badges ?? [
      { text: "Brightens", iconKey: "sun" },
      { text: "Refresh", iconKey: "bolt" },
      { text: "Gentle", iconKey: "droplet" },
      { text: "Non-Drying", iconKey: "check" },
      { text: "pH Balanced", iconKey: "leaf" },
    ];
  const badgeIconMap: Record<string, any> = {
    sun: faSun,
    bolt: faBolt,
    droplet: faDroplet,
    check: faCheckCircle,
    leaf: faLeaf,
  };

  // Suitability tag for the "Best suited for:" line
  const suitableContent = suitableSection?.content as any;
  const bestSuitedFor = suitableContent?.skinType as string | undefined;

  const handleAddToCart = () => {
    if (!activeVariant?.id) {
      toast.error("Please select a valid variant.");
      return;
    }
    addCartItem.mutate(
      { productVariantId: activeVariant.id, quantity: qty },
      {
        onSuccess: () => toast.success("Item added to cart!"),
        onError: (error) => {
          const message =
            error instanceof Error ? error.message : "Failed to add to cart";
          toast.error(message);
        },
      },
    );
  };

  const continueBuyNow = useCallback(() => {
    if (!activeVariant?.id) {
      toast.error("Please select a valid variant.");
      return;
    }

    addCartItem.mutate(
      { productVariantId: activeVariant.id, quantity: qty },
      {
        onSuccess: () => router.push("/checkout"),
        onError: (error) => {
          const message =
            error instanceof Error ? error.message : "Failed to add to cart";
          toast.error(message);
        },
      },
    );
  }, [activeVariant?.id, qty, addCartItem, router]);

  useEffect(() => {
    if (!user || !resumeBuyNowAfterLogin) return;
    setResumeBuyNowAfterLogin(false);
    continueBuyNow();
  }, [user, resumeBuyNowAfterLogin, continueBuyNow]);

  const handleBuyNow = () => {
    if (!user) {
      setResumeBuyNowAfterLogin(true);
      setIsAuthModalOpen(true);
      return;
    }
    continueBuyNow();
  };

  const handleSubmitReview = () => {
    if (!user) {
      toast.error("Please sign in to add a review.");
      return;
    }

    if (!reviewEligibility?.canReview) {
      toast.error("Only customers who bought this product can review.");
      return;
    }

    createReview.mutate(
      {
        productId: product.id,
        rating: reviewRating,
        title: reviewTitle.trim() || undefined,
        comment: reviewComment.trim() || undefined,
        images: reviewImageUrls.length ? reviewImageUrls : undefined,
        metrics: reviewMetrics.map((metric) => ({
          metricId: metric.id,
          value: metricRatings[metric.id] ?? metric.minValue,
        })),
      },
      {
        onSuccess: () => {
          toast.success("Review submitted successfully.");
          setShowAddReview(false);
          setReviewRating(5);
          setReviewTitle("");
          setReviewComment("");
          setReviewImageUrls([]);
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "Failed to submit review",
          );
        },
      },
    );
  };

  const handleReviewImageSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    e.target.value = "";

    if (!selectedFiles.length) {
      return;
    }

    const remainingSlots = Math.max(
      0,
      MAX_REVIEW_IMAGES - reviewImageUrls.length,
    );
    if (remainingSlots <= 0) {
      toast.error(`You can upload up to ${MAX_REVIEW_IMAGES} images.`);
      return;
    }

    const filesToUpload = selectedFiles.slice(0, remainingSlots);
    if (selectedFiles.length > remainingSlots) {
      toast.error(`Only ${remainingSlots} more image(s) can be uploaded.`);
    }

    setIsUploadingReviewImage(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of filesToUpload) {
        const url = await uploadReviewImage(file);
        uploadedUrls.push(url);
      }

      setReviewImageUrls((prev) => [...prev, ...uploadedUrls]);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to upload review image",
      );
    } finally {
      setIsUploadingReviewImage(false);
    }
  };

  const handleRemoveReviewImage = (index: number) => {
    setReviewImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Swipe handler for mobile image carousel
  let startX = 0;
  const handleSwipe = (direction: "left" | "right") => {
    if (direction === "left") {
      setActiveImg((prev) => (prev + 1) % displayImages.length);
    } else {
      setActiveImg((prev) =>
        prev === 0 ? displayImages.length - 1 : prev - 1,
      );
    }
  };

  return (
    <>
      <section className="bg-[#FAF3E2] overflow-x-hidden w-full max-w-full">
        {/* ── TOP HEADER BANNER ── */}
        <div
          className="relative px-4 sm:px-6 md:px-12 py-6 md:py-10 flex items-center justify-between bg-cover bg-center bg-no-repeat"
          // style={{ backgroundImage: `url(${displayImages[0]})` }}
          style={{ backgroundImage: `url('/img/facecare-banner.png')` }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/30" />
          {/* Content */}
          <div className="relative z-10 flex items-center justify-between w-full min-w-0 gap-2">
            <h1 className="text-white text-[18px] sm:text-[22px] md:text-[34px] font-semibold md:font-bold font-['Roboto',serif] leading-tight break-words pr-2 min-w-0">
              {product.categories?.[0]?.category?.name ?? product.name}
            </h1>
            <div className="w-14 h-14 sm:w-[60px] sm:h-[60px] md:w-[90px] md:h-[90px] bg-white rounded-full flex items-center justify-center shadow-md shrink-0">
              <Image
                src="/img/thumb.png"
                alt="product"
                width={54}
                height={54}
                className="w-[70%] h-[70%] md:w-[60%] md:h-[60%] object-contain"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* ── TOP: IMAGE + DETAILS ── */}
        <div className="px-4 md:px-12 py-6 md:py-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          {/* LEFT — Images */}
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              whileHover={{ scale: 1.05 }}
              className="w-full h-[380px] sm:h-[320px] md:h-[500px] flex items-center justify-center overflow-hidden"
              onTouchStart={(e: React.TouchEvent<HTMLDivElement>) => (startX = e.touches[0].clientX)}
              onTouchEnd={(e: React.TouchEvent<HTMLDivElement>) => {
                const endX = e.changedTouches[0].clientX;
                if (startX - endX > 50) handleSwipe("left");
                if (endX - startX > 50) handleSwipe("right");
              }}
            >
              <motion.div
                whileHover={{ scale: 1.2 }}
                transition={{ duration: 0.4 }}
                className="relative w-full h-full"
              >
                {activeImage.placeholder && (
                  <div
                    aria-hidden
                    className={`absolute inset-0 bg-center bg-cover transition-opacity duration-300 ${
                      heroLoaded ? "opacity-0" : "opacity-100"
                    }`}
                    style={{
                      backgroundImage: `url(${activeImage.placeholder})`,
                      filter: "blur(18px)",
                      transform: "scale(1.08)",
                    }}
                  />
                )}
                <Image
                  src={activeImage.heroImageUrl ?? activeImage.imageUrl}
                  alt={product.name}
                  fill
                  priority={activeImg === 0}
                  loading={activeImg === 0 ? undefined : "lazy"}
                  fetchPriority={activeImg === 0 ? "high" : "auto"}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  placeholder={activeImage.placeholder ? "blur" : "empty"}
                  blurDataURL={activeImage.placeholder ?? undefined}
                  onLoad={() => setHeroLoaded(true)}
                  className={`w-full h-full object-contain transition-opacity duration-300 ${
                    showHeroImage ? "opacity-100" : "opacity-0"
                  }`}
                />
              </motion.div>
            </motion.div>

            {/* Thumbnails */}
            <div className="flex gap-3 mt-4 overflow-x-auto scroll-smooth pb-2 max-w-full">
              {displayImages.map((img, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setActiveImg(i)}
                  className={`min-w-[78px] h-[78px] sm:min-w-[70px] sm:h-[70px] md:w-[90px] md:h-[90px] rounded-lg overflow-hidden cursor-pointer border ${
                    activeImg === i ? "border-2 border-[#819744]" : "opacity-70"
                  }`}
                >
                  <Image
                    src={img.thumbnailImageUrl ?? img.imageUrl}
                    alt={`thumb-${i}`}
                    width={100}
                    height={100}
                    sizes="90px"
                    placeholder={img.placeholder ? "blur" : "empty"}
                    blurDataURL={img.placeholder ?? undefined}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* RIGHT — Details */}
          <div className="pt-2">
            {/* Title */}
            <h2 className="text-[30px] font-bold text-[#5E2B16] mb-2">
              {product.name}
            </h2>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex text-[#FACC15]">
                {[...Array(5)].map((_, i) => (
                  <FontAwesomeIcon key={i} icon={faStar} />
                ))}
              </div>
              <span className="text-sm text-[#8B5E3C] font-semibold">
                Customer reviews
              </span>
            </div>

            {/* Quick Info */}
            <div className="space-y-2 mb-4">
              <p className="text-green-700 font-semibold text-[14px] flex items-center gap-2">
                <FontAwesomeIcon icon={faShoppingBag} />
                {(highlightsContent as any)?.unitsSold ??
                  "1,000+ Units Sold in 7 Days"}
              </p>
              <p className="text-[14px] text-[#8B5E3C] flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faStarHalfStroke}
                  className="text-yellow-500"
                />
                {reviewSummaryQuery.isLoading
                  ? "..."
                  : reviewSummary != null
                    ? `${(reviewSummary.avgRating ?? 0).toFixed(1)}/5 Rating`
                    : ((highlightsContent as any)?.rating ?? "")}
              </p>

              {/* Feature badges */}
              <div className="flex flex-wrap gap-2 text-[12px]">
                {quickBadges.map((tag, i) => (
                  <span
                    key={i}
                    className="bg-[#E6F0D6] text-[#5E2B16] px-3 py-1 rounded-full flex items-center gap-1"
                  >
                    <FontAwesomeIcon
                      icon={badgeIconMap[tag.iconKey ?? "leaf"] ?? faLeaf}
                      className="text-[10px]"
                    />
                    {tag.text}
                  </span>
                ))}
              </div>

              <p className="text-[#5E2B16] font-semibold flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="text-green-600"
                />
                {(highlightsContent as any)?.cta ??
                  "Try It Once. You'll Reorder."}
              </p>
            </div>

            {/* Description */}

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
              nourished. Say goodbye to dullness and uneven skin, lock in
              moisture for soft, supple skin, and enjoy balanced care that
              leaves your face feeling clean, energized, and healthy. Safe for
              all skin types, including sensitive skin, teens, and beginners, it
              delivers hydration, natural glow, and gentle daily care you can
              trust.
            </motion.div>

            {/* Variants / Size */}
            {product.variants.length > 0 && (
              <div className="mb-5 flex items-center gap-4 flex-wrap">
                <p className="font-['Roboto_Flex'] font-semibold text-[20px] text-[#3B7509]">
                  Size :
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setActiveVariantId(v.id)}
                      className={`px-4 py-1.5 text-[12px] rounded-full shadow-sm transition ${
                        activeVariantId === v.id
                          ? "bg-[#819744] text-[#5E2B16] font-semibold"
                          : "bg-[#EBF1DC] text-[#5E2B16] hover:bg-[#d9e0c5]"
                      }`}
                    >
                      {v.variantName ?? v.sku ?? `Variant ${v.id}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            {activePrice != null && (
              <div className="mb-4">
                <div className="flex items-center gap-3">
                  {hasActiveDiscount ? (
                    <>
                      <p className="text-[18px] text-[#9a7a65] line-through">
                        ₹{activeMrp}
                      </p>
                      <p className="text-[28px] font-bold text-[#5E2B16]">
                        ₹{activePrice}
                      </p>
                      <p className="text-sm text-[#2E7D32] font-semibold">
                        {activeMrp != null
                          ? `${(activeMrp - activePrice).toFixed(0)}rs off`
                          : ""}
                      </p>
                    </>
                  ) : (
                    <p className="text-[28px] font-bold text-[#5E2B16]">
                      ₹{activePrice}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Best Suited For */}
            {bestSuitedFor && (
              <p className="mb-6 text-[15px]">
                <span className="font-['Roboto_Flex'] font-semibold text-[20px] text-[#3B7509]">
                  Best suited for:
                </span>{" "}
                <span className="font-['Roboto_Flex'] font-semibold text-[18px] text-[#5E2B16]">
                  {bestSuitedFor}
                </span>
              </p>
            )}

            {/* Qty + Cart + Buy Now */}
            <div className="flex flex-col items-center sm:flex-row gap-6 sm:gap-6 mb-8">
              {/* Quantity Box */}
              <div className="flex border border-[#cfc7b8] h-[42px] rounded-lg font-semibold text-[14px] text-[#5E2B16]">
                <button
                  onClick={() => setQty(qty > 1 ? qty - 1 : 1)}
                  className="w-[42px] flex items-center justify-center text-[#5E2B16]"
                >
                  <FontAwesomeIcon icon={faMinus} />
                </button>
                <span className="w-[42px] flex items-center justify-center border-l border-r border-[#cfc7b8] text-[#819744] font-semibold">
                  {qty}
                </span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-[42px] flex items-center justify-center text-[#5E2B16]"
                >
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              </div>

              {/* Desktop: Cart + Buy Now */}
              <div className="hidden md:flex flex-col sm:flex-row gap-4 sm:gap-6">
                <button
                  onClick={handleAddToCart}
                  disabled={addCartItem.isPending}
                  className="flex h-[42px] cursor-pointer hover:scale-105 transition disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <span className="bg-[#E5EAD9] text-[#5E2B16] px-6 flex items-center font-semibold text-[14px] tracking-wide">
                    {addCartItem.isPending ? "ADDING..." : "ADD TO CART"}
                  </span>
                  <span className="bg-[#819744] text-white px-4 flex items-center">
                    <FontAwesomeIcon icon={faCartShopping} />
                  </span>
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={addCartItem.isPending}
                  className="bg-[#819744] text-white px-5 h-[42px] rounded-lg font-semibold flex items-center gap-2 hover:opacity-90 hover:scale-105 transition disabled:opacity-60 cursor-pointer"
                >
                  <FontAwesomeIcon icon={faBolt} />
                  {addCartItem.isPending ? "Adding..." : "Buy Now"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── STICKY MOBILE BAR ── */}
        <div className="fixed inset-x-0 bottom-0 w-full max-w-full overflow-x-hidden bg-white border-t px-2 py-2 flex items-center gap-2 md:hidden z-50">
          <div className="shrink-0 min-w-0 max-w-[34%]">
            <p className="text-[#5E2B16] font-bold truncate text-sm">
              {activePrice != null ? (
                <span className="flex items-center gap-2">
                  {hasActiveDiscount && activeMrp != null ? (
                    <span className="text-[11px] text-[#9a7a65] line-through">
                      ₹{activeMrp}
                    </span>
                  ) : null}
                  <span>₹{activePrice}</span>
                </span>
              ) : (
                ""
              )}
            </p>
            <p className="text-[10px] text-[#8B5E3C] truncate">
              Inclusive of taxes
            </p>
          </div>
          <div className="min-w-0 flex flex-1 gap-2">
            <button
              onClick={handleAddToCart}
              disabled={addCartItem.isPending}
              className="min-w-0 flex-1 bg-[#E5EAD9] text-[#5E2B16] py-2.5 rounded-lg flex items-center justify-center gap-1 font-semibold text-[12px] disabled:opacity-70"
            >
              <FontAwesomeIcon icon={faCartShopping} />
              {addCartItem.isPending ? "Adding..." : "Add to Cart"}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={addCartItem.isPending}
              className="min-w-0 flex-1 bg-[#819744] text-white py-2.5 rounded-lg flex items-center justify-center gap-1 font-semibold text-[12px] disabled:opacity-70"
            >
              <FontAwesomeIcon icon={faBolt} />
              Buy Now
            </button>
          </div>
        </div>

        {/* ── ADDITIONAL INFO: BENEFITS + INGREDIENTS ── */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center font-['Marko-One'] text-[24px] sm:text-[30px] md:text-[42px] font-semibold text-[#819744] mb-8 md:mb-12"
        >
          Additional Information
        </motion.h2>
        <div className="bg-[#EBF1DC] py-8 md:py-10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 px-4 sm:px-6 items-center">
            {/* LEFT: Benefits + Ingredients grid + Results */}
            <div>
              <motion.h3 className="text-[#819744] font-['Roboto_Flex'] font-bold text-[18px] sm:text-[20px] md:text-[24px] mb-5 md:mb-6">
                {benefitsSection?.title ?? "BENEFITS:"}
              </motion.h3>
              <BenefitsSection section={benefitsSection} />

              {hasIngredients && (
                <div className="mt-8 md:mt-10">
                  <button
                    onClick={() => setShowIngredients((prev) => !prev)}
                    className="inline-flex items-center gap-2 bg-[#819744] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#6e8539] transition"
                  >
                    {showIngredients ? "Hide Ingredients" : "View Ingredients"}
                    <FontAwesomeIcon
                      icon={showIngredients ? faMinus : faPlus}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {showIngredients && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <IngredientsGridSection section={ingredientsSection} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <ResultsSection section={getSection(sections, "CUSTOM")} />
            </div>

            {/* RIGHT: illustration */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.03 }}
              className="flex justify-end"
            >
              <div className="relative w-[520px] h-[420px] max-w-full">
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

        {/* ── WHY US / HIGHLIGHTS ── */}
        <HighlightsSection section={highlightsSection} />

        {/* ── SUITABLE + USAGE + BEFORE/AFTER ── */}
        <div className="bg-[#EBF1DC] py-10 px-4 md:px-12">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 mb-12">
            <SuitableForSection section={suitableSection} />
            <UsageInstructionSection section={usageSection} />
          </div>
          <BeforeAfterSection
            section={beforeAfterSection}
            fallbackImage={defaultFallbackImage}
          />
        </div>

        {/* ── RELATED PRODUCTS ── */}
        {relatedProducts.length > 0 && (
          <div className="py-16 px-6 bg-[#F5F0E6]">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center text-[#819744] font-['Marko_One'] text-[34px] font-semibold mb-10"
            >
              Related Products
            </motion.h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {relatedProducts.map((item, i) => {
                const img =
                  item.images.find((im) => im.position === 0)?.imageUrl ??
                  item.images[0]?.imageUrl ??
                  defaultFallbackImage;
                const minPrice = item.variants.reduce(
                  (best, v) => {
                    const price = v.price != null ? Number(v.price) : 0;
                    if (price <= 0) return best;
                    if (!best || price < best.price) {
                      return {
                        price,
                        mrp: v.mrp != null ? Number(v.mrp) : 0,
                      };
                    }
                    return best;
                  },
                  null as { price: number; mrp: number } | null,
                );
                const minPriceValue = minPrice?.price ?? 0;
                const minMrpValue = minPrice?.mrp ?? 0;
                const hasDiscount =
                  minMrpValue > minPriceValue && minPriceValue > 0;
                return (
                  <Link key={item.id} href={`/product/${item.slug}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: i * 0.2 }}
                      viewport={{ once: true }}
                      whileHover={{ y: -8 }}
                      className="relative rounded-[20px] overflow-hidden group cursor-pointer shadow-md"
                    >
                      <div className="overflow-hidden">
                        <Image
                          src={img}
                          alt={item.name}
                          width={433}
                          height={427}
                          className="w-full h-[320px] object-cover transition duration-500 group-hover:scale-110"
                        />
                      </div>
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
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="absolute bottom-0 left-0 w-full bg-[#7A736A]/80 backdrop-blur-md text-white p-4"
                      >
                        <h3 className="font-semibold text-[16px]">
                          {item.name}
                        </h3>
                        {item.description && (
                          <p className="text-[13px] opacity-90 mt-1 leading-5 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        <div className="flex justify-between items-center mt-3 text-[13px]">
                          <span>{item.variants[0]?.variantName ?? ""}</span>
                          <span className="font-semibold flex items-center gap-2">
                            {hasDiscount && (
                              <span className="text-[11px] text-white/70 line-through">
                                ₹{minMrpValue}
                              </span>
                            )}
                            <span>
                              {minPriceValue > 0 ? `₹${minPriceValue}` : ""}
                            </span>
                          </span>
                        </div>
                      </motion.div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── REVIEWS ── */}
        <div className="bg-[#F5F0E6] py-10 px-4 sm:px-6 md:py-12">
          <div className="max-w-5xl mx-auto">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center text-[#819744] font-['Marko_One'] text-[22px] sm:text-[26px] md:text-[34px] font-semibold mb-8"
            >
              Customer Reviews
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[18px] md:text-[22px] text-[#5e2b16] font-bold">
                    {reviewSummaryQuery.isLoading
                      ? "..."
                      : (reviewSummary?.avgRating ?? 0).toFixed(1)}
                  </span>
                  <FontAwesomeIcon icon={faStar} className="text-green-600" />
                  <span className="bg-green-100 text-green-700 px-2 py-[2px] rounded text-xs md:text-sm">
                    {(reviewSummary?.avgRating ?? 0) >= 4
                      ? "Very Good"
                      : "Good"}
                  </span>
                </div>

                {user && reviewEligibility?.canReview && (
                  <button
                    onClick={() => setShowAddReview((prev) => !prev)}
                    className="bg-[#819744] text-white text-xs md:text-sm px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition"
                  >
                    {showAddReview ? "Close" : "Add Review"}
                  </button>
                )}
              </div>

              <p className="text-[12px] md:text-[14px] text-[#8B5E3C] mb-4">
                based on {reviewSummary?.totalReviews ?? 0} ratings by verified
                buyers
              </p>

              {reviewMetricSummary.length > 0 && (
                <div className="space-y-2 text-[11px] md:text-[12px] mb-4">
                  {reviewMetricSummary.map((metric) => {
                    const range = Math.max(metric.maxValue - metric.minValue, 1);
                    const normalized =
                      ((metric.average - metric.minValue) / range) * 100;
                    const clampedWidth = Math.max(0, Math.min(100, normalized));
                    const valueLabel =
                      metric.unit === "RATING"
                        ? metric.average.toFixed(1)
                        : `${Math.round(metric.average)}%`;

                    return (
                      <div key={metric.metricId}>
                        <div className="flex justify-between items-center text-[#5E2B16] mb-1">
                          <div className="flex items-center gap-1">
                            <FontAwesomeIcon
                              icon={getMetricIcon(metric.name, metric.icon)}
                              className="text-[#819744]"
                            />
                            <span>{metric.name}</span>
                          </div>
                          <span>{valueLabel}</span>
                        </div>
                        <div className="w-full bg-white/60 rounded-full h-2">
                          <div
                            className="bg-[#819744] h-2 rounded-full"
                            style={{ width: `${clampedWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {reviewEligibility?.hasReviewed && (
                <p className="text-xs md:text-sm text-[#7f6a58] mb-4">
                  You have already submitted a review for this product.
                </p>
              )}
              {user && reviewEligibility && !reviewEligibility.hasPurchased && (
                <p className="text-xs md:text-sm text-[#7f6a58] mb-4">
                  Add Review is available after purchasing this product.
                </p>
              )}

              {showAddReview && reviewEligibility?.canReview && (
                <div className="mb-5 bg-[#F5F0E6] p-4 rounded-xl border border-[#E6DCCB] space-y-3">
                  <p className="text-sm font-semibold text-[#5E2B16]">
                    Write your review
                  </p>

                  <div>
                    <p className="text-xs text-[#8B5E3C] mb-2">Rating</p>
                    <div className="flex items-center gap-2 text-[#819744]">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className="text-lg"
                        >
                          <FontAwesomeIcon
                            icon={faStar}
                            className={
                              star <= reviewRating
                                ? "opacity-100"
                                : "opacity-35"
                            }
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="Title (optional)"
                    className="w-full px-3 py-2 rounded-lg border border-[#D6C9B6] bg-white/80 text-sm"
                  />
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience"
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-[#D6C9B6] bg-white/80 text-sm"
                  />

                  <div className="space-y-3">
                    <p className="text-xs font-medium text-[#8B5E3C]">
                      Add photos (optional)
                    </p>

                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleReviewImageSelect}
                      disabled={
                        isUploadingReviewImage ||
                        createReview.isPending ||
                        reviewImageUrls.length >= MAX_REVIEW_IMAGES
                      }
                      className="block w-full text-xs text-[#5E2B16]
               file:mr-3 file:px-3 file:py-1.5
               file:rounded-md file:border-0
               file:text-xs file:font-medium
               file:bg-[#EADBC8] file:text-[#5E2B16]
               hover:file:bg-[#ecd2af]
               cursor-pointer disabled:cursor-not-allowed"
                    />

                    {isUploadingReviewImage && (
                      <p className="text-xs text-[#8B5E3C] animate-pulse">
                        Uploading image...
                      </p>
                    )}

                    {reviewImageUrls.length > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        {reviewImageUrls.map((url, index) => (
                          <div
                            key={`${url}-${index}`}
                            className="relative group rounded-lg overflow-hidden border border-[#D6C9B6] bg-white"
                          >
                            <Image
                              src={url}
                              alt={`review-upload-${index}`}
                              width={120}
                              height={120}
                              className="w-full h-24 object-cover"
                            />

                            <button
                              type="button"
                              onClick={() => handleRemoveReviewImage(index)}
                              className="absolute top-1 right-1 w-6 h-6
                       rounded-full bg-black/70 text-white text-xs
                       flex items-center justify-center
                       opacity-0 group-hover:opacity-100
                       transition"
                              aria-label="Remove uploaded image"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {reviewMetrics.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-[#8B5E3C]">
                        Rate product metrics
                      </p>
                      {reviewMetrics.map((metric: ReviewMetric) => {
                        const range = metric.maxValue - metric.minValue || 1;
                        const value =
                          metricRatings[metric.id] ?? metric.minValue;
                        return (
                          <div key={metric.id}>
                            <div className="flex items-center justify-between text-xs text-[#5E2B16] mb-1">
                              <span className="flex items-center gap-2">
                                <FontAwesomeIcon
                                  icon={getMetricIcon(metric.name, metric.icon)}
                                  className="text-[#819744]"
                                />
                                {metric.name}
                              </span>
                              <span>
                                {value}
                                {metric.unit === "PERCENT" ? "%" : ""}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={metric.minValue}
                              max={metric.maxValue}
                              value={value}
                              onChange={(e) =>
                                setMetricRatings((prev) => ({
                                  ...prev,
                                  [metric.id]: Number(e.target.value),
                                }))
                              }
                              className="w-full"
                              style={{ accentColor: "#819744" }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button
                    onClick={handleSubmitReview}
                    disabled={createReview.isPending}
                    className="bg-[#5E2B16] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
                  >
                    {createReview.isPending ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              )}

              {allReviewImages.length > 0 && (
                <div className="flex gap-2 mb-4 w-full overflow-x-auto">
                  {allReviewImages.map((img) => (
                    <a
                      key={img.id}
                      href={img.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-lg overflow-hidden border border-[#D6C9B6] w-24 h-24"
                    >
                      <Image
                        src={img.imageUrl}
                        alt="review"
                        width={96}
                        height={96}
                        className="w-24 h-24 object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}

              <div className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2">
                {reviewsQuery.isLoading && (
                  <p className="text-sm text-[#8B5E3C]">Loading reviews...</p>
                )}

                {!reviewsQuery.isLoading && reviewList.length === 0 && (
                  <p className="text-sm text-[#8B5E3C]">
                    No reviews yet. Be the first to review after purchase.
                  </p>
                )}

                {reviewList.map((review) => (
                  <motion.div
                    key={review.id}
                    whileHover={{ scale: 1.03 }}
                    className="snap-start min-w-[85%] sm:min-w-[48%] md:min-w-[350px] bg-[#F5F0E6] p-4 rounded-xl shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1 text-[#819744] text-[13px] md:text-[14px]">
                        {[...Array(review.rating)].map((_, i) => (
                          <FontAwesomeIcon key={i} icon={faStar} />
                        ))}
                      </div>

                      <span className="text-[10px] md:text-xs text-[#8B5E3C]">
                        {getRelativeDateLabel(review.createdAt)}
                      </span>
                    </div>

                    {review.metrics.length > 0 && (
                      <div className="space-y-2 text-[11px] md:text-[12px]">
                        {review.metrics.map((metric) => (
                          <div key={`${review.id}-${metric.metricId}`}>
                            <div className="flex justify-between items-center text-[#5E2B16] mb-1">
                              <div className="flex items-center gap-1">
                                <FontAwesomeIcon
                                  icon={getMetricIcon(metric.name, metric.icon)}
                                  className="text-[#819744]"
                                />
                                <span>{metric.name}</span>
                              </div>
                              <span>
                                {metric.value}
                                {metric.unit === "PERCENT" ? "%" : ""}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[11px] md:text-[12px]">
                      <div className="flex items-center gap-2 text-[#819744] font-semibold">
                        {review.isVerifiedPurchase && (
                          <FontAwesomeIcon icon={faCheckCircle} />
                        )}
                        {review.isVerifiedPurchase ? "Verified" : "Customer"}
                      </div>

                      <div className="flex text-[#819744]">
                        {[...Array(review.rating)].map((_, i) => (
                          <FontAwesomeIcon
                            key={`${review.id}-rate-${i}`}
                            icon={faStar}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="text-[11px] md:text-[13px] text-[#5E2B16]">
                      <p className="font-semibold">{review.user.name}</p>
                    </div>

                    {review.title && (
                      <p className="text-[12px] md:text-[14px] text-[#5E2B16] font-semibold leading-5">
                        {review.title}
                      </p>
                    )}

                    {review.comment && (
                      <p className="text-[12px] md:text-[14px] text-[#5E2B16] italic leading-5">
                        {review.comment}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="bg-[#F5F0E6] py-10 px-4 sm:px-6 md:py-16">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center text-[#819744] font-['Marko_One'] text-[22px] sm:text-[26px] md:text-[34px] font-semibold mb-8 md:mb-12"
          >
            Frequently Asked Questions
          </motion.h2>
          <FaqSection section={faqSection} />

          {/* Additional Info table */}
          <div className="max-w-4xl mx-auto mt-10 md:mt-16 bg-white rounded-lg md:rounded-xl shadow-sm md:shadow-md p-4 sm:p-5 md:p-6">
            <h3 className="text-[#819744] font-semibold text-[18px] sm:text-[20px] md:text-[22px] mb-4 md:mb-6">
              Additional Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 text-[13px] sm:text-[14px] text-[#5E2B16]">
              <div className="flex items-start gap-2">
                <FontAwesomeIcon
                  icon={faGlobe}
                  className="text-[#819744] mt-1"
                />
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
                  <p>{product.brand ?? "Pureastra"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FontAwesomeIcon
                  icon={faIndustry}
                  className="text-[#819744] mt-1"
                />
                <div>
                  <p className="font-semibold">Manufactured By</p>
                  <p>Pureastra Labs</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FontAwesomeIcon icon={faBox} className="text-[#819744] mt-1" />
                <div>
                  <p className="font-semibold">Quantity</p>
                  <p>
                    {activeVariant?.variantName ??
                      product.variants[0]?.variantName ??
                      "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showBuyNow &&
        activeVariant?.id &&
        (() => {
          const variantId = activeVariant.id;
          return (
            <BuyNowPanel
              productVariantId={variantId}
              quantity={qty}
              onClose={() => setShowBuyNow(false)}
              onSuccess={(orderNumber) => {
                setShowBuyNow(false);
                router.push(
                  `/order-history?order=${encodeURIComponent(orderNumber)}`,
                );
              }}
            />
          );
        })()}

      <AuthModal
        open={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
