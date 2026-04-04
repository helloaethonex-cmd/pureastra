"use client";

import { useMutation } from "@tanstack/react-query";
import {
  confirmCheckout,
  getOrderDetail,
  listMyAddresses,
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
    const existing = document.querySelector(`script[src=\"${RAZORPAY_CHECKOUT_SCRIPT}\"]`);
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

export const useCheckout = () => {
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      await ensureRazorpayLoaded();

      const addresses = await listMyAddresses();
      const selectedAddress = addresses.find((address) => address.isDefault) ?? addresses[0];

      if (!selectedAddress) {
        throw new Error("Please add a delivery address before checkout");
      }

      const checkoutPreview = await previewCheckout({
        addressId: selectedAddress.id,
      });

      const checkoutResult = await confirmCheckout(
        {
          previewToken: checkoutPreview.previewToken,
        },
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

      return {
        orderNumber: order.orderNumber,
      };
    },
  });
};
