"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProductReview,
  getProductReviewMetrics,
  getProductReviews,
  getProductReviewSummary,
  getReviewEligibility,
} from "@/services/api";

export function useProductReviews(productId: string, params?: {
  page?: number;
  limit?: number;
  sortBy?: "newest" | "highest" | "lowest";
}) {
  return useQuery({
    queryKey: ["productReviews", productId, params],
    queryFn: () => getProductReviews(productId, params),
    enabled: Boolean(productId),
    staleTime: 1000 * 30,
  });
}

export function useProductReviewSummary(productId: string) {
  return useQuery({
    queryKey: ["productReviewSummary", productId],
    queryFn: () => getProductReviewSummary(productId),
    enabled: Boolean(productId),
    staleTime: 1000 * 30,
  });
}

export function useProductReviewMetrics(productId: string) {
  return useQuery({
    queryKey: ["productReviewMetrics", productId],
    queryFn: () => getProductReviewMetrics(productId),
    enabled: Boolean(productId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useReviewEligibility(productId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["reviewEligibility", productId],
    queryFn: () => getReviewEligibility(productId),
    enabled: Boolean(productId) && enabled,
    retry: false,
    staleTime: 1000 * 30,
  });
}

export function useCreateProductReview(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProductReview,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["productReviews", productId] }),
        queryClient.invalidateQueries({ queryKey: ["productReviewSummary", productId] }),
        queryClient.invalidateQueries({ queryKey: ["reviewEligibility", productId] }),
      ]);
    },
  });
}
