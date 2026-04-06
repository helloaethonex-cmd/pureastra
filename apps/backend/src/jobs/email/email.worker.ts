import { QueueEvents, Worker } from "bullmq";
import { env } from "../../config/env";
import { logger } from "../../lib/logger";
import { sendMail } from "../../lib/mailer/mailer";
import { redisConnectionOptions } from "../../lib/redis/connection";
import { EmailJobPayload } from "./email.types";

const worker = new Worker<EmailJobPayload>(
  env.EMAIL_QUEUE_NAME,
  async (job) => {
    await sendMail(job.data);

    return { sent: true, to: job.data.to };
  },
  {
    connection: redisConnectionOptions,
    concurrency: env.EMAIL_WORKER_CONCURRENCY,
  },
);

const queueEvents = new QueueEvents(env.EMAIL_QUEUE_NAME, {
  connection: redisConnectionOptions,
});

worker.on("completed", (job) => {
  logger.info({
    queue: env.EMAIL_QUEUE_NAME,
    jobId: job.id,
  }, "Email job completed");
});

worker.on("failed", (job, error) => {
  logger.error({
    queue: env.EMAIL_QUEUE_NAME,
    jobId: job?.id,
    attemptsMade: job?.attemptsMade,
    err: error,
  }, "Email job failed");
});

queueEvents.on("stalled", ({ jobId }) => {
  logger.error({
    queue: env.EMAIL_QUEUE_NAME,
    jobId,
  }, "Email job stalled");
});

async function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down email worker");

  await worker.close();
  await queueEvents.close();

  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

logger.info({
  queue: env.EMAIL_QUEUE_NAME,
  concurrency: env.EMAIL_WORKER_CONCURRENCY,
}, "Email worker started");
