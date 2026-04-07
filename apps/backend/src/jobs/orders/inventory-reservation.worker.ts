import * as Sentry from "@sentry/node";
import { QueueEvents, Worker } from "bullmq";
import { env } from "../../config/env";
import { redisConnectionOptions } from "../../lib/redis/connection";
import { logger } from "../../lib/logger";
import { expireInventoryReservations } from "../../modules/orders/orders.service";
import {
  EXPIRE_INVENTORY_RESERVATIONS_JOB_NAME,
  inventoryReservationQueue,
  INVENTORY_RESERVATION_QUEUE_NAME,
  scheduleExpireInventoryReservations,
} from "./inventory-reservation.queue";
import { InventoryReservationJobPayload } from "./inventory-reservation.types";

Sentry.init({
  dsn: env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: env.NODE_ENV,
  enabled: !!env.SENTRY_DSN,
});

const worker = new Worker<InventoryReservationJobPayload>(
  INVENTORY_RESERVATION_QUEUE_NAME,
  async () => {
    const released = await expireInventoryReservations();
    return { released };
  },
  {
    connection: redisConnectionOptions,
    concurrency: env.ORDER_RESERVATION_WORKER_CONCURRENCY,
  },
);

const queueEvents = new QueueEvents(INVENTORY_RESERVATION_QUEUE_NAME, {
  connection: redisConnectionOptions,
});

worker.on("completed", (job, result) => {
  logger.info(
    {
      queue: INVENTORY_RESERVATION_QUEUE_NAME,
      jobName: job.name,
      jobId: job.id,
      released: result?.released ?? 0,
    },
    "Inventory reservation expiry job completed",
  );
});

worker.on("failed", (job, error) => {
  logger.error(
    {
      queue: INVENTORY_RESERVATION_QUEUE_NAME,
      jobName: job?.name,
      jobId: job?.id,
      attemptsMade: job?.attemptsMade,
      err: error,
    },
    "Inventory reservation expiry job failed",
  );

  Sentry.captureException(error, {
    tags: {
      queue: INVENTORY_RESERVATION_QUEUE_NAME,
      jobName: job?.name,
      jobId: job?.id,
    },
  });
});

queueEvents.on("stalled", ({ jobId }) => {
  logger.error(
    {
      queue: INVENTORY_RESERVATION_QUEUE_NAME,
      jobId,
    },
    "Inventory reservation expiry job stalled",
  );
});

async function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down inventory reservation worker");

  await worker.close();
  await queueEvents.close();
  await inventoryReservationQueue.close();

  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("unhandledRejection", (reason) => {
  logger.error(
    { err: reason },
    "Unhandled promise rejection in inventory worker",
  );
  Sentry.captureException(reason);
});

process.on("uncaughtException", (error) => {
  logger.error({ err: error }, "Uncaught exception in inventory worker");
  Sentry.captureException(error);
  void shutdown("uncaughtException");
});

async function start() {
  await scheduleExpireInventoryReservations(
    {},
    {
      jobId: EXPIRE_INVENTORY_RESERVATIONS_JOB_NAME,
    },
  );

  logger.info(
    {
      queue: INVENTORY_RESERVATION_QUEUE_NAME,
      concurrency: env.ORDER_RESERVATION_WORKER_CONCURRENCY,
      intervalMs: env.ORDER_RESERVATION_SWEEP_INTERVAL_MS,
    },
    "Inventory reservation worker started",
  );
}

void start();
