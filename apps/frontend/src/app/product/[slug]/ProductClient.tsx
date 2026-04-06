"use client";
import toast from "react-hot-toast";

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
} from "@fortawesome/free-solid-svg-icons";

import { motion, AnimatePresence } from "framer-motion";
import type { Product, ProductContentSection } from "@/services/api";
import { useAddCartItem } from "@/hooks/useCart";
import { useAuthStore } from "@/store/auth.store";
import { useProducts } from "@/hooks/useProducts";

// ─── Section Helper ────────────────────────────────────────────────────────────

function getSection(
  sections: ProductContentSection[],
  type: string,
): ProductContentSection | undefined {
  return sections.find((s) => s.sectionType === type);
}

// ─── Benefits Section ─────────────────────────────────────────────────────────

function BenefitsSection({
  section,
}: {
  section: ProductContentSection | undefined;
}) {
  const content = section?.content as any;
  console.log("content", content);
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
          <h4 className="font-semibold text-[#2C2C2C] font-['Roboto_Flex'] text-[18px]">
            {item.title}
          </h4>
          <p className="text-sm text-[#535353] font-['Roboto_Flex'] text-[16px] mt-1">
            {item.desc}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Ingredients Grid Section ─────────────────────────────────────────────────

const defaultIngredientIcons = [
  faSun,
  faBolt,
  faLeaf,
  faCheckCircle,
  faDroplet,
  faDroplet,
];

function IngredientsGridSection({
  section,
}: {
  section: ProductContentSection | undefined;
}) {
  const content = section?.content as any;
  const list: string[] = content?.list ?? [];
  const text: string = content?.text ?? "";

  // Rich card items — from DB or fallback
  const cardItems: { title: string; desc: string }[] = content?.cardItems ?? [];

  if (!list.length && !text && !cardItems.length) return null;

  return (
    <div className="mt-10">
      <h3 className="text-[#819744] font-bold text-[22px] mb-6">
        INGREDIENTS:
      </h3>

      {/* Card grid view */}
      {cardItems.length > 0 && (
        <div className="grid md:grid-cols-2 gap-5 text-[14px]">
          {cardItems.map((item: { title: string; desc: string }, i: number) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className="bg-[#D9DFC8] border border-[#E6E6E6] rounded-xl p-4 flex items-start gap-3 shadow-sm"
            >
              <div className="w-[36px] h-[36px] rounded-full bg-[#EBF1DC] flex items-center justify-center shrink-0">
                <FontAwesomeIcon
                  icon={
                    defaultIngredientIcons[i % defaultIngredientIcons.length]
                  }
                  className="text-[#819744]"
                />
              </div>
              <div>
                <h4 className="font-semibold text-[#2C2C2C]">{item.title}</h4>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tag list view */}
      {list.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {list.map((ing, i) => (
            <li
              key={i}
              className="bg-[#EBF1DC] text-[#5C6936] text-xs px-3 py-1 rounded-full font-medium"
            >
              {ing}
            </li>
          ))}
        </ul>
      )}

      {/* Full text */}
      {text && <p className="mt-4 text-sm text-[#5f5f5f] leading-6">{text}</p>}
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
  const stats: string[] = content?.stats ?? [
    "Week 1: 60% feel hydrated & soft",
    "Week 2: 75% notice reduced dullness",
    "Week 3: 95% see brighter skin",
  ];

  return (
    <div className="mt-8 space-y-3">
      {stats.map((item, i) => (
        <div
          key={i}
          className="bg-[#D9DFC8] px-4 py-3 rounded-lg text-[14px] flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faCheckCircle} className="text-[#819744]" />
          {item}
        </div>
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
    <div className="bg-[#EBF1DC] py-16 text-center">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="text-[32px] font-bold text-[#819744] font-['Roboto_Flex'] mb-4"
      >
        {whyUsTitle}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        viewport={{ once: true }}
        className="text-[#5C6936] text-[18px] font-['Roboto_Flex'] font-bold mb-10"
      >
        {tagline}
      </motion.p>
      <div className="bg-[url('/img/why-us-banner.webp')] bg-cover bg-center py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-5 gap-6 px-6 max-md:grid-cols-2">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2, duration: 0.5 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.1 }}
              className="flex flex-col items-center text-white cursor-pointer"
            >
              <motion.div
                whileHover={{ rotate: 5 }}
                className="text-[50px] mb-4"
              >
                <FontAwesomeIcon icon={iconsMap[i] ?? faLeaf} />
              </motion.div>
              <p className="max-w-[160px] font-['Roboto_Flex'] font-bold text-sm">
                {item.text}
              </p>
            </motion.div>
          ))}
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
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <h3 className="text-[#819744] font-bold text-[24px] font-['Roboto_Flex'] mb-6 tracking-wide">
        SUITABLE FOR:
      </h3>
      <div className="space-y-3 text-[#5E2B16] text-[16px]">
        {fields.map((f, i) => (
          <p key={i}>
            <span className="text-[#5C6936] font-['Roboto_Flex'] text-[14px] font-semibold">
              {f.label}:
            </span>{" "}
            {f.value}
          </p>
        ))}
      </div>
    </motion.div>
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
    "Always patch test before first use, especially if you have sensitive skin.",
    "Store in a cool, dry place away from direct sunlight.",
    "Handle with care—natural ingredients may separate slightly, which is normal.",
  ];
  const stepIcons = [faClipboardCheck, faSnowflake, faLeaf];

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <h3 className="text-[#819744] font-bold text-[24px] font-['Roboto_Flex'] mb-6 tracking-wide">
        USAGE INSTRUCTION:
      </h3>
      <div className="space-y-4 text-[#5E2B16] text-[16px]">
        {steps.map((step, i) => (
          <div
            key={i}
            className="flex gap-3 items-start font-['Roboto_Flex'] text-[14px] text-[#5C6936]"
          >
            <FontAwesomeIcon
              icon={stepIcons[i % stepIcons.length]}
              className="mt-1 text-[#819744]"
            />
            <p>{step}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Before/After Section ─────────────────────────────────────────────────────

function BeforeAfterSection({
  section,
}: {
  section: ProductContentSection | undefined;
}) {
  const content = section?.content as any;
  const beforeLabel: string = content?.beforeLabel ?? "Dull Skin";
  const afterLabel: string = content?.afterLabel ?? "Radiant Skin";
  const beforeImg: string = content?.beforeImage ?? "/img/before1.webp";
  const afterImg: string = content?.afterImage ?? "/img/after1.webp";
  const caption: string = content?.caption ?? "Brighter skin in just 2 weeks";

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div className="flex justify-center items-center gap-6 mb-6 text-[#819744] font-['Roboto_Flex'] font-semibold text-[28px]">
        <div className="w-[284px] text-center">Before</div>
        <div className="w-[284px] text-center">After</div>
      </div>

      <div className="flex items-center justify-center gap-2 relative">
        {/* BEFORE */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="w-[284px] h-[368px] bg-[#FAF3E2] rounded-[29px] overflow-hidden border border-black shadow-[0_8px_20px_rgba(0,0,0,0.08)] flex flex-col transition-transform duration-300 hover:-translate-y-1"
        >
          <div className="relative w-full h-[313px]">
            <Image src={beforeImg} alt="before" fill className="object-cover" />
          </div>
          <div className="h-[55px] flex items-center justify-center bg-[#FAF3E2]">
            <p className="text-sm text-[#819744] font-bold font-['Roboto_Serif',serif]">
              {beforeLabel}
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
          <div className="relative w-full h-[313px]">
            <Image src={afterImg} alt="after" fill className="object-cover" />
          </div>
          <div className="h-[55px] flex items-center justify-center bg-[#FAF3E2]">
            <p className="text-sm text-[#819744] font-bold font-['Roboto_Serif',serif]">
              {afterLabel}
            </p>
          </div>
        </motion.div>
      </div>

      <p className="mt-6 text-[#819744] text-[24px] font-['Roboto_Flex'] font-bold">
        {caption}
      </p>
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
  );
}

// ─── Main ProductClient ───────────────────────────────────────────────────────

export default function ProductClient({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [tab, setTab] = useState("desc");
  const [activeVariantId, setActiveVariantId] = useState<string | null>(
    product.variants[0]?.id ?? null,
  );
  const { user } = useAuthStore();
  const addCartItem = useAddCartItem();

  // Related products from same category
  const categoryId = product.categories?.[0]?.category?.id;
  const { data: relatedData } = useProducts({
    categoryId,
    limit: 4,
    isActive: true,
  });
  const relatedProducts = (relatedData?.data ?? [])
    .filter((p) => p.id !== product.id)
    .slice(0, 3);

  // Images (sorted by position)
  const images = [...product.images]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((img) => img.imageUrl);
  const displayImages = images.length > 0 ? images : ["/img/facewash.webp"];

  const activeVariant = product.variants.find((v) => v.id === activeVariantId);

  // Compute price display
  const activePrice =
    activeVariant?.price != null ? Number(activeVariant.price) : null;

  // Content sections
  const sections = product.contentSections ?? [];
  const benefitsSection = getSection(sections, "BENEFITS");
  const highlightsSection = getSection(sections, "HIGHLIGHTS");
  const suitableSection = getSection(sections, "SUITABLE_FOR");
  const usageSection = getSection(sections, "USAGE_INSTRUCTION");
  const beforeAfterSection = getSection(sections, "BEFORE_AFTER");
  const faqSection = getSection(sections, "FAQ");
  const ingredientsSection = getSection(sections, "INGREDIENTS");

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
    if (!user) {
      toast.error("Please sign in to add items to your cart.");
      return;
    }
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

  return (
    <section className="bg-[#FAF3E2]">
      {/* ── TOP HEADER BANNER ── */}
      <div className="bg-[#EDE3D2] py-6 px-6 md:px-12 flex items-center justify-between">
        <h1 className="text-[28px] md:text-[34px] font-bold text-[#5E2B16] font-['Roboto',serif]">
          {product.categories?.[0]?.category?.name ?? product.name}
        </h1>
        <div className="w-[70px] h-[70px] md:w-[90px] md:h-[90px] bg-white rounded-full flex items-center justify-center shadow-md">
          <Image
            src="/img/thumb.png"
            alt="product"
            width={54}
            height={54}
            className="w-[60%] h-[60%] object-contain"
            loading="lazy"
          />
        </div>
      </div>

      {/* ── TOP: IMAGE + DETAILS ── */}
      <div className="px-6 md:px-12 py-10 grid grid-cols-2 gap-10 max-md:grid-cols-1">
        {/* LEFT — Images */}
        <div>
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

          {/* Thumbnails */}
          <div className="flex gap-4 mt-4 overflow-x-auto pb-2">
            {displayImages.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => setActiveImg(i)}
                className={`min-w-[70px] h-[70px] md:min-w-[90px] md:h-[90px] rounded-lg overflow-hidden cursor-pointer border transition shrink-0 ${
                  activeImg === i
                    ? "border-2 border-[#819744]"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={img}
                  alt={`thumb-${i}`}
                  width={100}
                  height={100}
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
              {(highlightsContent as any)?.rating ?? "4.8/5 Rating"}
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
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-[14px] text-[#5E2B16] leading-6 mb-6 max-w-[500px]"
          >
            {product.description ??
              "A thoughtfully crafted product by Pureastra."}
          </motion.p>

          {/* Variants / Size */}
          {product.variants.length > 0 && (
            <div className="mb-5 flex items-center gap-4 flex-wrap">
              <p className="font-['Roboto_Flex'] font-semibold text-[20px] text-[#819744]">
                Size :
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setActiveVariantId(v.id)}
                    className={`px-4 py-1.5 text-[12px] rounded-full shadow-sm transition ${
                      activeVariantId === v.id
                        ? "bg-[#819744] text-white font-semibold"
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
                <p className="text-[28px] font-bold text-[#5E2B16]">
                  ₹{activePrice}
                </p>
                <p className="text-sm text-[#8B5E3C]">
                  (MRP Inclusive of all taxes)
                </p>
              </div>
            </div>
          )}

          {/* Best Suited For */}
          {bestSuitedFor && (
            <p className="mb-6 text-[15px]">
              <span className="font-['Roboto_Flex'] font-semibold text-[20px] text-black">
                Best suited for:
              </span>{" "}
              <span className="font-['Roboto_Flex'] font-semibold text-[18px] text-[#535353]">
                {bestSuitedFor}
              </span>
            </p>
          )}

          {/* Qty + Cart + Buy Now */}
          <div className="flex items-center gap-4 mb-8 flex-wrap">
            <div className="flex border border-[#cfc7b8] h-[42px]">
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

            <button
              onClick={handleAddToCart}
              disabled={addCartItem.isPending}
              className="flex h-[42px] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span className="bg-[#E5EAD9] text-[#5E2B16] px-6 flex items-center font-semibold text-[14px] tracking-wide">
                {addCartItem.isPending ? "ADDING..." : "ADD TO CART"}
              </span>
              <span className="bg-[#819744] text-white px-4 flex items-center">
                <FontAwesomeIcon icon={faCartShopping} />
              </span>
            </button>

            <button className="bg-[#819744] text-white px-5 h-[42px] rounded-lg font-semibold flex items-center gap-2 hover:opacity-90 transition">
              <FontAwesomeIcon icon={faBolt} />
              Buy Now
            </button>
          </div>

          {/* Tabs */}
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

          <div className="text-sm text-gray-600 leading-6 space-y-3">
            {tab === "desc" ? (
              <p className="text-[14px] text-[#5E2B16] leading-6">
                {product.description ??
                  "No description available for this product."}
              </p>
            ) : (
              <p>No reviews yet</p>
            )}
          </div>
        </div>
      </div>

      {/* ── ADDITIONAL INFO: BENEFITS + INGREDIENTS ── */}
      <h2 className="text-center font-['Marko-One'] text-[42px] font-semibold text-[#819744] mb-12 font-serif">
        Additional Information
      </h2>
      <div className="bg-[#EBF1DC] py-10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 px-6 items-center">
          {/* LEFT: Benefits + Ingredients grid + Results */}
          <div>
            <h3 className="text-[#819744] font-['Roboto_Flex'] font-bold text-[24px] mb-6">
              {benefitsSection?.title ?? "BENEFITS:"}
            </h3>
            <BenefitsSection section={benefitsSection} />
            <IngredientsGridSection section={ingredientsSection} />
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
      <div className="bg-[#EBF1DC] py-10 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 mb-12">
          <SuitableForSection section={suitableSection} />
          <UsageInstructionSection section={usageSection} />
        </div>
        <BeforeAfterSection section={beforeAfterSection} />
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
                "/img/facewash.webp";
              const minPrice = item.variants.reduce(
                (min, v) =>
                  v.price != null && Number(v.price) < min
                    ? Number(v.price)
                    : min,
                Infinity,
              );
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
                      <h3 className="font-semibold text-[16px]">{item.name}</h3>
                      {item.description && (
                        <p className="text-[13px] opacity-90 mt-1 leading-5 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex justify-between items-center mt-3 text-[13px]">
                        <span>{item.variants[0]?.variantName ?? ""}</span>
                        <span className="font-semibold">
                          {minPrice !== Infinity ? `₹${minPrice}` : ""}
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

      {/* ── FAQ ── */}
      <div className="bg-[#F5F0E6] py-16 px-6">
        <h2 className="text-center text-[#819744] font-['Marko_One'] text-[34px] font-semibold mb-12">
          Frequently Asked Questions
        </h2>
        <FaqSection section={faqSection} />

        {/* Additional Info table */}
        <div className="max-w-4xl mx-auto mt-16 bg-white rounded-xl shadow-md p-6">
          <h3 className="text-[#819744] font-semibold text-[22px] mb-6">
            Additional Information
          </h3>
          <div className="grid grid-cols-2 gap-6 text-[14px] text-[#5E2B16]">
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
                <p>{product.brand ?? "PureAstra"}</p>
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
  );
}
