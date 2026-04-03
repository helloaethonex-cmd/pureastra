import crypto from "node:crypto";
import { env } from "../../../config/env";

const Razorpay = require("razorpay") as new (options: {
  key_id: string;
  key_secret: string;
}) => {
  orders: {
    create: (input: {
      amount: number;
      currency: string;
      receipt: string;
      notes?: Record<string, string>;
    }) => Promise<{ id: string }>;
  };
};

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

const safeEquals = (a: string, b: string) => {
  const aBuffer = Buffer.from(a, "utf8");
  const bBuffer = Buffer.from(b, "utf8");

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
};

export const createRazorpayOrder = async (input: {
  amountPaise: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}) => {
  return razorpay.orders.create({
    amount: input.amountPaise,
    currency: input.currency,
    receipt: input.receipt,
    notes: input.notes,
  });
};

export const verifyRazorpayCheckoutSignature = (input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) => {
  const payload = `${input.razorpayOrderId}|${input.razorpayPaymentId}`;

  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(payload)
    .digest("hex");

  return safeEquals(expectedSignature, input.razorpaySignature);
};

export const verifyRazorpayWebhookSignature = (rawBody: Buffer, signature: string) => {
  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  return safeEquals(expectedSignature, signature);
};
