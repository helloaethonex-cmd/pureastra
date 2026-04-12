"use client";

import Link from "next/link";
import { Suspense, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import toast from "react-hot-toast";
import {
  faArrowLeftLong,
  faCircle,
  faCheckCircle,
  faBoxOpen,
  faTruck,
  faMapMarkerAlt,
  faReceipt,
  faSpinner,
  faShoppingBag,
  faChevronRight,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";
import { getOrderInvoice } from "@/services/api";
import { useMyOrders, useOrderDetail } from "@/hooks/useOrders";

// ── Status maps ───────────────────────────────────────────────────────────────
const ORDER_STATUS_LABEL: Record<number, string> = {
  0: "Placed",
  1: "Confirmed",
  2: "Packed",
  3: "Shipped",
  4: "Delivered",
  5: "Cancelled",
};

const PAYMENT_STATUS_LABEL: Record<number, string> = {
  0: "Pending",
  1: "Paid",
  2: "Failed",
  3: "Refunded",
};

// ── Status step tracker for the confirmation card ─────────────────────────────
const ORDER_STEPS = [
  { status: 0, label: "Order Placed", icon: faReceipt },
  { status: 1, label: "Confirmed", icon: faCheckCircle },
  { status: 2, label: "Packed", icon: faBoxOpen },
  { status: 3, label: "Shipped", icon: faTruck },
  { status: 4, label: "Delivered", icon: faMapMarkerAlt },
];

const statusColor = (orderStatus: number, paymentStatus: number) => {
  if (orderStatus === 5) return "text-red-500";
  if (paymentStatus === 2) return "text-yellow-500";
  if (orderStatus === 4) return "text-[#2E7D32]";
  if (paymentStatus === 1) return "text-[#819744]";
  return "text-[#9ab964]";
};

const paymentBadgeStyle = (paymentStatus: number) => {
  const base = "inline-block px-2 py-0.5 rounded-full text-xs font-semibold";
  if (paymentStatus === 1) return `${base} bg-[#DCE9D8] text-[#2E7D32]`;
  if (paymentStatus === 2) return `${base} bg-red-100 text-red-600`;
  if (paymentStatus === 3) return `${base} bg-blue-100 text-blue-600`;
  return `${base} bg-yellow-100 text-yellow-700`;
};

// ── Order confirmation card (shown when ?order=PA-xxx is fresh) ───────────────
function OrderConfirmationCard({ orderNumber }: { orderNumber: string }) {
  const { data: order, isLoading, isError } = useOrderDetail(orderNumber);
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);

  const handleDownloadInvoice = useCallback(async () => {
    if (!order?.orderNumber || isDownloadingInvoice) return;

    try {
      setIsDownloadingInvoice(true);
      const invoice = await getOrderInvoice(order.orderNumber);

      if (invoice.pdfStatus === 2) {
        // PDF generation failed on the server
        toast.error("Invoice PDF generation failed. Please contact support.");
        return;
      }

      if (!invoice.pdfUrl || invoice.pdfStatus !== 1) {
        // Still pending (pdfStatus === 0)
        toast.error("Invoice is being generated. Please try again in a moment.");
        return;
      }

      // Open directly in a new tab — avoids CORS (browser nav is not subject to CORS)
      window.open(invoice.pdfUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to download invoice.";
      toast.error(message);
    } finally {
      setIsDownloadingInvoice(false);
    }
  }, [isDownloadingInvoice, order?.orderNumber]);

  if (isLoading) {
    return (
      <div className="mb-8 bg-white rounded-2xl shadow-lg border border-[#D6C9B6] p-8 flex flex-col items-center gap-3 animate-pulse-subtle">
        <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-[#819744]" />
        <p className="text-[#7B6A58] text-sm">Loading your order confirmation…</p>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="mb-8 bg-[#DCE9D8] border border-[#819744] rounded-2xl p-6 text-center animate-fade-in">
        <FontAwesomeIcon icon={faCheckCircle} className="text-4xl text-[#819744] mb-2" />
        <h2 className="text-xl font-bold text-[#2E7D32]">Payment Successful!</h2>
        <p className="text-sm text-[#5E2B15] mt-1">Order <strong>{orderNumber}</strong> has been placed.</p>
      </div>
    );
  }

  const grandTotal = (
    Number(order.productTotal) +
    Number(order.shippingAmount) +
    Number(order.taxAmount) -
    Number(order.discountAmount)
  ).toFixed(2);

  const currentStep = order.orderStatus;

  return (
    <div className="mb-10 animate-fade-in">
      {/* Success hero */}
      <div className="bg-linear-to-br from-[#3a6b1c] to-[#819744] rounded-2xl p-8 text-white shadow-xl mb-6 relative overflow-hidden">
        {/* Decorative circle */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />

        <div className="relative z-10 flex items-start gap-5">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faCheckCircle} className="text-3xl text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white/80 text-sm font-medium uppercase tracking-wider mb-1">
              Payment Successful
            </p>
            <h2 className="text-2xl font-bold mb-0.5">Thank you for your order!</h2>
            <p className="text-white/80 text-sm">
              Order <span className="font-mono font-bold text-white">{order.orderNumber}</span> has been placed and confirmed.
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-white/70 text-xs uppercase tracking-wide">Total Paid</p>
            <p className="text-2xl font-bold">₹{Number(order.totalPaid) > 0 ? Number(order.totalPaid).toFixed(2) : grandTotal}</p>
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Order progress tracker */}
        <div className="bg-white rounded-2xl border border-[#D6C9B6] p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[#5E2B15] uppercase tracking-wide mb-4">Order Progress</h3>
          <div className="space-y-3">
            {ORDER_STEPS.filter((s) => s.status !== 5).map((step, i) => {
              const isDone = currentStep > step.status || (currentStep === step.status && order.paymentStatus === 1);
              const isCurrent = currentStep === step.status;
              return (
                <div key={step.status} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm transition-all ${
                    isDone
                      ? "bg-[#819744] text-white"
                      : isCurrent
                        ? "bg-[#5E2B15] text-white"
                        : "bg-[#F5F0E6] text-[#C4B59E]"
                  }`}>
                    <FontAwesomeIcon icon={step.icon} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isDone || isCurrent ? "text-[#3d2b1a]" : "text-[#C4B59E]"}`}>
                      {step.label}
                    </p>
                  </div>
                  {isDone && (
                    <FontAwesomeIcon icon={faCheckCircle} className="text-[#819744] text-sm" />
                  )}
                  {isCurrent && !isDone && (
                    <span className="text-[10px] bg-[#5E2B15] text-white px-2 py-0.5 rounded-full font-semibold">
                      Current
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery address */}
        <div className="bg-white rounded-2xl border border-[#D6C9B6] p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[#5E2B15] uppercase tracking-wide mb-3 flex items-center gap-2">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[#819744]" />
            Delivering To
          </h3>
          <div className="text-sm text-[#5E2B15] space-y-0.5">
            <p className="font-semibold text-base">{order.shippingAddress.name}</p>
            <p className="text-[#7B6A58]">{order.shippingAddress.phone}</p>
            <p className="text-[#7B6A58]">{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 && (
              <p className="text-[#7B6A58]">{order.shippingAddress.line2}</p>
            )}
            <p className="text-[#7B6A58]">
              {order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.postalCode}
            </p>
          </div>
        </div>

        {/* Order items */}
        <div className="bg-white rounded-2xl border border-[#D6C9B6] p-5 shadow-sm md:col-span-2">
          <h3 className="text-sm font-bold text-[#5E2B15] uppercase tracking-wide mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faShoppingBag} className="text-[#819744]" />
            Items Ordered
          </h3>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[#F5F0E6] last:border-0">
                <div>
                  <p className="font-medium text-[#3d2b1a] text-sm">{item.productName}</p>
                  <p className="text-xs text-[#9a7a65]">
                    {item.variantName ? `${item.variantName} · ` : ""}
                    Qty: {item.quantity}
                    {item.sku ? ` · SKU: ${item.sku}` : ""}
                  </p>
                </div>
                <p className="font-semibold text-[#5E2B15] text-sm shrink-0">
                  ₹{(Number(item.price) * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {/* Totals summary */}
          <div className="mt-4 pt-4 border-t border-[#D6C9B6] space-y-1.5 text-sm text-[#5E2B15]">
            <div className="flex justify-between">
              <span className="text-[#7B6A58]">Product Total</span>
              <span>₹{Number(order.productTotal).toFixed(2)}</span>
            </div>
            {Number(order.shippingAmount) > 0 && (
              <div className="flex justify-between">
                <span className="text-[#7B6A58]">Shipping</span>
                <span>₹{Number(order.shippingAmount).toFixed(2)}</span>
              </div>
            )}
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-[#2E7D32]">
                <span>Discount</span>
                <span>−₹{Number(order.discountAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1 border-t border-[#D6C9B6] mt-1">
              <span>Total</span>
              <span>₹{grandTotal}</span>
            </div>
          </div>
        </div>

      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 mt-5">
        <button
          type="button"
          onClick={handleDownloadInvoice}
          disabled={isDownloadingInvoice}
          className="flex-1 text-center border-2 border-[#819744] text-[#5E2B15] py-3 rounded-xl font-semibold hover:bg-[#eef4dd] transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="inline-flex items-center justify-center gap-2">
            <FontAwesomeIcon icon={isDownloadingInvoice ? faSpinner : faDownload} spin={isDownloadingInvoice} />
            {isDownloadingInvoice ? "Downloading..." : "Download Invoice"}
          </span>
        </button>
        <Link
          href="/"
          className="flex-1 text-center bg-[#819744] text-white py-3 rounded-xl font-semibold hover:bg-[#6f873a] transition"
        >
          Continue Shopping
        </Link>
        <Link
          href={`/order-track?order=${encodeURIComponent(order.orderNumber)}`}
          className="flex-1 text-center border-2 border-[#5E2B15] text-[#5E2B15] py-3 rounded-xl font-semibold hover:bg-[#efe2cf] transition"
        >
          Track Order
        </Link>
      </div>
    </div>
  );
}

// ── Order list card ────────────────────────────────────────────────────────────
function OrderCard({ order, highlight }: {
  order: { id: string; orderNumber: string; orderStatus: number; paymentStatus: number; totalPaid: string; createdAt: string };
  highlight: boolean;
}) {
  return (
    <Link href={`/order-history?order=${order.orderNumber}`}>
      <div className={`bg-white rounded-xl border-2 p-5 shadow-sm transition-all cursor-pointer ${
        highlight ? "border-[#819744] shadow-[0_0_0_3px_rgba(129,151,68,0.15)]" : "border-transparent hover:border-[#D6C9B6] hover:shadow-md"
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-[#9a7a65] uppercase tracking-wide mb-0.5">Order Number</p>
            <p className="font-bold text-[#5E2B15] font-mono">{order.orderNumber}</p>
            <p className="text-xs text-[#9a7a65] mt-1">
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </p>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            <span className={paymentBadgeStyle(order.paymentStatus)}>
              {PAYMENT_STATUS_LABEL[order.paymentStatus] ?? "Unknown"}
            </span>
            <p className="font-bold text-[#3d2b1a]">₹{Number(order.totalPaid).toFixed(2)}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={faCircle}
              className={`text-xs ${statusColor(order.orderStatus, order.paymentStatus)}`}
            />
            <span className="text-sm font-medium text-[#5E2B15]">
              {ORDER_STATUS_LABEL[order.orderStatus] ?? "Unknown"}
            </span>
          </div>
          <FontAwesomeIcon icon={faChevronRight} className="text-xs text-[#C4B59E]" />
        </div>
      </div>
    </Link>
  );
}


// ── Main page content ─────────────────────────────────────────────────────────
function OrderHistoryPageContent() {
  const searchParams = useSearchParams();
  const focusOrderNumber = searchParams.get("order");
  const { data, isLoading, isError, error } = useMyOrders({ page: 1, limit: 30 });

  const orders = data?.data ?? [];
  const sortedOrders = [...orders].sort((a, b) => {
    if (focusOrderNumber === a.orderNumber) return -1;
    if (focusOrderNumber === b.orderNumber) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="bg-[#F5F0E6] min-h-screen py-10 px-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <Link href="/profile">
          <div className="flex items-center gap-3 text-[#5E2B16] mb-6 cursor-pointer hover:opacity-80 transition">
            <FontAwesomeIcon icon={faArrowLeftLong} />
            <h1 className="text-[28px] font-semibold">Order History</h1>
          </div>
        </Link>
        <div className="border-t border-[#D6C9B6] mb-6" />

        {/* Confirmation card — only if freshly paid order */}
        {focusOrderNumber && <OrderConfirmationCard orderNumber={focusOrderNumber} />}

        {/* Order list */}
        {!focusOrderNumber && (
          <h2 className="text-lg font-semibold text-[#5E2B15] mb-4">Your Orders</h2>
        )}
        {focusOrderNumber && orders.length > 1 && (
          <h2 className="text-base font-semibold text-[#7B6A58] mb-4 mt-2">Other Orders</h2>
        )}

        {isLoading ? (
          <div className="py-16 text-center text-[#5E2B16] flex flex-col items-center gap-3">
            <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-[#819744]" />
            <p>Loading orders…</p>
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-red-600">
            {(error as Error)?.message ?? "Failed to load orders"}
          </div>
        ) : sortedOrders.length === 0 ? (
          <div className="py-16 text-center text-[#5E2B16] flex flex-col items-center gap-4">
            <FontAwesomeIcon icon={faShoppingBag} className="text-5xl text-[#D6C9B6]" />
            <p className="text-lg">No orders yet.</p>
            <Link
              href="/"
              className="bg-[#819744] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#6f873a] transition"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className=" flex flex-col gap-4">
            {sortedOrders
              .filter((o) => o.orderNumber !== focusOrderNumber)
              .map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  highlight={false}
                />
              ))}
          </div>
        )}

      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default function OrderHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-[#F5F0E6] min-h-screen py-10 px-6 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-[#5E2B16]">
            <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-[#819744]" />
            <p>Loading order history…</p>
          </div>
        </div>
      }
    >
      <OrderHistoryPageContent />
    </Suspense>
  );
}
