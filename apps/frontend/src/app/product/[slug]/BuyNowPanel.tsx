"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Address } from "@/services/api";
import { createAddress, previewBuyNowCheckout } from "@/services/api";
import { useBuyNowCheckout, useMyAddresses } from "@/hooks/useCheckout";
import { useAuthStore } from "@/store/auth.store";
import { getActiveReferralAttribution } from "@/lib/referral";

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

export function BuyNowPanel({
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
