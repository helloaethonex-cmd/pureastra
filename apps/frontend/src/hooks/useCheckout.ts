"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  confirmBuyNowCheckout,
  confirmCheckout,
  getOrderDetail,
  listMyAddresses,
  previewBuyNowCheckout,
  previewCheckout,
  verifyRazorpayPayment,
} from "@/services/api";
import { useAuthStore } from "@/store/auth.store";

const RAZORPAY_CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

const generateIdempotencyKey = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const ensureRazorpayLoaded = async () => {
  if (window.Razorpay) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${RAZORPAY_CHECKOUT_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay checkout")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout"));
    document.body.appendChild(script);
  });
};

const waitForPaymentConfirmation = async (orderNumber: string) => {
  const attempts = 8;
  const delayMs = 1500;

  for (let index = 0; index < attempts; index += 1) {
    const detail = await getOrderDetail(orderNumber);
    if (detail.paymentStatus === 1) {
      return;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, delayMs);
    });
  }

  throw new Error("Payment verification is still processing. Please check your order history shortly.");
};

// ── Fetch saved addresses ─────────────────────────────────────────────────────

export const useMyAddresses = (enabled = true) =>
  useQuery({
    queryKey: ["addresses"],
    queryFn: listMyAddresses,
    enabled,
    staleTime: 1000 * 60 * 2,
  });

// ── Fetch real checkout preview from the backend ──────────────────────────────

export const useCheckoutPreview = (addressId: string | null, enabled: boolean) =>
  useQuery({
    queryKey: ["checkoutPreview", addressId],
    queryFn: () => previewCheckout({ addressId: addressId! }),
    enabled: Boolean(addressId) && enabled,
    staleTime: 0,
    retry: false,
  });

// ── Confirm + open Razorpay ───────────────────────────────────────────────────

export const useCheckout = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      addressId,
      referralCode,
    }: {
      addressId: string;
      referralCode?: string;
    }) => {
      await ensureRazorpayLoaded();

      const checkoutPreview = await previewCheckout({
        addressId,
        referralCode,
      });

      const checkoutResult = await confirmCheckout(
        { previewToken: checkoutPreview.previewToken },
        generateIdempotencyKey(),
      );

      const { order, payment: paymentAttempt } = checkoutResult;

      if (!paymentAttempt.razorpayOrderId) {
        throw new Error("Payment provider order was not created");
      }

      const RazorpayCheckout = window.Razorpay;
      if (!RazorpayCheckout) {
        throw new Error("Razorpay checkout not available");
      }
      const razorpayOrderId = paymentAttempt.razorpayOrderId;

      await new Promise<void>((resolve, reject) => {
        const razorpay = new RazorpayCheckout({
          key: paymentAttempt.razorpayKeyId,
          amount: paymentAttempt.amountPaise,
          currency: paymentAttempt.currency,
          order_id: razorpayOrderId,
          name: "Pureastra",
          description: `Order ${order.orderNumber}`,
          prefill: {
            name: user?.name,
            email: user?.email,
          },
          notes: {
            orderNumber: order.orderNumber,
            paymentAttemptId: paymentAttempt.paymentAttemptId,
          },
          handler: async (response) => {
            try {
              await verifyRazorpayPayment(paymentAttempt.paymentAttemptId, {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });

              await waitForPaymentConfirmation(order.orderNumber);
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled")),
          },
          theme: {
            color: "#819744",
          },
        });

        razorpay.open();
      });

      // Invalidate cart so it refetches as empty after checkout
      await queryClient.invalidateQueries({ queryKey: ["cart"] });

      return {
        orderNumber: order.orderNumber,
      };
    },
  });
};

// ── Buy Now: skip cart, go straight to Razorpay ───────────────────────────────

export const useBuyNowCheckout = () => {
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      productVariantId,
      quantity,
      addressId,
      referralCode,
    }: {
      productVariantId: string;
      quantity: number;
      addressId: string;
      referralCode?: string;
    }) => {
      await ensureRazorpayLoaded();

      const checkoutPreview = await previewBuyNowCheckout({
        productVariantId,
        quantity,
        addressId,
        referralCode,
      });

      const checkoutResult = await confirmBuyNowCheckout(
        { previewToken: checkoutPreview.previewToken },
        generateIdempotencyKey(),
      );

      const { order, payment: paymentAttempt } = checkoutResult;

      if (!paymentAttempt.razorpayOrderId) {
        throw new Error("Payment provider order was not created");
      }

      const RazorpayCheckout = window.Razorpay;
      if (!RazorpayCheckout) {
        throw new Error("Razorpay checkout not available");
      }
      const razorpayOrderId = paymentAttempt.razorpayOrderId;

      await new Promise<void>((resolve, reject) => {
        const razorpay = new RazorpayCheckout({
          key: paymentAttempt.razorpayKeyId,
          amount: paymentAttempt.amountPaise,
          currency: paymentAttempt.currency,
          order_id: razorpayOrderId,
          name: "Pureastra",
          description: `Order ${order.orderNumber}`,
          prefill: {
            name: user?.name,
            email: user?.email,
          },
          notes: {
            orderNumber: order.orderNumber,
            paymentAttemptId: paymentAttempt.paymentAttemptId,
          },
          handler: async (response) => {
            try {
              await verifyRazorpayPayment(paymentAttempt.paymentAttemptId, {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });

              await waitForPaymentConfirmation(order.orderNumber);
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled")),
          },
          theme: {
            color: "#819744",
          },
        });

        razorpay.open();
      });

      // Buy-now does NOT touch the cart — no invalidation needed.
      return {
        orderNumber: order.orderNumber,
      };
    },
  });
};
