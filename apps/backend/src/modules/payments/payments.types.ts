import { z } from "zod";

export const createPaymentAttemptBodySchema = z.object({
  paymentProvider: z.string().trim().min(1).optional(),
  paymentMethod: z.string().trim().min(1).optional(),
  providerIntentRef: z.string().trim().min(1).optional(),
});

export const createPaymentAttemptParamsSchema = z.object({
  id: z.coerce.bigint(),
});

export const confirmPaymentBodySchema = z
  .object({
    status: z.enum(["SUCCESS", "FAILED"]),
    gatewayTransactionId: z.string().trim().min(1).optional(),
    providerEventId: z.string().trim().min(1).optional(),
    failureReason: z.string().trim().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.status === "SUCCESS" && !value.gatewayTransactionId) {
      ctx.addIssue({
        code: "custom",
        message: "gatewayTransactionId is required for SUCCESS confirmation",
        path: ["gatewayTransactionId"],
      });
    }
  });

export const razorpayVerifyParamsSchema = z.object({
  id: z.coerce.bigint(),
});

export const razorpayVerifyBodySchema = z.object({
  razorpayOrderId: z.string().trim().min(1),
  razorpayPaymentId: z.string().trim().min(1),
  razorpaySignature: z.string().trim().min(1),
});

export type CreatePaymentAttemptBody = z.infer<typeof createPaymentAttemptBodySchema>;
export type ConfirmPaymentBody = z.infer<typeof confirmPaymentBodySchema> & {
  providerOrderId?: string;
  providerPaymentId?: string;
  providerSignature?: string;
};
export type RazorpayVerifyBody = z.infer<typeof razorpayVerifyBodySchema>;
