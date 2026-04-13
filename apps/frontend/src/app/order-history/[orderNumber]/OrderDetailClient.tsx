"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeftLong,
  faCheckCircle,
  faBoxOpen,
  faTruck,
  faMapMarkerAlt,
  faReceipt,
  faSpinner,
  faCircle,
  faTag,
} from "@fortawesome/free-solid-svg-icons";
import { useOrderDetail } from "@/hooks/useOrders";
import { toShippingInclusiveFromBase } from "@/lib/shipping-pricing";

// -- Status Maps ---------------------------------------------------------------
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

const ORDER_STEPS = [
  { status: 0, label: "Order Placed", icon: faReceipt },
  { status: 1, label: "Confirmed", icon: faCheckCircle },
  { status: 2, label: "Packed", icon: faBoxOpen },
  { status: 3, label: "Shipped", icon: faTruck },
  { status: 4, label: "Delivered", icon: faMapMarkerAlt },
];

const paymentBadge = (ps: number) => {
  const base = "inline-block px-2.5 py-1 rounded-full text-xs font-bold";
  if (ps === 1) return `${base} bg-[#DCE9D8] text-[#2E7D32]`;
  if (ps === 2) return `${base} bg-red-100 text-red-600`;
  if (ps === 3) return `${base} bg-blue-100 text-blue-600`;
  return `${base} bg-yellow-100 text-yellow-700`;
};

// -- Order Detail Page ---------------------------------------------------------
export default function OrderDetailClient({ orderNumber }: { orderNumber: string }) {
  const { data: order, isLoading, isError } = useOrderDetail(orderNumber);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F0E6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[#5E2B16]">
          <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-[#819744]" />
          <p className="text-sm">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen bg-[#F5F0E6] flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-[#5E2B16] text-lg font-semibold">Order not found</p>
        <Link href="/order-history" className="text-[#819744] underline text-sm">
          Back to Order History
        </Link>
      </div>
    );
  }

  const currentStatus = order.orderStatus ?? 0;
  const isCancelled = currentStatus === 5;

  // Compute financial totals from items if no server total
  const itemsTotal = (order.items ?? []).reduce(
    (acc, item) => acc + Number(item.price ?? 0) * (item.quantity ?? 1),
    0,
  );
  const shippingDisplay = toShippingInclusiveFromBase(order.shippingAmount);

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      {/* Top nav */}
      <div className="bg-white border-b border-[#EDE3D2] px-6 py-4 flex items-center gap-3">
        <Link
          href="/order-history"
          className="text-[#5E2B15] hover:text-[#819744] transition flex items-center gap-2 text-sm font-medium"
        >
          <FontAwesomeIcon icon={faArrowLeftLong} />
          <span>Order History</span>
        </Link>
        <span className="text-[#D6C9B6]">/</span>
        <span className="text-sm text-[#9a7a65] font-mono">{orderNumber}</span>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-5">
        {/* -- Status Hero Card -- */}
        <div className={`rounded-3xl p-6 text-white shadow-xl relative overflow-hidden ${
          isCancelled ? "bg-linear-to-br from-red-600 to-red-800" : "bg-linear-to-br from-[#3a6b1c] to-[#819744]"
        }`}>
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full" />
          <div className="relative">
            <p className="text-white/70 text-xs uppercase tracking-widest mb-1">Order</p>
            <p className="text-2xl font-bold font-mono mb-3">{order.orderNumber}</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-xs mb-0.5">Status</p>
                <p className="font-bold text-lg">{ORDER_STATUS_LABEL[currentStatus] ?? "Unknown"}</p>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-xs mb-0.5">Total Paid</p>
                <p className="font-bold text-2xl">Rs.{Number(order.totalPaid ?? itemsTotal).toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20">
              <p className="text-white/70 text-xs">
                Placed on{" "}
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <span className={paymentBadge(order.paymentStatus ?? 0)}>
                {PAYMENT_STATUS_LABEL[order.paymentStatus ?? 0] ?? "Unknown"}
              </span>
            </div>
          </div>
        </div>

        {/* -- Progress Tracker -- */}
        {!isCancelled && (
          <div className="bg-white rounded-3xl border border-[#EDE3D2] p-6 shadow-sm">
            <h2 className="text-sm font-bold text-[#5E2B15] uppercase tracking-wide mb-5">
              Order Progress
            </h2>
            <div className="relative flex items-start">
              {/* Track line */}
              <div
                className="absolute top-4 left-4 right-4 h-0.5 bg-[#EDE3D2] z-0"
                style={{
                  left: `calc(${100 / ORDER_STEPS.length / 2}%)`,
                  right: `calc(${100 / ORDER_STEPS.length / 2}%)`,
                }}
              />

              {ORDER_STEPS.map((step) => {
                const done = currentStatus > step.status;
                const active = currentStatus === step.status;
                return (
                  <div
                    key={step.status}
                    className="flex-1 flex flex-col items-center relative z-10 gap-2"
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        done
                          ? "bg-[#819744] text-white shadow-md"
                          : active
                            ? "bg-[#5E2B15] text-white shadow-[0_0_0_4px_rgba(94,43,21,0.15)]"
                            : "bg-[#EDE3D2] text-[#C4B59E]"
                      }`}
                    >
                      {done ? (
                        <FontAwesomeIcon icon={faCheckCircle} />
                      ) : (
                        <FontAwesomeIcon icon={step.icon} />
                      )}
                    </div>
                    <p
                      className={`text-[10px] font-semibold text-center leading-tight ${
                        done || active ? "text-[#5E2B15]" : "text-[#C4B59E]"
                      }`}
                    >
                      {step.label}
                    </p>
                    {done && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-1.5 h-1.5 rounded-full bg-[#819744]" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-center gap-3">
            <FontAwesomeIcon icon={faCircle} className="text-red-500" />
            <div>
              <p className="font-bold text-red-700 text-sm">Order Cancelled</p>
              <p className="text-xs text-red-500 mt-0.5">
                This order has been cancelled. If payment was made, a refund will be processed.
              </p>
            </div>
          </div>
        )}

        {/* -- Items -- */}
        {(order.items ?? []).length > 0 && (
          <div className="bg-white rounded-3xl border border-[#EDE3D2] p-6 shadow-sm">
            <h2 className="text-sm font-bold text-[#5E2B15] uppercase tracking-wide mb-4">
              Items Ordered
            </h2>
            <div className="space-y-3">
              {(order.items ?? []).map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 py-3 border-b border-[#F5F0E6] last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#3d2b1a] text-sm truncate">{item.productName}</p>
                    {item.variantName && (
                      <p className="text-xs text-[#9a7a65] mt-0.5">{item.variantName}</p>
                    )}
                    {item.sku && (
                      <p className="text-xs text-[#C4B59E] font-mono">{item.sku}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-[#9a7a65]">Qty: {item.quantity}</p>
                    <p className="font-bold text-[#5E2B15] text-sm mt-0.5">
                      Rs.{(Number(item.price ?? 0) * (item.quantity ?? 1)).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-[#EDE3D2] space-y-2 text-sm">
              <div className="flex justify-between text-[#7B6A58]">
                <span>Subtotal</span>
                <span>Rs.{itemsTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#819744] font-medium">
                <span className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faTruck} className="text-xs" /> Shipping
                </span>
                <span>
                  {shippingDisplay.inclusive > 0
                    ? `Rs.${shippingDisplay.inclusive.toFixed(2)}`
                    : "FREE"}
                </span>
              </div>
              {shippingDisplay.inclusive > 0 && shippingDisplay.gstComponent > 0 && (
                <div className="flex justify-between text-xs text-[#9a7a65]">
                  <span />
                  <span>(includes Rs.{shippingDisplay.gstComponent.toFixed(2)} GST)</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-[#5E2B15] border-t border-[#EDE3D2] pt-2 mt-1">
                <span>Total Paid</span>
                <span>Rs.{Number(order.totalPaid ?? itemsTotal).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* -- Delivery Address -- */}
        {order.shippingAddress && (
          <div className="bg-white rounded-3xl border border-[#EDE3D2] p-6 shadow-sm">
            <h2 className="text-sm font-bold text-[#5E2B15] uppercase tracking-wide mb-3 flex items-center gap-2">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[#819744]" />
              Delivery Address
            </h2>
            <div className="text-sm text-[#5E2B15] space-y-0.5">
              <p className="font-semibold">{order.shippingAddress.name}</p>
              <p className="text-[#7B6A58]">{order.shippingAddress.phone}</p>
              <p className="text-[#7B6A58]">
                {order.shippingAddress.line1}
                {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
              </p>
              <p className="text-[#7B6A58]">
                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
              </p>
              <p className="text-[#7B6A58]">{order.shippingAddress.country}</p>
            </div>
          </div>
        )}

        {/* -- Payment Info -- */}
        {(order.payments ?? []).length > 0 && (
          <div className="bg-white rounded-3xl border border-[#EDE3D2] p-6 shadow-sm">
            <h2 className="text-sm font-bold text-[#5E2B15] uppercase tracking-wide mb-3 flex items-center gap-2">
              <FontAwesomeIcon icon={faTag} className="text-[#819744]" />
              Payment
            </h2>
            {(order.payments ?? []).map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-[#7B6A58] capitalize">{p.method?.toLowerCase() ?? "Online"}</p>
                  <p className="text-xs text-[#C4B59E] mt-0.5">
                    {new Date(p.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#5E2B15]">Rs.{Number(p.amount).toFixed(2)}</p>
                  <span className={paymentBadge(p.status)}>
                    {PAYMENT_STATUS_LABEL[p.status] ?? "Unknown"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* -- Status History -- */}
        {(order.statusHistory ?? []).length > 0 && (
          <div className="bg-white rounded-3xl border border-[#EDE3D2] p-6 shadow-sm">
            <h2 className="text-sm font-bold text-[#5E2B15] uppercase tracking-wide mb-4">
              Timeline
            </h2>
            <div className="space-y-4 relative">
              <div className="absolute left-1.75 top-2 bottom-2 w-0.5 bg-[#EDE3D2]" />
              {(order.statusHistory ?? [])
                .slice()
                .reverse()
                .map((h, i) => (
                  <div key={i} className="flex gap-4 items-start relative pl-0">
                    <div className="w-4 h-4 rounded-full bg-[#819744] shrink-0 mt-0.5 relative z-10 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[#5E2B15]">
                        {ORDER_STATUS_LABEL[h.newStatus] ?? `Status ${h.newStatus}`}
                      </p>
                      {h.note && <p className="text-xs text-[#9a7a65] mt-0.5">{h.note}</p>}
                      <p className="text-xs text-[#C4B59E] mt-0.5">
                        {new Date(h.createdAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* -- CTAs -- */}
        <div className="flex gap-3 pb-8">
          <Link
            href="/"
            className="flex-1 text-center bg-[#819744] text-white py-3 rounded-2xl font-semibold hover:bg-[#6f873a] transition text-sm"
          >
            Continue Shopping
          </Link>
          <Link
            href="/order-history"
            className="flex-1 text-center border-2 border-[#5E2B15] text-[#5E2B15] py-3 rounded-2xl font-semibold hover:bg-[#efe2cf] transition text-sm"
          >
            All Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
