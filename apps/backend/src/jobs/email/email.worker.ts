import "dotenv/config";
import { QueueEvents, Worker } from "bullmq";
import { env } from "../../config/env";
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
  console.log("Email job completed", {
    queue: env.EMAIL_QUEUE_NAME,
    jobId: job.id,
  });
});

worker.on("failed", (job, error) => {
  console.error("Email job failed", {
    queue: env.EMAIL_QUEUE_NAME,
    jobId: job?.id,
    attemptsMade: job?.attemptsMade,
    error: error.message,
  });
});

queueEvents.on("stalled", ({ jobId }) => {
  console.error("Email job stalled", {
    queue: env.EMAIL_QUEUE_NAME,
    jobId,
  });
});

async function shutdown(signal: string) {
  console.log("Shutting down email worker", { signal });

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

console.log("Email worker started", {
  queue: env.EMAIL_QUEUE_NAME,
  concurrency: env.EMAIL_WORKER_CONCURRENCY,
});
