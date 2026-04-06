"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeftLong,
  faPlus,
  faMinus,
  faTrash,
  faMapMarkerAlt,
  faCheckCircle,
  faPlusCircle,
  faChevronRight,
  faSpinner,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { useAuthStore } from "@/store/auth.store";
import { useCart, useClearCart, useRemoveCartItem, useUpdateCartItem } from "@/hooks/useCart";
import { useCheckout, useMyAddresses } from "@/hooks/useCheckout";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAddress, previewCheckout, type Address, type CheckoutPreviewResponse } from "@/services/api";

const toPriceNumber = (value: number | string | null | undefined) => {
  const parsed = typeof value === "string" ? Number.parseFloat(value) : value;
  return Number.isFinite(parsed) ? Number(parsed) : 0;
};

// ── Checkout step types ───────────────────────────────────────────────────────
type CheckoutStep = "address" | "preview" | "paying";

// ── Small inline address form ─────────────────────────────────────────────────
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

function AddressForm({
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
    <div className="mt-4 bg-[#F5F0E6] border border-[#D6C9B6] rounded-xl p-4 animate-fade-in">
      <p className="text-sm font-semibold text-[#5E2B15] mb-3">Add new address</p>
      <div className="grid grid-cols-2 gap-3">
        {field("fullName", "Full Name")}
        {field("phone", "Phone", "tel")}
        {field("line1", "Address Line 1")}
        {field("line2", "Address Line 2 (optional)")}
        {field("city", "City", "text", true)}
        {field("state", "State", "text", true)}
        {field("postalCode", "Postal Code", "text", true)}
        {field("country", "Country", "text", true)}
        <div className="col-span-2 flex items-center gap-2">
          <input
            id="isDefault"
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
            className="accent-[#819744]"
          />
          <label htmlFor="isDefault" className="text-xs text-[#7B6A58]">
            Set as default address
          </label>
        </div>
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
          {save.isPending ? (
            <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
          ) : null}
          Save Address
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

// ── Address selector step ─────────────────────────────────────────────────────
function AddressStep({
  selectedId,
  onSelect,
  onNext,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNext: () => void;
}) {
  const { user } = useAuthStore();
  const { data: addresses, isLoading } = useMyAddresses(Boolean(user));
  const [showForm, setShowForm] = useState(false);

  const handleSaved = (addr: Address) => {
    onSelect(addr.id);
    setShowForm(false);
  };

  return (
    <div>
      <h3 className="text-lg font-bold text-[#5E2B15] mb-4 flex items-center gap-2">
        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[#819744]" />
        Choose Delivery Address
      </h3>

      {isLoading ? (
        <div className="py-6 text-center text-[#7B6A58] text-sm">
          <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
          Loading addresses...
        </div>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {(addresses ?? []).map((addr) => (
            <button
              key={addr.id}
              onClick={() => onSelect(addr.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                selectedId === addr.id
                  ? "border-[#819744] bg-[#f0f6e8]"
                  : "border-[#D6C9B6] bg-white/60 hover:border-[#9ab964] hover:bg-[#f7faef]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-semibold text-[#3d2b1a] text-sm">{addr.fullName}</p>
                  <p className="text-xs text-[#7B6A58] mt-0.5">{addr.phone}</p>
                  <p className="text-xs text-[#7B6A58]">
                    {addr.line1}
                    {addr.line2 ? `, ${addr.line2}` : ""}
                  </p>
                  <p className="text-xs text-[#7B6A58]">
                    {addr.city}, {addr.state} – {addr.postalCode}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {addr.isDefault && (
                    <span className="text-[10px] bg-[#819744] text-white px-2 py-0.5 rounded-full font-semibold">
                      Default
                    </span>
                  )}
                  {selectedId === addr.id && (
                    <FontAwesomeIcon icon={faCheckCircle} className="text-[#819744] text-lg" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-[#C4B59E] rounded-xl text-sm text-[#7B6A58] hover:border-[#819744] hover:text-[#819744] transition"
        >
          <FontAwesomeIcon icon={faPlusCircle} />
          Add a new address
        </button>
      )}

      {showForm && (
        <AddressForm onSaved={handleSaved} onCancel={() => setShowForm(false)} />
      )}

      <button
        onClick={onNext}
        disabled={!selectedId}
        className="mt-5 w-full bg-[#5E2B15] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#4a200f] transition disabled:opacity-40"
      >
        Review Order
        <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
      </button>
    </div>
  );
}

// ── Preview step ──────────────────────────────────────────────────────────────
function PreviewStep({
  addressId,
  onBack,
  onPay,
  isPaying,
  payError,
}: {
  addressId: string;
  onBack: () => void;
  onPay: () => void;
  isPaying: boolean;
  payError: string | null;
}) {
  const [preview, setPreview] = useState<CheckoutPreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch preview on mount
  useEffect(() => {
    let cancelled = false;
    previewCheckout({ addressId })
      .then((data) => {
        if (!cancelled) {
          setPreview(data);
          setIsLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setFetchError(err.message ?? "Failed to load checkout preview");
          setIsLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [addressId]);

  if (isLoading) {
    return (
      <div className="py-10 flex flex-col items-center gap-3 text-[#7B6A58]">
        <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-[#819744]" />
        <p className="text-sm">Calculating your order totals...</p>
      </div>
    );
  }

  if (fetchError || !preview) {
    return (
      <div className="py-6 text-center text-red-600 text-sm">
        {fetchError ?? "Could not load order preview."}
        <button
          onClick={onBack}
          className="block mx-auto mt-3 text-[#5E2B15] underline text-xs"
        >
          Go Back
        </button>
      </div>
    );
  }

  const tot = preview.totals;

  return (
    <div>
      <h3 className="text-lg font-bold text-[#5E2B15] mb-4">Order Summary</h3>

      {/* Line items */}
      <div className="space-y-3 max-h-52 overflow-y-auto pr-1 mb-4">
        {preview.items.map((item) => (
          <div key={item.productVariantId} className="flex justify-between text-sm text-[#3d2b1a]">
            <div>
              <p className="font-medium">{item.productName}</p>
              {item.variantName && (
                <p className="text-xs text-[#7B6A58]">{item.variantName} × {item.quantity}</p>
              )}
            </div>
            <p className="font-semibold shrink-0">₹{Number(item.lineTotal).toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-[#D6C9B6] pt-4 space-y-2 text-sm text-[#5E2B15]">
        <div className="flex justify-between">
          <span>Product Total</span>
          <span>₹{Number(tot.productTotal).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span className="text-[#819744] font-medium">
            {Number(tot.shippingAmount) === 0 ? "FREE" : `₹${Number(tot.shippingAmount).toFixed(2)}`}
          </span>
        </div>
        {Number(tot.taxAmount) > 0 && (
          <div className="flex justify-between">
            <span>Tax</span>
            <span>₹{Number(tot.taxAmount).toFixed(2)}</span>
          </div>
        )}
        {Number(tot.discountAmount) > 0 && (
          <div className="flex justify-between text-[#2E7D32]">
            <span>Discount</span>
            <span>−₹{Number(tot.discountAmount).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base border-t border-[#D6C9B6] pt-2 mt-1">
          <span>Total to Pay</span>
          <span>₹{Number(tot.grandTotal).toFixed(2)}</span>
        </div>
      </div>

      {Number(tot.discountAmount) > 0 && (
        <div className="bg-[#DCE9D8] text-[#2E7D32] px-4 py-3 rounded-xl mt-3 text-sm font-medium">
          You save ₹{Number(tot.discountAmount).toFixed(2)} on this order 🎉
        </div>
      )}

      {payError && (
        <p className="mt-3 text-xs text-red-600 text-center">{payError}</p>
      )}

      <div className="flex gap-3 mt-5">
        <button
          onClick={onBack}
          disabled={isPaying}
          className="px-4 py-2.5 border-2 border-[#D6C9B6] rounded-xl text-sm text-[#7B6A58] hover:bg-[#efe2cf] transition disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={onPay}
          disabled={isPaying}
          className="flex-1 bg-[#819744] text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#6f873a] transition disabled:opacity-60"
        >
          {isPaying ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin />
              Processing...
            </>
          ) : (
            `Pay ₹${Number(tot.grandTotal).toFixed(2)}`
          )}
        </button>
      </div>
    </div>
  );
}

// ── Checkout panel (slide-in overlay) ────────────────────────────────────────
function CheckoutPanel({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (orderNumber: string) => void;
}) {
  const [step, setStep] = useState<CheckoutStep>("address");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const checkout = useCheckout();

  const handlePay = () => {
    if (!selectedAddressId) return;
    checkout.mutate(
      { addressId: selectedAddressId },
      {
        onSuccess: ({ orderNumber }) => onSuccess(orderNumber),
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-end sm:justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full sm:w-[480px] max-h-screen sm:max-h-[90vh] bg-[#FDF8F1] sm:rounded-2xl shadow-2xl overflow-y-auto animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#D6C9B6] shrink-0">
          <div>
            <h2 className="text-xl font-bold text-[#5E2B15]">Checkout</h2>
            <div className="flex items-center gap-2 mt-1">
              {(["address", "preview"] as const).map((s, i) => (
                <div key={s} className="flex items-center gap-1.5">
                  {i > 0 && <div className="w-6 h-px bg-[#D6C9B6]" />}
                  <div
                    className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                      step === s || (step === "paying" && s === "preview")
                        ? "text-[#819744]"
                        : step === "preview" && s === "address"
                          ? "text-[#819744]"
                          : "text-[#C4B59E]"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        (step === "preview" || step === "paying") && s === "address"
                          ? "bg-[#819744] text-white"
                          : step === s
                            ? "bg-[#5E2B15] text-white"
                            : "bg-[#D6C9B6] text-white"
                      }`}
                    >
                      {i + 1}
                    </span>
                    {s === "address" ? "Address" : "Review"}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#EDE3D2] text-[#7B6A58] hover:bg-[#D6C9B6] transition"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === "address" && (
            <AddressStep
              selectedId={selectedAddressId}
              onSelect={setSelectedAddressId}
              onNext={() => {
                if (selectedAddressId) setStep("preview");
              }}
            />
          )}
          {(step === "preview" || step === "paying") && selectedAddressId && (
            <PreviewStep
              addressId={selectedAddressId}
              onBack={() => setStep("address")}
              onPay={handlePay}
              isPaying={checkout.isPending}
              payError={
                checkout.isError
                  ? ((checkout.error as Error)?.message ?? "Payment failed")
                  : null
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main cart page ─────────────────────────────────────────────────────────────
export default function OrderPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const isAuthenticated = Boolean(user);

  const { data: cart, isLoading: cartLoading, isError, error } = useCart(isAuthenticated);
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const clearCart = useClearCart();

  const [showCheckout, setShowCheckout] = useState(false);

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
                        className="rounded-md object-cover"
                      />

                      {/* DETAILS */}
                      <div className="flex-1">
                        <h2 className="text-lg font-semibold text-[#5E2B15]">{itemName}</h2>
                        <p className="text-sm text-[#7B6A58]">
                          Variant:{" "}
                          <span className="text-[#819744]">
                            {item.productVariant.variantName || "Default"}
                          </span>
                        </p>
                        <p className="text-sm text-[#7B6A58]">
                          SKU:{" "}
                          <span className="text-[#819744]">{product.slug}</span>
                        </p>

                        {/* QTY */}
                        <div className="flex items-center gap-4 mt-3">
                          <button
                            onClick={() => decrease(item.id, item.quantity)}
                            disabled={updateItem.isPending || removeItem.isPending}
                            className="w-8 h-8 border flex items-center justify-center rounded"
                          >
                            <FontAwesomeIcon icon={faMinus} />
                          </button>
                          <span className="text-[16px] font-medium">{item.quantity}</span>
                          <button
                            onClick={() => increase(item.id, item.quantity)}
                            disabled={updateItem.isPending || removeItem.isPending}
                            className="w-8 h-8 border flex items-center justify-center rounded"
                          >
                            <FontAwesomeIcon icon={faPlus} />
                          </button>
                          <button
                            onClick={() => removeItem.mutate(item.id)}
                            disabled={removeItem.isPending}
                            className="ml-4 text-white bg-[#5E2B15] text-sm px-3 py-1 hover:text-red-300 transition"
                          >
                            Remove <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>

                      {/* PRICE */}
                      <div className="text-right shrink-0">
                        <p className="font-semibold">₹{itemPrice.toFixed(2)}</p>
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
                  <span className="text-[#819744] font-medium">FREE</span>
                </div>
                <p className="text-xs text-[#9a7a65]">
                  Final prices, taxes & discounts will be confirmed at checkout.
                </p>
                <div className="flex justify-between font-semibold text-lg border-t border-[#D6C9B6] pt-2">
                  <span>Estimated Total</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => clearCart.mutate()}
                disabled={clearCart.isPending}
                className="w-full mt-4 border border-[#5E2B15] text-[#5E2B15] py-2 font-medium hover:bg-[#efe2cf] transition"
              >
                {clearCart.isPending ? "Clearing..." : "Clear Cart"}
              </button>

              {/* CHECKOUT BUTTON */}
              <div className="mt-4">
                <button
                  id="proceed-to-checkout-btn"
                  onClick={() => setShowCheckout(true)}
                  className="block w-full bg-[#819744] text-center text-white py-3 font-semibold hover:bg-[#6f873a] transition"
                >
                  Proceed to Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Checkout panel ── */}
      {showCheckout && (
        <CheckoutPanel
          onClose={() => setShowCheckout(false)}
          onSuccess={(orderNumber) => {
            setShowCheckout(false);
            router.push(`/order-history?order=${encodeURIComponent(orderNumber)}`);
          }}
        />
      )}

      <style jsx global>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease;
        }
      `}</style>
    </>
  );
}
