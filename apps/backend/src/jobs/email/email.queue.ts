import { JobsOptions, Queue } from "bullmq";
import { env } from "../../config/env";
import { redisConnectionOptions } from "../../lib/redis/connection";
import { EmailJobPayload, emailJobPayloadSchema } from "./email.types";

const EMAIL_JOB_NAME = "send-email";

export const emailQueue = new Queue<
  EmailJobPayload,
  void,
  typeof EMAIL_JOB_NAME
>(env.EMAIL_QUEUE_NAME, {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: 1000,
    removeOnFail: 5050,
  },
});

export async function enqueueEmail(
  payload: EmailJobPayload,
  options?: JobsOptions,
) {
  const validatedPayload = emailJobPayloadSchema.parse(payload);

  return emailQueue.add(EMAIL_JOB_NAME, validatedPayload, options);
}
