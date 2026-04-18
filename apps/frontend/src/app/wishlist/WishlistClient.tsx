"use client";

import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";
import {
  useWishlist,
  useRemoveWishlistItem,
  useMoveWishlistItemToCart,
} from "@/hooks/useWishlist";
import { useAuthStore } from "@/store/auth.store";
import { SkeletonGrid, SkeletonLine } from "@/components/ui/Skeleton";
import { useRequireClientSession } from "@/hooks/useRequireClientSession";

export default function WishlistPage() {
  useRequireClientSession();
  const { user, isLoading: authLoading } = useAuthStore();
  const { data: wishlist, isLoading, isError, error } = useWishlist(Boolean(user));
  const removeWishlistItem = useRemoveWishlistItem();
  const moveWishlistItemToCart = useMoveWishlistItemToCart();

  const items = wishlist ?? [];

  const removeItem = (productVariantId: string) => {
    removeWishlistItem.mutate(productVariantId);
  };

  const moveToCart = (productVariantId: string) => {
    moveWishlistItemToCart.mutate(productVariantId);
  };

  const toNumber = (value: number | string | null | undefined) => {
    const parsed = typeof value === "string" ? Number.parseFloat(value) : value;
    return Number.isFinite(parsed) ? Number(parsed) : 0;
  };

  return (
    <div className="bg-[#F5F0E6] min-h-screen py-10 px-4 md:px-6">

      <div className="max-w-6xl mx-auto">

        {/* TITLE */}
        <h1 className="text-center text-[#7A5C45] text-[26px] md:text-[32px] font-semibold mb-8 font-['Marko_One']">
          Wishlist
        </h1>

        {authLoading || (user && isLoading) ? (
          <div className="py-8">
            <SkeletonGrid
              count={6}
              className="grid grid-cols-1 gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3"
              cardClassName="h-[340px] rounded-2xl"
            />
            <div className="mx-auto mt-6 max-w-sm">
              <SkeletonLine className="h-4 w-full" />
            </div>
          </div>
        ) : !user ? (
          <div className="text-center py-20">
            <h2 className="text-[#5E2B15] mb-4">Please sign in to view your wishlist.</h2>
            <Link
              href="/"
              className="inline-flex bg-[#819744] text-white px-6 py-2 rounded-md"
            >
              Continue Shopping
            </Link>
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-red-600">
            {(error as Error)?.message ?? "Failed to load wishlist"}
          </div>
        ) : (
          <>
            {/* GRID RESPONSIVE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">

              {items.map((item) => {
                // Cover image: prefer product-level images (sorted by position in API),
                // fall back to variant-level images, then placeholder.
                const image =
                  (item.productVariant.product as any).images?.[0]?.imageUrl ||
                  item.productVariant.images?.[0]?.imageUrl ||
                  "/img/facewash.webp";
                const price = toNumber(item.productVariant.price);
                const name = item.productVariant.product.name;
                const slug = item.productVariant.product.slug;
                return (
                <div
                  key={item.id}
                  className={`relative rounded-2xl overflow-hidden backdrop-blur-md ${item.isAvailable ? "bg-white/20" : "bg-gray-300/20"} border border-white/30 shadow-lg hover:scale-[1.02] transition duration-300`}
                >

                  {/* IMAGE */}
                  <Image
                    src={image}
                    alt={name}
                    width={400}
                    height={400}
                    className="w-full h-[220px] md:h-[260px] object-cover"
                  />

                  {/* ❤️ HEART */}
                  <div
                    onClick={() => removeItem(item.productVariantId)}
                    className="absolute top-3 right-3 w-9 h-9 bg-white/60 backdrop-blur-md rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition"
                  >
                    <FontAwesomeIcon icon={faHeart} className="text-red-500" />
                  </div>

                  {/* GLASS OVERLAY */}
                  <div className="absolute bottom-0 left-0 w-full bg-black/40 backdrop-blur-md text-white p-4">

                    {/* NAME */}
                    <div className="flex justify-between items-center gap-3">
                      <h2 className="font-semibold text-[15px] md:text-[16px]">
                        {name}
                      </h2>
                    </div>

                    <p className="text-xs md:text-sm opacity-90 mt-1">
                      {item.productVariant.variantName ?? item.productVariant.sku ?? "Default variant"}
                    </p>

                    {/* PRICE */}
                    <div className={`flex justify-between mt-2 ${item.isAvailable ? "text-white" : "text-red-500"} text-sm`}>
                      <span>{item.isAvailable ? "Available" : "Out of Stock"}</span>
                      <span className="font-medium">{price > 0 ? `₹${price.toFixed(2)}` : "-"}</span>
                    </div>

                    {slug && (
                      <Link
                        href={`/product/${slug}`}
                        className="inline-block mt-3 text-xs underline"
                      >
                        View product
                      </Link>
                    )}

                    <button
                      onClick={() => moveToCart(item.productVariantId)}
                      disabled={!item.isAvailable || moveWishlistItemToCart.isPending}
                      className="mt-3 block text-xs px-3 py-1.5 rounded-full bg-[#819744] text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {moveWishlistItemToCart.isPending
                        ? "Moving..."
                        : "Move to cart"}
                    </button>
                  </div>

                </div>
              );})}

            </div>

            {/* EMPTY STATE */}
            {items.length === 0 && (
              <div className="text-center py-20">
                <h2 className="text-[#5E2B15] mb-4">
                  Your wishlist is empty.
                </h2>
                <Link
                  href="/"
                  className="inline-flex bg-[#819744] text-white px-6 py-2 rounded-md"
                >
                  Explore Products
                </Link>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
