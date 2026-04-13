"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addCartItem,
  clearCart,
  getCartWithGuestSession,
  removeCartItem,
  updateCartItemQuantity,
} from "@/services/api";
import { useAuthStore } from "@/store/auth.store";

export function useCart(enabled = true) {
  const isAuthenticated = useAuthStore((s) => Boolean(s.session));

  return useQuery({
    queryKey: ["cart"],
    queryFn: () =>
      getCartWithGuestSession({ includeGuestSession: !isAuthenticated }),
    enabled,
    retry: false,
    staleTime: 1000 * 30,
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => Boolean(s.session));

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      updateCartItemQuantity(itemId, quantity, {
        includeGuestSession: !isAuthenticated,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useAddCartItem() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => Boolean(s.session));

  return useMutation({
    mutationFn: (payload: { productVariantId: string; quantity: number }) =>
      addCartItem(payload, { includeGuestSession: !isAuthenticated }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => Boolean(s.session));

  return useMutation({
    mutationFn: (itemId: string) =>
      removeCartItem(itemId, { includeGuestSession: !isAuthenticated }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => Boolean(s.session));

  return useMutation({
    mutationFn: () => clearCart({ includeGuestSession: !isAuthenticated }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}
