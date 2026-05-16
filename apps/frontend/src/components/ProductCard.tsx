"use client";
import toast from "react-hot-toast";

import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping, faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import { useAddCartItem } from "@/hooks/useCart";
import {
  useAddWishlistItem,
  useRemoveWishlistItem,
  useWishlist,
} from "@/hooks/useWishlist";
import { useAuthStore } from "@/store/auth.store";
import type { Product } from "@/services/api";
import { useRouter } from "next/navigation";

type ProductCardProps = {
  active?: boolean;
  product: Product;
};

const toNumber = (value: number | string | null | undefined) => {
  const parsed = typeof value === "string" ? Number.parseFloat(value) : value;
  return Number.isFinite(parsed) ? Number(parsed) : 0;
};

export default function ProductCard({ active, product }: ProductCardProps) {
  const { user } = useAuthStore();
  const addCartItem = useAddCartItem();
  const addWishlistItem = useAddWishlistItem();
  const removeWishlistItem = useRemoveWishlistItem();
  const { data: wishlistItems } = useWishlist(Boolean(user));
  const router = useRouter();

  const hoverTags = [
    product.brand ? `Brand: ${product.brand}` : "Pureastra",
    product.variants.length > 0
      ? `${product.variants.length} size options`
      : "Default size",
    "Made Safe Certified",
    "Dermatologically Tested",
  ];

  const primaryImage =
    product.images.find((img) => img.position === 0)?.imageUrl ||
    product.images[0]?.imageUrl ||
    "/img/facewash.webp";

  const activeVariant = product.variants[0];
  const cheapestVariant = product.variants.reduce<
    { price: number; mrp: number } | null
  >((best, variant) => {
    const variantPrice = toNumber(variant.price);
    if (variantPrice <= 0) return best;
    if (!best || variantPrice < best.price) {
      return { price: variantPrice, mrp: toNumber(variant.mrp) };
    }
    return best;
  }, null);

  const displayPrice = cheapestVariant?.price ?? 0;
  const displayMrp = cheapestVariant?.mrp ?? 0;
  const hasDiscount = displayMrp > displayPrice && displayPrice > 0;
  const isWishlisted = Boolean(
    activeVariant?.id &&
      wishlistItems?.some((item) => item.productVariantId === activeVariant.id),
  );

  const handleAddToCart = () => {
    if (!user) {
      toast.error("Please sign in to add items to your cart.");
      return;
    }

    if (!activeVariant?.id) {
      toast.error("No purchasable variant available.");
      return;
    }

    addCartItem.mutate(
      { productVariantId: activeVariant.id, quantity: 1 },
      {
        onSuccess: () => toast.success("Added to cart!"),
        onError: (error) => {
          const message =
            error instanceof Error ? error.message : "Failed to add to cart";
          toast.error(message);
        },
      },
    );
  };

  const handleAddToWishlist = () => {
    if (!user) {
      toast.error("Please sign in to add items to your wishlist.");
      return;
    }

    if (!activeVariant?.id) {
      toast.error("No wishlist-eligible variant available.");
      return;
    }

    if (isWishlisted) {
      removeWishlistItem.mutate(activeVariant.id, {
        onSuccess: () => toast.success("Removed from wishlist"),
        onError: (error) => {
          const message =
            error instanceof Error ? error.message : "Failed to update wishlist";
          toast.error(message);
        },
      });
      return;
    }

    addWishlistItem.mutate(
      { productVariantId: activeVariant.id },
      {
        onSuccess: () => toast.success("Added to wishlist!"),
        onError: (error) => {
          const message =
            error instanceof Error ? error.message : "Failed to add to wishlist";
          toast.error(message);
        },
      },
    );
  };

  return (
    <div className="group relative h-105 w-full scale-[0.85] overflow-hidden rounded-[25px] bg-[#D9D9D9] opacity-90 transition-all duration-400 ease-in-out before:pointer-events-none before:absolute before:bottom-0 before:z-1 before:h-30 before:w-full before:bg-linear-to-t before:from-black/25 before:to-transparent in-[.swiper-slide-active_&]:z-2 in-[.swiper-slide-active_&]:scale-100 in-[.swiper-slide-active_&]:opacity-100 in-[.swiper-slide-next_&]:scale-90 in-[.swiper-slide-next_&]:opacity-[0.85] in-[.swiper-slide-prev_&]:scale-90 in-[.swiper-slide-prev_&]:opacity-[0.85]">
      {/* Image */}
      <Link href={`/product/${product.slug}`} prefetch={false}>
        <div className="relative w-full h-full">
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 90vw, (max-width: 1200px) 40vw, 25vw"
          />
        </div>
      </Link>

      {/* ACTION BUTTONS */}
      <div className="absolute top-3.75 right-3.75 z-5 flex items-center gap-2">
        <button
          onClick={handleAddToCart}
          disabled={addCartItem.isPending}
          className="w-10 h-10 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center disabled:opacity-70"
          title="Add to cart"
        >
          <FontAwesomeIcon
            icon={faCartShopping}
            className="text-base text-white"
          />
        </button>

        <button
          onClick={handleAddToWishlist}
          disabled={addWishlistItem.isPending || removeWishlistItem.isPending}
          className="w-10 h-10 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center disabled:opacity-70"
          title="Add to wishlist"
        >
          <FontAwesomeIcon
            icon={isWishlisted ? faHeartSolid : faHeartRegular}
            className={`text-base ${isWishlisted ? "text-red-500" : "text-white"}`}
          />
        </button>
      </div>

      {/* NORMAL DETAILS */}
      <div
        className={`absolute bottom-0 z-3 flex w-full flex-col justify-end border-t border-white/15 bg-black/15 px-4.5 py-4 text-white backdrop-blur-md transition-opacity duration-300 group-hover:opacity-0 ${
          active ? "show" : ""
        }`}
      >
        <h5 className="text-[18px] font-semibold mb-1 font-['Roboto_Serif',serif] text-left">
          {product.name}
        </h5>

        <div className="flex justify-between">
          <span>{activeVariant?.variantName ?? "Default"}</span>
          <span className="flex items-center gap-2">
            {hasDiscount && (
              <span className="text-[12px] text-white/70 line-through">
                ₹{displayMrp.toFixed(2)}
              </span>
            )}
            <span>{displayPrice > 0 ? `₹${displayPrice.toFixed(2)}` : "-"}</span>
          </span>
        </div>
      </div>

      <div
        className="absolute bottom-0 flex h-0 w-full flex-col items-start justify-center overflow-hidden bg-linear-to-t from-black/65 to-black/20 p-7.5 text-[#D9D9D9] backdrop-blur-[10px] transition-[height] duration-400 ease-in-out group-hover:h-full cursor-pointer"
        onClick={() => router.push(`/product/${product.slug}`)}
      >
        <h4 className="mb-4.5 translate-y-5 text-left text-[26px] font-semibold opacity-0 transition duration-400 ease-in-out group-hover:translate-y-0 group-hover:opacity-100">
          {product.name}
        </h4>

        <div className="flex w-full flex-col items-start gap-3 opacity-0 translate-y-5 transition duration-400 ease-in-out group-hover:translate-y-0 group-hover:opacity-100">
          {hoverTags.map((tag, idx) => (
            <span
              key={tag}
              className="translate-y-5 rounded-[20px] bg-white/25 px-4 py-2 text-[14px] opacity-0 transition duration-400 ease-in-out group-hover:translate-y-0 group-hover:opacity-100"
              style={{ transitionDelay: `${(idx + 1) * 0.15}s` }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
