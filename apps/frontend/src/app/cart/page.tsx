"use client";

import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faPlus, faMinus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useAuthStore } from "@/store/auth.store";
import { useCart, useClearCart, useRemoveCartItem, useUpdateCartItem } from "@/hooks/useCart";
import { useCheckout } from "@/hooks/useCheckout";
import { useRouter } from "next/navigation";

const toPriceNumber = (value: number | string | null | undefined) => {
  const parsed = typeof value === "string" ? Number.parseFloat(value) : value;
  return Number.isFinite(parsed) ? Number(parsed) : 0;
};


export default function OrderPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const isAuthenticated = Boolean(user);

  const { data: cart, isLoading: cartLoading, isError, error } = useCart(isAuthenticated);
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const clearCart = useClearCart();
  const checkout = useCheckout();

  const increase = (itemId: string, quantity: number) => {
    updateItem.mutate({ itemId, quantity: quantity + 1 });
  };

  const decrease = (itemId: string, quantity: number) => {
    if (quantity <= 1) {
      removeItem.mutate(itemId);
      return;
    }
    updateItem.mutate({ itemId, quantity: quantity - 1 });
  };

  const items = cart?.items ?? [];

  const subtotal = items.reduce((acc, item) => {
    const unitPrice = toPriceNumber(item.priceSnapshot ?? item.productVariant.price);
    return acc + unitPrice * item.quantity;
  }, 0);
  const discount = 0.03 * subtotal;
  const total = subtotal - discount;

  return (
    <div className="bg-[#F5F0E6] min-h-screen py-16 px-6">

      <div className="max-w-5xl mx-auto">

        {/* HEADER */}    
        <Link href="/">
          <div className="flex items-center gap-3 text-[#5E2B16] font-['Roboto',serif] mb-6 cursor-pointer">
            <FontAwesomeIcon icon={faArrowLeftLong} className="text-[22px]" />
            <h1 className="text-[32px] font-semibold">Cart</h1>
          </div>
        </Link>

        {/* LINE BELOW CART HEADING */}
        <div className="mb-6 border-t border-[#D6C9B6]" />


        {authLoading || (isAuthenticated && cartLoading) ? (
          <div className="py-20 text-center text-[#5E2B15]">Loading cart...</div>
        ) : !isAuthenticated ? (
          <div className="text-center py-20">
            <h2 className="text-xl text-[#5E2B15] mb-4">
              Please sign in to view and manage your cart.
            </h2>
            <Link
              href="/"
              className="inline-flex bg-[#819744] text-white px-6 py-2 rounded-md"
            >
              Continue Shopping
            </Link>
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

            <Link href="/" className="inline-flex bg-[#819744] text-white px-6 py-2 rounded-md">
              Shop Now
            </Link>
          </div>
        ) : (

          <>
            {/* ================= PRODUCTS ================= */}
            <div className="space-y-8">

              {items.map((item) => {
                const product = item.productVariant.product;
                const itemImage = item.productVariant.images?.[0]?.imageUrl || "/img/facewash.webp";
                const itemName = product?.name || "Product";
                const itemPrice = toPriceNumber(item.priceSnapshot ?? item.productVariant.price);

                return (
                <div key={item.id} className="flex gap-6 border-b pb-6">

                  {/* IMAGE */}
                  <Image
                    src={itemImage}
                    alt={itemName}
                    width={120}
                    height={120}
                    className="rounded-md"
                  />

                  {/* DETAILS */}
                  <div className="flex-1">

                    <h2 className="text-lg font-semibold text-[#5E2B15]">
                      {itemName}
                    </h2>

                    <p className="text-sm text-[#7B6A58]">
                      Variant: <span className="text-[#819744]">{item.productVariant.variantName || "Default"}</span>
                    </p>

                    <p className="text-sm text-[#7B6A58]">
                      Product: <span className="text-[#819744]">{product.slug}</span>
                    </p>

                    {/* QTY */}
                    <div className="flex items-center gap-4 mt-3">

                      {/* DECREASE */}
                      <button 
                        onClick={() => decrease(item.id, item.quantity)}
                        disabled={updateItem.isPending || removeItem.isPending}
                        className="w-8 h-8 border flex items-center justify-center rounded"
                      >
                        <FontAwesomeIcon icon={faMinus} />
                      </button>

                      {/* QTY */}
                      <span className="text-[16px] font-medium">{item.quantity}</span>

                      {/* INCREASE */}
                      <button
                        onClick={() => increase(item.id, item.quantity)}
                        disabled={updateItem.isPending || removeItem.isPending}
                        className="w-8 h-8 border flex items-center justify-center rounded"
                      >
                        <FontAwesomeIcon icon={faPlus} />
                      </button>

                      {/* DELETE ICON */}
                      <button
                        onClick={() => removeItem.mutate(item.id)}
                        disabled={removeItem.isPending}
                        className="ml-4 text-white bg-[#5E2B15] text-sm px-3 py-1 hover:text-red-500 transition"
                      >
                        Remove <FontAwesomeIcon icon={faTrash} />
                      </button>

                    </div>

                  </div>

                  {/* PRICE */}
                  <div className="text-right">
                    <p className="font-semibold">₹{itemPrice.toFixed(2)}</p>
                  </div>

                </div>
              )})}

            </div>

            {/* ================= SUMMARY ================= */}
            <div className="mt-10 space-y-2 text-[#5E2B15]">

              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span>Delivery cost</span>
                <span>FREE</span>
              </div>

              <div className="flex justify-between">
                <span>Discount</span>
                <span>3%</span>
              </div>

              <div className="flex justify-between font-semibold text-lg">
                <span>Total to pay</span>
                <span>₹{total.toFixed(2)}</span>
              </div>

            </div>

            {/* SAVINGS BOX */}
            <div className="bg-[#DCE9D8] text-[#2E7D32] px-6 py-4 rounded-xl my-2 font-medium">
              You will save ₹{(subtotal * 0.03).toFixed(0)} on this order
            </div>

            <button
              onClick={() => clearCart.mutate()}
              disabled={clearCart.isPending}
              className="w-full mt-2 border border-[#5E2B15] text-[#5E2B15] py-2 font-medium hover:bg-[#efe2cf] transition"
            >
              {clearCart.isPending ? "Clearing..." : "Clear Cart"}
            </button>

            {/* ================= SUMMARY ================= */}
            <div className="mt-10 space-y-2 text-[#5E2B15]"></div>
            {/* CHECKOUT */}
            <div className="mt-6">
              <button
                onClick={() =>
                  checkout.mutate(undefined, {
                    onSuccess: ({ orderNumber }) => {
                      router.push(`/order-history?order=${encodeURIComponent(orderNumber)}`);
                    },
                  })
                }
                disabled={checkout.isPending}
                className="block w-full bg-[#819744] text-center text-white py-3 font-semibold hover:bg-[#6f873a] transition disabled:opacity-70"
              >
                {checkout.isPending ? "Processing payment..." : "Proceed to checkout"}
              </button>
              {checkout.isError ? (
                <p className="mt-3 text-sm text-red-600 text-center">
                  {(checkout.error as Error)?.message ?? "Checkout failed"}
                </p>
              ) : null}
            </div>
            
          </>
        )}

      </div>
    </div>
  );
}
