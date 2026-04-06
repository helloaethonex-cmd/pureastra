"use client";

import { useQuery } from "@tanstack/react-query";
import { listMyOrders, getOrderDetail } from "@/services/api";

export function useMyOrders(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => listMyOrders(params),
    staleTime: 1000 * 30,
  });
}

export function useOrderDetail(orderNumber: string | null | undefined) {
  return useQuery({
    queryKey: ["orderDetail", orderNumber],
    queryFn: () => getOrderDetail(orderNumber!),
    enabled: Boolean(orderNumber),
    staleTime: 0,
    retry: 2,
  });
}
