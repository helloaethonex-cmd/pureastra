import { z } from "zod";

export const createPaymentAttemptBodySchema = z.object({
  paymentProvider: z.string().trim().min(1),
  paymentMethod: z.string().trim().min(1).optional(),
  providerIntentRef: z.string().trim().min(1).optional(),
});

export const createPaymentAttemptParamsSchema = z.object({
  id: z.coerce.bigint(),
});

export const confirmPaymentParamsSchema = z.object({
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

export type CreatePaymentAttemptBody = z.infer<typeof createPaymentAttemptBodySchema>;
export type ConfirmPaymentBody = z.infer<typeof confirmPaymentBodySchema>;

