"use client";

import { useQuery } from "@tanstack/react-query";
import {
  listCategories,
  listProducts,
  getProductBySlug,
  type Category,
  type ProductListResponse,
  type ProductListParams,
} from "@/services/api";

// ─── Categories ───────────────────────────────────────────────────────────────

type UseCategoriesOptions = {
  enabled?: boolean;
  initialData?: Category[];
};

export function useCategories(options: boolean | UseCategoriesOptions = true) {
  const resolvedOptions =
    typeof options === "boolean" ? { enabled: options } : options;

  return useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
    enabled: resolvedOptions.enabled ?? true,
    initialData: resolvedOptions.initialData,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Products ─────────────────────────────────────────────────────────────────

type UseProductsOptions = {
  enabled?: boolean;
  keepPreviousData?: boolean;
  initialData?: ProductListResponse;
};

export function useProducts(
  params: ProductListParams = {},
  options?: UseProductsOptions,
) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => listProducts(params),
    enabled: options?.enabled ?? true,
    placeholderData: options?.keepPreviousData
      ? (previousData) => previousData
      : undefined,
    initialData: options?.initialData,
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
