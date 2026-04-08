"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeftLong,
  faMapMarkerAlt,
  faCheckCircle,
  faPlusCircle,
  faChevronRight,
  faSpinner,
  faShieldAlt,
  faTag,
  faTruck,
} from "@fortawesome/free-solid-svg-icons";
import { useAuthStore } from "@/store/auth.store";
import { useMyAddresses } from "@/hooks/useCheckout";
import { useCheckout } from "@/hooks/useCheckout";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createAddress,
  previewCheckout,
  type Address,
  type CheckoutPreviewResponse,
} from "@/services/api";

// ── helpers ───────────────────────────────────────────────────────────────────
type Step = "address" | "preview" | "paying";

const EMPTY_FORM = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  isDefault: false,
};

// ── Address Form ──────────────────────────────────────────────────────────────
function AddressForm({
  onSaved,
  onCancel,
}: {
  onSaved: (addr: Address) => void;
  onCancel: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);

  const save = useMutation({
    mutationFn: () => createAddress(form),
    onSuccess: (addr) => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      onSaved(addr);
    },
  });

  const f = (key: keyof typeof EMPTY_FORM, label: string, type = "text", half = false) => (
    <div className={half ? "col-span-1" : "col-span-2"}>
      <label className="block text-xs font-semibold text-[#7B6A58] mb-1 uppercase tracking-wide">
        {label}
      </label>
      <input
        type={type}
        value={String(form[key])}
        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
        className="w-full px-3 py-2.5 rounded-xl border border-[#D6C9B6] bg-white text-[#3d2b1a] text-sm focus:outline-none focus:ring-2 focus:ring-[#819744]/40"
      />
    </div>
  );

  return (
    <div className="mt-4 bg-[#F5F0E6] border border-[#D6C9B6] rounded-2xl p-5 animate-fade-in">
      <p className="text-sm font-bold text-[#5E2B15] mb-4">Add New Address</p>
      <div className="grid grid-cols-2 gap-3">
        {f("fullName", "Full Name")}
        {f("phone", "Phone", "tel")}
        {f("line1", "Address Line 1")}
        {f("line2", "Address Line 2 (optional)")}
        {f("city", "City", "text", true)}
        {f("state", "State", "text", true)}
        {f("postalCode", "Postal Code", "text", true)}
        {f("country", "Country", "text", true)}
        <div className="col-span-2 flex items-center gap-2">
          <input
            id="isDefault"
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))}
            className="accent-[#819744]"
          />
          <label htmlFor="isDefault" className="text-xs text-[#7B6A58]">
            Set as default address
          </label>
        </div>
      </div>
      {save.isError && (
        <p className="mt-2 text-xs text-red-500">
          {(save.error as Error)?.message ?? "Failed to save"}
        </p>
      )}
      <div className="flex gap-3 mt-4">
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="flex-1 bg-[#5E2B15] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#4a200f] transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {save.isPending && <FontAwesomeIcon icon={faSpinner} spin />}
          Save Address
        </button>
        <button
          onClick={onCancel}
          className="px-5 py-2.5 border border-[#D6C9B6] rounded-xl text-sm text-[#7B6A58] hover:bg-[#efe2cf] transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Address Step ──────────────────────────────────────────────────────────────
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

  // Auto-select default address on load
  useEffect(() => {
    if (!selectedId && addresses && addresses.length > 0) {
      const def = addresses.find((a) => a.isDefault) ?? addresses[0];
      onSelect(def.id);
    }
  }, [addresses, selectedId, onSelect]);

  return (
    <div>
      <h2 className="text-xl font-bold text-[#5E2B15] mb-1 flex items-center gap-2">
        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[#819744]" />
        Delivery Address
      </h2>
      <p className="text-sm text-[#9a7a65] mb-5">Choose where to deliver your order</p>

      {isLoading ? (
        <div className="py-8 text-center text-[#7B6A58] text-sm flex flex-col items-center gap-2">
          <FontAwesomeIcon icon={faSpinner} spin className="text-2xl text-[#819744]" />
          Loading addresses…
        </div>
      ) : (
        <div className="space-y-3">
          {(addresses ?? []).map((addr) => (
            <button
              key={addr.id}
              onClick={() => onSelect(addr.id)}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                selectedId === addr.id
                  ? "border-[#819744] bg-[#f0f6e8] shadow-sm"
                  : "border-[#D6C9B6] bg-white hover:border-[#9ab964] hover:bg-[#f7faef]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-semibold text-[#3d2b1a] text-sm">{addr.fullName}</p>
                  <p className="text-xs text-[#7B6A58] mt-0.5">{addr.phone}</p>
                  <p className="text-xs text-[#7B6A58]">
                    {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}
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
          className="mt-4 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#C4B59E] rounded-2xl text-sm text-[#7B6A58] hover:border-[#819744] hover:text-[#819744] transition"
        >
          <FontAwesomeIcon icon={faPlusCircle} />
          Add New Address
        </button>
      )}

      {showForm && (
        <AddressForm
          onSaved={(addr) => { onSelect(addr.id); setShowForm(false); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <button
        onClick={onNext}
        disabled={!selectedId}
        className="mt-6 w-full bg-[#5E2B15] text-white py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-[#4a200f] transition disabled:opacity-40 text-sm"
      >
        Review Order
        <FontAwesomeIcon icon={faChevronRight} />
      </button>
    </div>
  );
}

// ── Preview Step ──────────────────────────────────────────────────────────────
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

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setFetchError(null);
    previewCheckout({ addressId })
      .then((data) => { if (!cancelled) { setPreview(data); setIsLoading(false); } })
      .catch((err: Error) => { if (!cancelled) { setFetchError(err.message ?? "Failed to load order preview"); setIsLoading(false); } });
    return () => { cancelled = true; };
  }, [addressId]);

  if (isLoading) {
    return (
      <div className="py-16 flex flex-col items-center gap-4 text-[#7B6A58]">
        <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-[#819744]" />
        <p className="text-sm">Calculating your order totals…</p>
      </div>
    );
  }

  if (fetchError || !preview) {
    return (
      <div className="py-8 text-center text-red-600 text-sm">
        {fetchError ?? "Could not load order preview."}
        <button onClick={onBack} className="block mx-auto mt-3 text-[#5E2B15] underline text-xs">
          Go Back
        </button>
      </div>
    );
  }

  const tot = preview.totals;

  return (
    <div>
      <h2 className="text-xl font-bold text-[#5E2B15] mb-5">Order Summary</h2>

      {/* Items */}
      <div className="space-y-3 mb-5">
        {preview.items.map((item) => (
          <div key={item.productVariantId} className="flex justify-between items-start gap-3 bg-white rounded-xl p-3 border border-[#EDE3D2]">
            <div className="flex-1">
              <p className="font-semibold text-[#3d2b1a] text-sm">{item.productName}</p>
              {item.variantName && (
                <p className="text-xs text-[#9a7a65] mt-0.5">{item.variantName} × {item.quantity}</p>
              )}
            </div>
            <p className="font-bold text-[#5E2B15] text-sm shrink-0">₹{Number(item.lineTotal).toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="bg-white rounded-2xl border border-[#EDE3D2] p-4 space-y-2.5 text-sm text-[#5E2B15]">
        <div className="flex justify-between">
          <span className="text-[#7B6A58]">Product Total</span>
          <span>₹{Number(tot.productTotal).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#7B6A58] flex items-center gap-1">
            <FontAwesomeIcon icon={faTruck} className="text-[10px]" /> Shipping
          </span>
          <span className="text-[#819744] font-semibold">
            {Number(tot.shippingAmount) === 0 ? "FREE" : `₹${Number(tot.shippingAmount).toFixed(2)}`}
          </span>
        </div>
        {Number(tot.taxAmount) > 0 && (
          <div className="flex justify-between">
            <span className="text-[#7B6A58]">Tax</span>
            <span>₹{Number(tot.taxAmount).toFixed(2)}</span>
          </div>
        )}
        {Number(tot.discountAmount) > 0 && (
          <div className="flex justify-between text-[#2E7D32]">
            <span className="flex items-center gap-1"><FontAwesomeIcon icon={faTag} className="text-[10px]" /> Discount</span>
            <span>−₹{Number(tot.discountAmount).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base border-t border-[#EDE3D2] pt-2.5 mt-1">
          <span>Total to Pay</span>
          <span>₹{Number(tot.grandTotal).toFixed(2)}</span>
        </div>
      </div>

      {Number(tot.discountAmount) > 0 && (
        <div className="bg-[#DCE9D8] text-[#2E7D32] px-4 py-3 rounded-xl mt-3 text-sm font-medium flex items-center gap-2">
          🎉 You save ₹{Number(tot.discountAmount).toFixed(2)} on this order!
        </div>
      )}

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-[#9a7a65]">
        <span className="flex items-center gap-1">
          <FontAwesomeIcon icon={faShieldAlt} className="text-[#819744]" /> Secure Payment
        </span>
        <span>•</span>
        <span>Powered by Razorpay</span>
        <span>•</span>
        <span>256-bit SSL</span>
      </div>

      {payError && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl text-center">{payError}</p>
      )}

      <div className="flex gap-3 mt-5">
        <button
          onClick={onBack}
          disabled={isPaying}
          className="px-5 py-3 border-2 border-[#D6C9B6] rounded-2xl text-sm text-[#7B6A58] hover:bg-[#efe2cf] transition disabled:opacity-50"
        >
          ← Back
        </button>
        <button
          onClick={onPay}
          disabled={isPaying}
          className="flex-1 bg-[#819744] text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#6f873a] transition disabled:opacity-60 text-sm"
        >
          {isPaying ? (
            <><FontAwesomeIcon icon={faSpinner} spin /> Processing…</>
          ) : (
            `Pay ₹${Number(tot.grandTotal).toFixed(2)}`
          )}
        </button>
      </div>
    </div>
  );
}

// ── Step Indicator ────────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: Step }) {
  const steps = [
    { key: "address", label: "Delivery Address" },
    { key: "preview", label: "Review & Pay" },
  ] as const;

  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => {
        const isActive = step === s.key || (step === "paying" && s.key === "preview");
        const isDone = (step === "preview" || step === "paying") && s.key === "address";
        return (
          <div key={s.key} className="flex items-center flex-1">
            {i > 0 && (
              <div className={`flex-1 h-0.5 mx-2 ${isDone ? "bg-[#819744]" : "bg-[#D6C9B6]"}`} />
            )}
            <div className="flex items-center gap-2 shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                isDone ? "bg-[#819744] text-white" : isActive ? "bg-[#5E2B15] text-white" : "bg-[#D6C9B6] text-white"
              }`}>
                {isDone ? <FontAwesomeIcon icon={faCheckCircle} /> : i + 1}
              </div>
              <span className={`text-xs font-semibold hidden sm:block ${isActive || isDone ? "text-[#5E2B15]" : "text-[#C4B59E]"}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${(step === "preview" || step === "paying") ? "bg-[#819744]" : "bg-[#D6C9B6]"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Checkout Page ─────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [step, setStep] = useState<Step>("address");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const checkout = useCheckout();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  const handlePay = () => {
    if (!selectedAddressId) return;
    checkout.mutate(
      { addressId: selectedAddressId },
      {
        onSuccess: ({ orderNumber }) => {
          router.push(`/order-history?order=${encodeURIComponent(orderNumber)}`);
        },
      },
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F0E6] flex items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-[#819744]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      {/* Top nav bar */}
      <div className="bg-white border-b border-[#EDE3D2] px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-[#5E2B15] hover:text-[#819744] transition flex items-center gap-2 text-sm font-medium"
        >
          <FontAwesomeIcon icon={faArrowLeftLong} />
          <span className="hidden sm:inline">Back</span>
        </button>
        <div className="flex-1 flex items-center justify-center">
          <h1 className="text-lg font-bold text-[#5E2B15]">Checkout</h1>
        </div>
        <div className="w-16" /> {/* spacer */}
      </div>

      <div className="max-w-lg mx-auto px-5 py-8">
        {/* Step indicator */}
        <StepIndicator step={step} />

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-[#EDE3D2] p-6 md:p-8">
          {step === "address" && (
            <AddressStep
              selectedId={selectedAddressId}
              onSelect={setSelectedAddressId}
              onNext={() => { if (selectedAddressId) setStep("preview"); }}
            />
          )}
          {(step === "preview" || step === "paying") && selectedAddressId && (
            <PreviewStep
              addressId={selectedAddressId}
              onBack={() => setStep("address")}
              onPay={handlePay}
              isPaying={checkout.isPending}
              payError={checkout.isError ? ((checkout.error as Error)?.message ?? "Payment failed") : null}
            />
          )}
        </div>

        {/* Footer trust note */}
        <p className="text-center text-xs text-[#C4B59E] mt-6">
          Your payment is secured by Razorpay. We never store your card details.
        </p>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease; }
      `}</style>
    </div>
  );
}
