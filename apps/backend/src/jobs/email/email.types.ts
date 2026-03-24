import { z } from "zod";

export const emailJobMetaSchema = z
  .object({
    template: z.string().min(1).optional(),
    correlationId: z.string().min(1).optional(),
    source: z.string().min(1).optional(),
  })
  .optional();

export const emailJobPayloadSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  html: z.string().min(1),
  text: z.string().min(1).optional(),
  meta: emailJobMetaSchema,
});

export type EmailJobPayload = z.infer<typeof emailJobPayloadSchema>;
