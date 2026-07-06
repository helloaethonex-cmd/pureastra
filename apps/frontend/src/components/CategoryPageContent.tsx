"use client";
import toast from "react-hot-toast";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faStar,
  faChevronDown,
  faChevronUp,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";
import { useCategories, useProducts } from "@/hooks/useProducts";
import { useAddCartItem } from "@/hooks/useCart";
import { useAuthStore } from "@/store/auth.store";
import {
  getProductReviewSummary,
  type Category,
  type ProductListResponse,
} from "@/services/api";
import { SkeletonGrid, SkeletonLine } from "@/components/ui/Skeleton";

interface CategoryPageContentProps {
  categoryName: string;
  categoryId?: string;
  categorySlug?: string; // alternative to categoryId — resolved at runtime via useCategories
  initialCategories?: Category[];
  initialProducts?: ProductListResponse;
}

export default function CategoryPageContent({
  categoryName: categoryNameProp,
  categoryId: categoryIdProp,
  categorySlug,
  initialCategories,
  initialProducts,
}: CategoryPageContentProps) {
  const [openProduct, setOpenProduct] = useState(true);
  const [openPrice, setOpenPrice] = useState(true);
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [search, setSearch] = useState("");
  const [ratingByProductId, setRatingByProductId] = useState<Record<string, number>>({});
  const { user } = useAuthStore();
  const addCartItem = useAddCartItem();

  const { data: categoriesData } = useCategories({
    initialData: initialCategories,
  });

  // Resolve categoryId from slug if not provided directly
  const resolvedCategory = categorySlug
    ? categoriesData?.find((c) => c.slug === categorySlug)
    : undefined;
  const categoryId = categoryIdProp ?? resolvedCategory?.id;
  const categoryName = resolvedCategory?.name ?? categoryNameProp;

  const { data, isLoading, isFetching, isError } = useProducts({
    categoryId,
    isActive: true,
    minPrice,
    maxPrice,
    search: search || undefined,
    limit: 50,
  }, {
    enabled: Boolean(categoryId) || !categorySlug,
    initialData: initialProducts,
    keepPreviousData: true,
  });

  const products = useMemo(() => data?.data ?? [], [data?.data]);
  const productIds = useMemo(
    () => products.map((product) => product.id),
    [products],
  );
  const productIdsKey = useMemo(
    () => productIds.join("|"),
    [productIds],
  );

  useEffect(() => {
    let cancelled = false;

    if (productIds.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears stale ratings when the visible product list becomes empty
      setRatingByProductId((prev) =>
        Object.keys(prev).length === 0 ? prev : {},
      );
      return;
    }

    const loadRatings = async () => {
      const entries = await Promise.all(
        productIds.map(async (productId) => {
          try {
            const summary = await getProductReviewSummary(productId);
            return [productId, Number(summary.avgRating ?? 0)] as const;
          } catch {
            return [productId, 0] as const;
          }
        }),
      );

      if (cancelled) return;

      setRatingByProductId(Object.fromEntries(entries));
    };

    loadRatings();

    return () => {
      cancelled = true;
    };
  }, [productIds, productIdsKey]);

  const handleAddToCart = (productVariantId?: string) => {
    if (!user) {
      toast.error("Please sign in to add items to your cart.");
      return;
    }

    if (!productVariantId) {
      toast.error("No purchasable variant available.");
      return;
    }

    addCartItem.mutate(
      { productVariantId, quantity: 1 },
      {
        onSuccess: () => toast.success("Item added to cart"),
        onError: (error) => {
          const message = error instanceof Error ? error.message : "Failed to add to cart";
          toast.error(message);
        },
      }
    );
  };

  return (
    <section className="bg-[#FAF3E2] min-h-screen px-6 md:px-12 py-10">
      {/* TITLE */}
      <h1 className="text-center text-[32px] font-bold font-['Roboto',serif] text-[#9E6E5B] mb-6">
        {categoryName}
      </h1>

      {/* SEARCH */}
      <div className="flex justify-center mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${categoryName}…`}
          className="w-full max-w-sm border border-gray-300 rounded-full px-5 py-2 text-sm focus:outline-none focus:border-[#819744]"
        />
      </div>

      {/* MAIN LAYOUT */}
      <div className="grid grid-cols-[250px_1fr] gap-8 max-lg:grid-cols-1">

        {/* SIDEBAR */}
        <div className="bg-white p-5 rounded-xl shadow-sm h-fit">

          {/* CATEGORIES */}
          <div>
            <div
              onClick={() => setOpenProduct(!openProduct)}
              className="flex justify-between items-center cursor-pointer"
            >
              <h3 className="text-sm font-semibold">CATEGORIES</h3>
              <FontAwesomeIcon
                icon={openProduct ? faChevronUp : faChevronDown}
                className="text-[#5E2B15] text-sm"
              />
            </div>
            {openProduct && (
              <ul className="mt-4 space-y-2 text-sm max-h-[180px] overflow-y-auto pr-2">
                {categoriesData?.map((cat: Category) => (
                  <li key={cat.id}>
                    <Link
                      href={`/category/${cat.slug}`}
                      className="hover:text-[#819744] transition block"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t my-5" />

          {/* PRICE */}
          <div>
            <div
              onClick={() => setOpenPrice(!openPrice)}
              className="flex justify-between items-center cursor-pointer"
            >
              <h3 className="text-sm font-semibold">PRICE</h3>
              <FontAwesomeIcon
                icon={openPrice ? faChevronUp : faChevronDown}
                className="text-[#5E2B15] text-sm"
              />
            </div>
            {openPrice && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min ₹"
                    value={minPrice ?? ""}
                    onChange={(e) =>
                      setMinPrice(e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#819744]"
                  />
                  <span className="text-gray-400 text-xs">–</span>
                  <input
                    type="number"
                    placeholder="Max ₹"
                    value={maxPrice ?? ""}
                    onChange={(e) =>
                      setMaxPrice(e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#819744]"
                  />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* PRODUCT GRID */}
        <div>
          {isLoading && products.length === 0 && (
            <SkeletonGrid
              count={6}
              className="grid grid-cols-3 gap-8 max-lg:grid-cols-2 max-sm:grid-cols-1"
              cardClassName="h-[280px] rounded-[16px]"
            />
          )}

          {isError && (
            <div className="text-center py-20 text-[#5E2B16]">
              Failed to load products. Please try again.
            </div>
          )}

          {!isLoading && !isError && products.length === 0 && (
            <div className="text-center py-24 text-gray-400">
              <FontAwesomeIcon icon={faFilter} className="text-4xl mb-4" />
              <p>No products found in this category yet.</p>
            </div>
          )}

          {products.length > 0 && (
            <>
              {isFetching ? (
                <div className="mb-3 flex items-center justify-end gap-2">
                  <SkeletonLine className="h-3 w-3 rounded-full" />
                  <p className="text-xs text-[#7B6A58]">Updating products...</p>
                </div>
              ) : null}
              <div className="grid grid-cols-3 gap-8 max-lg:grid-cols-2 max-sm:grid-cols-1">
              {products.map((product) => {
                const primaryImage = product.images.find((img) => img.position === 0) ?? product.images[0];
                const minVariant = product.variants.reduce(
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
                const minVariantPrice = minVariant?.price ?? 0;
                const minVariantMrp = minVariant?.mrp ?? 0;
                const hasDiscount =
                  minVariantMrp > minVariantPrice && minVariantPrice > 0;
                const displayRating = ratingByProductId[product.id] ?? 0;

                return (
                  <div
                    key={product.id}
                    className="relative rounded-[16px] overflow-hidden group bg-[#D9D9D9]"
                  >
                    {/* IMAGE */}
                    <Link href={`/product/${product.slug}`}>
                      {primaryImage ? (
                        <div className="relative w-full h-[260px]">
                          <Image
                            src={primaryImage.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-[260px] bg-[#EDE6D8] flex items-center justify-center text-gray-400 text-sm">
                          No image
                        </div>
                      )}
                    </Link>

                    {/* OVERLAY */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/15 backdrop-blur-md p-4 text-white rounded-b-[16px] transition-all duration-300 group-hover:bg-black/25">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-sm">{product.name}</h3>
                        <div className="flex items-center gap-1 text-xs text-[#F59E0B]">
                          <FontAwesomeIcon icon={faStar} />
                          <span>{displayRating > 0 ? displayRating.toFixed(1) : "New"}</span>
                        </div>
                      </div>
                      {product.description && (
                        <p className="text-xs mt-1 opacity-90 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <div className="flex justify-between text-xs mt-2">
                        <span>{product.brand ?? ""}</span>
                        <span className="flex items-center gap-2">
                          {hasDiscount && (
                            <span className="text-[11px] text-white/70 line-through">
                              ₹{minVariantMrp}
                            </span>
                          )}
                          <span>
                            {minVariantPrice > 0 ? `₹ ${minVariantPrice}` : "—"}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* CART BUTTON */}
                    <button
                      onClick={() => handleAddToCart(product.variants[0]?.id)}
                      disabled={addCartItem.isPending}
                      className="absolute top-3 right-3 bg-white/90 rounded-full w-9 h-9 flex items-center justify-center shadow-sm hover:scale-110 active:scale-90 transition disabled:opacity-70"
                    >
                      <FontAwesomeIcon icon={faCartShopping} className="text-[#819744]" />
                    </button>
                  </div>
                );
              })}
              </div>
            </>
          )}
        </div>

      </div>
    </section>
  );
}
