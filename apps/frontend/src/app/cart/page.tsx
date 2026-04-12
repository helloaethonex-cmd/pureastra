"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeftLong,
  faPlus,
  faMinus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { useAuthStore } from "@/store/auth.store";
import {
  useCart,
  useClearCart,
  useRemoveCartItem,
  useUpdateCartItem,
} from "@/hooks/useCart";
import { useRouter } from "next/navigation";
import AuthModal from "@/components/AuthModal";

const toPriceNumber = (value: number | string | null | undefined) => {
  const parsed = typeof value === "string" ? Number.parseFloat(value) : value;
  return Number.isFinite(parsed) ? Number(parsed) : 0;
};

const SHIPPING_CHARGE = 49;

// ── Main cart page ─────────────────────────────────────────────────────────────
export default function OrderPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const isAuthenticated = Boolean(user);

  const { data: cart, isLoading: cartLoading, isError, error } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const clearCart = useClearCart();

  const [showCheckout] = useState(false);
  void showCheckout; // kept for future use - checkout is now a page
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [resumeCheckoutAfterLogin, setResumeCheckoutAfterLogin] =
    useState(false);
  const [isRemovingUnavailable, setIsRemovingUnavailable] = useState(false);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (isAuthenticated && resumeCheckoutAfterLogin) {
      setResumeCheckoutAfterLogin(false);
      router.push("/checkout");
    }
  }, [isAuthenticated, resumeCheckoutAfterLogin, router]);

  const increase = (itemId: string, quantity: number) => {
    const item = items.find((cartItem) => cartItem.id === itemId);
    const availableStock = Math.max(
      Number(item?.productVariant.availableStock ?? 0),
      0,
    );
    if (availableStock > 0 && quantity >= availableStock) {
      return;
    }
    updateItem.mutate({ itemId, quantity: quantity + 1 });
  };

  const decrease = (itemId: string, quantity: number) => {
    if (quantity <= 1) {
      removeItem.mutate(itemId);
      return;
    }
    updateItem.mutate({ itemId, quantity: quantity - 1 });
  };

  const handleRemove = (itemId: string) => {
    removeItem.mutate(itemId);
  };

  const handleClearCart = () => {
    clearCart.mutate();
  };

  const items = useMemo(() => cart?.items ?? [], [cart?.items]);
  const problematicItemIds = useMemo(
    () =>
      items
        .filter((item) => {
          const availableStock = Math.max(
            Number(item.productVariant.availableStock ?? 0),
            0,
          );
          return availableStock <= 0 || item.quantity > availableStock;
        })
        .map((item) => item.id),
    [items],
  );
  const unavailableItems = useMemo(
    () =>
      items.filter(
        (item) => Number(item.productVariant.availableStock ?? 0) <= 0,
      ),
    [items],
  );
  const hasStockIssue = problematicItemIds.length > 0;

  const subtotal = items.reduce((acc, item) => {
    const unitPrice = toPriceNumber(
      item.priceSnapshot ?? item.productVariant.price,
    );
    return acc + unitPrice * item.quantity;
  }, 0);
  const estimatedTotal = subtotal + SHIPPING_CHARGE;
  const reviewProblemItems = () => {
    const firstProblemItemId = problematicItemIds[0];
    if (!firstProblemItemId) return;
    itemRefs.current[firstProblemItemId]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const removeUnavailableItems = async () => {
    if (unavailableItems.length === 0 || isRemovingUnavailable) return;
    setIsRemovingUnavailable(true);
    try {
      await Promise.all(
        unavailableItems.map((item) => removeItem.mutateAsync(item.id)),
      );
    } finally {
      setIsRemovingUnavailable(false);
    }
  };

  return (
    <>
      <div className="bg-[#F5F0E6] min-h-screen py-16 px-6">
        <div className="max-w-5xl mx-auto">
          {/* HEADER */}
          <Link href="/">
            <div className="flex items-center gap-3 text-[#5E2B16] font-['Roboto',serif] mb-6 cursor-pointer">
              <FontAwesomeIcon icon={faArrowLeftLong} className="text-[22px]" />
              <h1 className="text-[32px] font-semibold">Cart</h1>
            </div>
          </Link>

          <div className="mb-6 border-t border-[#D6C9B6]" />

          {authLoading || cartLoading ? (
            <div className="py-20 text-center text-[#5E2B15]">
              Loading cart...
            </div>
          ) : isError ? (
            <div className="text-center py-20 text-red-600">
              {(error as Error)?.message ?? "Failed to load cart"}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <h2 className="text-xl text-[#5E2B15] mb-4">
                Oops... Looks like you forgot to add your favourites!
              </h2>
              <Link
                href="/"
                className="inline-flex bg-[#819744] text-white px-6 py-2 rounded-md"
              >
                Shop Now
              </Link>
            </div>
          ) : (
            <>
              {/* ================= PRODUCTS ================= */}
              <div className="space-y-8">
                {items.map((item) => {
                  const product = item.productVariant.product;
                  const itemImage =
                    item.productVariant.images?.[0]?.imageUrl ||
                    product?.images?.[0]?.imageUrl ||
                    "/img/facewash.webp";
                  const itemName = product?.name || "Product";
                  const itemPrice = toPriceNumber(
                    item.priceSnapshot ?? item.productVariant.price,
                  );
                  const availableStock = Math.max(
                    Number(item.productVariant.availableStock ?? 0),
                    0,
                  );
                  const isOverStock =
                    availableStock > 0 && item.quantity > availableStock;
                  const isOutOfStock = availableStock <= 0;
                  const isLowStock = Boolean(item.productVariant.isLowStock);
                  const isProblemItem = isOutOfStock || isOverStock;

                  return (
                    <div
                      key={item.id}
                      ref={(node) => {
                        itemRefs.current[item.id] = node;
                      }}
                      className={`flex gap-6 rounded-lg border-b pb-6 transition ${
                        isProblemItem
                          ? "border border-red-200 bg-red-50/70 px-4 py-3"
                          : ""
                      }`}
                    >
                      {/* IMAGE */}
                      <Image
                        src={itemImage}
                        alt={itemName}
                        width={120}
                        height={120}
                        className="rounded-md object-cover"
                      />

                      {/* DETAILS */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-semibold text-[#5E2B15]">
                            {itemName}
                          </h2>
                          <p className="font-semibold">
                            ₹{itemPrice.toFixed(2)}
                          </p>
                        </div>
                        <p className="text-sm text-[#7B6A58]">
                          Variant:{" "}
                          <span className="text-[#819744]">
                            {item.productVariant.variantName || "Default"}
                          </span>
                        </p>
                        {isProblemItem && (
                          <p className="mt-1 inline-flex rounded bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                            Needs attention
                          </p>
                        )}
                        <p
                          className={`mt-1 text-xs font-semibold ${
                            isOutOfStock || isOverStock
                              ? "text-red-600"
                              : isLowStock
                                ? "text-[#b35c1e]"
                                : "text-[#819744]"
                          }`}
                        >
                          {isOutOfStock
                            ? "Out of stock"
                            : isOverStock
                              ? `Only ${availableStock} available. Reduce quantity.`
                              : isLowStock
                                ? `Only ${availableStock} available`
                                : "In stock"}
                        </p>

                        {/* QTY */}
                        <div className=" flex items-end justify-between">
                          <div className="flex items-center gap-4 mt-3">
                            <button
                              onClick={() => decrease(item.id, item.quantity)}
                              disabled={
                                updateItem.isPending || removeItem.isPending
                              }
                              className="w-8 h-8 border flex items-center justify-center rounded"
                            >
                              <FontAwesomeIcon icon={faMinus} />
                            </button>
                            <span className="text-[16px] font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => increase(item.id, item.quantity)}
                              disabled={
                                updateItem.isPending ||
                                removeItem.isPending ||
                                isOutOfStock ||
                                item.quantity >= availableStock
                              }
                              className="w-8 h-8 border flex items-center justify-center rounded"
                            >
                              <FontAwesomeIcon icon={faPlus} />
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemove(item.id)}
                            disabled={removeItem.isPending}
                            className="ml-4 text-white bg-[#5E2B15] text-sm px-3 py-1 hover:text-red-300 transition"
                          >
                            Remove <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ================= SUMMARY ================= */}
              <div className="mt-10 space-y-2 text-[#5E2B15]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery cost</span>
                  <span className="text-[#5E2B15] font-medium">
                    ₹{SHIPPING_CHARGE.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-[#9a7a65]">
                  Final prices, taxes & discounts will be confirmed at checkout.
                </p>
                <div className="flex justify-between font-semibold text-lg border-t border-[#D6C9B6] pt-2">
                  <span>Estimated Total</span>
                  <span>₹{estimatedTotal.toFixed(2)}</span>
                </div>
              </div>

              {hasStockIssue && (
                <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <p className="font-semibold">Some items need attention</p>
                  <p className="mt-0.5 text-xs text-red-600">
                    {problematicItemIds.length} item
                    {problematicItemIds.length > 1 ? "s" : ""} need updates
                    before checkout.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={reviewProblemItems}
                      className="rounded border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      Review Items
                    </button>
                    <button
                      type="button"
                      onClick={removeUnavailableItems}
                      disabled={
                        unavailableItems.length === 0 ||
                        isRemovingUnavailable ||
                        removeItem.isPending
                      }
                      className="rounded border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isRemovingUnavailable
                        ? "Removing..."
                        : "Remove unavailable items"}
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleClearCart}
                disabled={clearCart.isPending}
                className="w-full mt-4 border border-[#5E2B15] text-[#5E2B15] py-2 font-medium hover:bg-[#efe2cf] transition"
              >
                {clearCart.isPending ? "Clearing..." : "Clear Cart"}
              </button>

              {/* CHECKOUT BUTTON */}
              <div className="mt-4">
                <button
                  id="proceed-to-checkout-btn"
                  onClick={() => {
                    if (hasStockIssue) return;
                    if (!isAuthenticated) {
                      setResumeCheckoutAfterLogin(true);
                      setIsAuthModalOpen(true);
                      return;
                    }
                    router.push("/checkout");
                  }}
                  disabled={hasStockIssue}
                  className={`block w-full text-center py-3 font-semibold transition ${
                    hasStockIssue
                      ? "cursor-not-allowed bg-gray-300 text-gray-600"
                      : "bg-[#819744] text-white hover:bg-[#6f873a]"
                  }`}
                >
                  {hasStockIssue
                    ? "Resolve stock issues to checkout"
                    : "Proceed to Checkout"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease;
        }
      `}</style>

      <AuthModal
        open={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
