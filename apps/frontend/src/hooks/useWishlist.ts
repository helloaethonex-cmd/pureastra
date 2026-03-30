"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addWishlistItem,
  getWishlist,
  moveWishlistItemToCart,
  removeWishlistItem,
} from "@/services/api";

export function useWishlist(enabled = true) {
  return useQuery({
    queryKey: ["wishlist"],
    queryFn: getWishlist,
    enabled,
    staleTime: 1000 * 60,
  });
}

export function useAddWishlistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productVariantId }: { productVariantId: string }) =>
      addWishlistItem({ productVariantId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}

export function useRemoveWishlistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productVariantId: string) => removeWishlistItem(productVariantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}

export function useMoveWishlistItemToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productVariantId: string) => moveWishlistItemToCart(productVariantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}
