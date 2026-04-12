"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeftLong,
  faBoxOpen,
  faCheckCircle,
  faCircle,
  faGift,
  faMotorcycle,
  faSpinner,
  faTruck,
} from "@fortawesome/free-solid-svg-icons";
import { useMyOrders, useOrderDetail } from "@/hooks/useOrders";

const ORDER_STATUS = {
  PLACED: 0,
  CONFIRMED: 1,
  PACKED: 2,
  SHIPPED: 3,
  DELIVERED: 4,
  CANCELLED: 5,
} as const;

const ORDER_STATUS_LABEL: Record<number, string> = {
  0: "Placed",
  1: "Confirmed",
  2: "Shipping",
  3: "Transit",
  4: "Delivered",
  5: "Cancelled",
};

const TRACKING_STEPS = [
  {
    status: ORDER_STATUS.CONFIRMED,
    title: "Order Confirmed",
    desc: "Your order is confirmed and being prepared.",
    icon: faCheckCircle,
    color: "text-[#7BAE3C]",
  },
  {
    status: ORDER_STATUS.PACKED,
    title: "Shipping",
    desc: "Your order is packed and ready for dispatch.",
    icon: faBoxOpen,
    color: "text-[#3B82F6]",
  },
  {
    status: ORDER_STATUS.SHIPPED,
    title: "Transit",
    desc: "Your package is on the way.",
    icon: faTruck,
    color: "text-[#F97316]",
  },
  {
    status: ORDER_STATUS.DELIVERED,
    title: "Delivered Successfully",
    desc: "Your order has been delivered.",
    icon: faGift,
    color: "text-[#EC4899]",
  },
] as const;

function OrderTrackPageContent() {
  const searchParams = useSearchParams();
  const orderFromQuery = searchParams.get("order");

  const { data: ordersData, isLoading: isLoadingOrders } = useMyOrders({
    page: 1,
    limit: 20,
  });

  const sortedOrders = useMemo(() => {
    const orders = ordersData?.data ?? [];
    return [...orders].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [ordersData?.data]);

  const selectedOrderNumber = orderFromQuery ?? sortedOrders[0]?.orderNumber ?? null;

  const {
    data: order,
    isLoading: isLoadingDetail,
    isError,
    error,
  } = useOrderDetail(selectedOrderNumber);

  const isCancelled = order?.orderStatus === ORDER_STATUS.CANCELLED;

  const statusHistoryMap = useMemo(() => {
    if (!order) return new Map<number, string>();

    const map = new Map<number, string>();
    for (const entry of order.statusHistory) {
      if (!map.has(entry.newStatus)) {
        map.set(entry.newStatus, entry.createdAt);
      }
    }
    return map;
  }, [order]);

  return (
    <div className="bg-[#F5F0E6] min-h-screen py-10 px-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/order-history">
          <div className="flex items-center gap-3 text-[#5E2B16] mb-6 cursor-pointer hover:opacity-80 transition">
            <FontAwesomeIcon icon={faArrowLeftLong} />
            <h1 className="text-[28px] font-semibold">Order Tracking</h1>
          </div>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          <div className="bg-white rounded-2xl border border-[#D6C9B6] p-6 shadow-sm min-h-105">
            {isLoadingOrders || (selectedOrderNumber && isLoadingDetail) ? (
              <div className="h-full min-h-75 flex flex-col items-center justify-center gap-3 text-[#5E2B16]">
                <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-[#819744]" />
                <p>Loading tracking details...</p>
              </div>
            ) : !selectedOrderNumber ? (
              <div className="h-full min-h-75 flex flex-col items-center justify-center gap-3 text-[#5E2B16]">
                <FontAwesomeIcon icon={faMotorcycle} className="text-4xl text-[#D6C9B6]" />
                <p className="text-lg font-semibold">No orders available to track.</p>
                <Link
                  href="/"
                  className="bg-[#819744] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#6f873a] transition"
                >
                  Start Shopping
                </Link>
              </div>
            ) : isError || !order ? (
              <div className="h-full min-h-75 flex flex-col items-center justify-center gap-3 text-red-600">
                <p>{(error as Error)?.message ?? "Unable to load tracking details."}</p>
              </div>
            ) : (
              <>
                <div className="mb-6 pb-4 border-b border-[#F0E5D7]">
                  <p className="text-xs text-[#9a7a65] uppercase tracking-wide">Order Number</p>
                  <p className="font-mono text-[#5E2B15] text-lg font-bold">{order.orderNumber}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faCircle}
                      className={`text-[10px] ${
                        isCancelled
                          ? "text-red-500"
                          : order.orderStatus === ORDER_STATUS.DELIVERED
                            ? "text-[#2E7D32]"
                            : "text-[#819744]"
                      }`}
                    />
                    <span className="text-sm font-medium text-[#5E2B15]">
                      {ORDER_STATUS_LABEL[order.orderStatus] ?? "Unknown"}
                    </span>
                  </div>
                </div>

                {isCancelled ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
                    This order was cancelled.
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-3 top-1 bottom-1 border-l-2 border-[#D6C9B6]" />
                    <div className="space-y-8">
                      {TRACKING_STEPS.map((step) => {
                        const isDone = order.orderStatus >= step.status;
                        const isCurrent = order.orderStatus === step.status;
                        const completedAt = statusHistoryMap.get(step.status);

                        return (
                          <div key={step.status} className="relative grid grid-cols-[30px_40px_1fr] items-start gap-3">
                            <div className="relative z-10 pt-1">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                                  isDone
                                    ? "bg-[#819744] text-white"
                                    : "bg-white border border-[#C9B8A5] text-[#7B6A58]"
                                }`}
                              >
                                {isDone ? (
                                  <FontAwesomeIcon icon={faCheckCircle} className="text-[12px]" />
                                ) : (
                                  step.status
                                )}
                              </div>
                            </div>

                            <div className={`text-2xl pt-0.5 ${step.color}`}>
                              <FontAwesomeIcon icon={step.icon} />
                            </div>

                            <div>
                              <h3 className="text-[#5E2B15] font-semibold text-base">{step.title}</h3>
                              <p className="text-[#8C7A68] text-sm">{step.desc}</p>
                              {isCurrent && (
                                <span className="inline-block mt-2 text-[11px] bg-[#5E2B15] text-white px-2 py-0.5 rounded-full font-semibold">
                                  Current
                                </span>
                              )}
                              {completedAt && (
                                <p className="mt-1 text-xs text-[#9a7a65]">
                                  {new Date(completedAt).toLocaleString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <aside className="bg-[#5E2B15] text-white rounded-2xl shadow-xl overflow-hidden h-fit">
            <div className="px-5 py-4 border-b border-white/20">
              <p className="text-sm uppercase tracking-wide text-white/80">Track Another Order</p>
            </div>
            <div className="max-h-105 overflow-auto">
              {sortedOrders.length === 0 ? (
                <p className="px-5 py-6 text-sm text-white/80">No orders found.</p>
              ) : (
                sortedOrders.map((listOrder) => {
                  const isActive = selectedOrderNumber === listOrder.orderNumber;
                  return (
                    <Link
                      key={listOrder.id}
                      href={`/order-track?order=${encodeURIComponent(listOrder.orderNumber)}`}
                      className={`block px-5 py-4 border-b border-white/10 transition ${
                        isActive ? "bg-[#4a1f0f]" : "hover:bg-[#4a1f0f]"
                      }`}
                    >
                      <p className="font-mono text-sm font-semibold">{listOrder.orderNumber}</p>
                      <p className="text-xs text-white/70 mt-1">
                        {new Date(listOrder.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </Link>
                  );
                })
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function OrderTrackPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-[#F5F0E6] min-h-screen py-10 px-6 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-[#5E2B16]">
            <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-[#819744]" />
            <p>Loading tracking page...</p>
          </div>
        </div>
      }
    >
      <OrderTrackPageContent />
    </Suspense>
  );
}