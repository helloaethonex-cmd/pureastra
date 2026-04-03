"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong, faCircle } from "@fortawesome/free-solid-svg-icons";
import { useMyOrders } from "@/hooks/useOrders";

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
  1: "Success",
  2: "Failed",
  3: "Refunded",
};

const statusColor = (orderStatus: number, paymentStatus: number) => {
  if (orderStatus === 5) return "text-red-500";
  if (paymentStatus === 2) return "text-yellow-500";
  if (orderStatus === 4) return "text-green-500";
  return "text-[#819744]";
};

export default function OrderHistoryPage() {
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
      <div className="max-w-5xl mx-auto">
        <Link href="/profile">
          <div className="flex items-center gap-3 text-[#5E2B16] mb-6 cursor-pointer">
            <FontAwesomeIcon icon={faArrowLeftLong} />
            <h1 className="text-[28px] font-semibold">Order History</h1>
          </div>
        </Link>

        <div className="border-t border-[#D6C9B6] mb-6" />

        {isLoading ? (
          <div className="py-16 text-center text-[#5E2B16]">Loading orders…</div>
        ) : isError ? (
          <div className="py-16 text-center text-red-600">
            {(error as Error)?.message ?? "Failed to load orders"}
          </div>
        ) : sortedOrders.length === 0 ? (
          <div className="py-16 text-center text-[#5E2B16]">
            No orders yet. Start shopping to place your first order.
          </div>
        ) : (
          <div className="space-y-3">
            {sortedOrders.map((order) => {
              const isFocused = focusOrderNumber === order.orderNumber;
              return (
                <div
                  key={order.id}
                  className={`bg-white p-4 rounded shadow-sm border ${
                    isFocused ? "border-[#819744]" : "border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Order Number</p>
                      <p className="font-semibold text-[#5E2B16]">{order.orderNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="font-medium text-[#5E2B16]">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon
                        icon={faCircle}
                        className={`${statusColor(order.orderStatus, order.paymentStatus)} text-xs`}
                      />
                      <span className="text-sm font-medium text-[#5E2B16]">
                        {ORDER_STATUS_LABEL[order.orderStatus] ?? "Unknown"}
                      </span>
                    </div>

                    <div className="text-sm text-[#5E2B16]">
                      Payment:{" "}
                      <span className="font-medium">
                        {PAYMENT_STATUS_LABEL[order.paymentStatus] ?? "Unknown"}
                      </span>
                    </div>

                    <div className="text-sm text-[#5E2B16]">
                      Paid: <span className="font-medium">₹{order.totalPaid}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

