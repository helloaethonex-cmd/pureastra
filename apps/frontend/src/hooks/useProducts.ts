"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listCategories,
  listProducts,
  getProductBySlug,
  type ProductListParams,
} from "@/services/api";

// ─── Categories ───────────────────────────────────────────────────────────────

export function useCategories(enabled = true) {
  return useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Products ─────────────────────────────────────────────────────────────────

type UseProductsOptions = {
  keepPreviousData?: boolean;
};

export function useProducts(
  params: ProductListParams = {},
  options?: UseProductsOptions,
) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => listProducts(params),
    placeholderData: options?.keepPreviousData
      ? (previousData) => previousData
      : undefined,
    staleTime: 1000 * 60 * 2,
  });
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });
}
