"use client";

import { useQuery } from "@tanstack/react-query";
import { listMyOrders } from "@/services/api";

export function useMyOrders(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => listMyOrders(params),
    staleTime: 1000 * 30,
  });
}

