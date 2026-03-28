"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listCategories,
  listProducts,
  getProductBySlug,
  type ProductListParams,
} from "@/services/api";

// ─── Categories ───────────────────────────────────────────────────────────────

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Products ─────────────────────────────────────────────────────────────────

export function useProducts(params: ProductListParams = {}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => listProducts(params),
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
