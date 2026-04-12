import * as Sentry from "@sentry/node";
import { QueueEvents, Worker } from "bullmq";
import { env } from "../../config/env";
import { redisConnectionOptions } from "../../lib/redis/connection";
import { logger } from "../../lib/logger";
import { reconcileInventoryReservations } from "../../modules/orders/orders.service";
import {
  INVENTORY_RECONCILIATION_QUEUE_NAME,
  inventoryReconciliationQueue,
  RECONCILE_INVENTORY_RESERVATIONS_JOB_NAME,
  scheduleInventoryReconciliation,
} from "./inventory-reconciliation.queue";
import { InventoryReconciliationJobPayload } from "./inventory-reconciliation.types";

Sentry.init({
  dsn: env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: env.NODE_ENV,
  enabled: !!env.SENTRY_DSN,
});

const worker = new Worker<InventoryReconciliationJobPayload>(
  INVENTORY_RECONCILIATION_QUEUE_NAME,
  async () => {
    const result = await reconcileInventoryReservations();
    return result;
  },
  {
    connection: redisConnectionOptions,
    concurrency: 1,
  },
);

const queueEvents = new QueueEvents(INVENTORY_RECONCILIATION_QUEUE_NAME, {
  connection: redisConnectionOptions,
});

worker.on("completed", (job, result) => {
  logger.info(
    {
      queue: INVENTORY_RECONCILIATION_QUEUE_NAME,
      jobName: job.name,
      jobId: job.id,
      mismatches: result?.mismatches ?? 0,
      lowStock: result?.lowStock ?? 0,
    },
    "Inventory reconciliation job completed",
  );
});

worker.on("failed", (job, error) => {
  logger.error(
    {
      queue: INVENTORY_RECONCILIATION_QUEUE_NAME,
      jobName: job?.name,
      jobId: job?.id,
      attemptsMade: job?.attemptsMade,
      err: error,
    },
    "Inventory reconciliation job failed",
  );

  Sentry.captureException(error, {
    tags: {
      queue: INVENTORY_RECONCILIATION_QUEUE_NAME,
      jobName: job?.name,
      jobId: job?.id,
    },
  });
});

queueEvents.on("stalled", ({ jobId }) => {
  logger.error(
    {
      queue: INVENTORY_RECONCILIATION_QUEUE_NAME,
      jobId,
    },
    "Inventory reconciliation job stalled",
  );
});

async function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down inventory reconciliation worker");

  await worker.close();
  await queueEvents.close();
  await inventoryReconciliationQueue.close();

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
    "Unhandled promise rejection in inventory reconciliation worker",
  );
  Sentry.captureException(reason);
});

process.on("uncaughtException", (error) => {
  logger.error(
    { err: error },
    "Uncaught exception in inventory reconciliation worker",
  );
  Sentry.captureException(error);
  void shutdown("uncaughtException");
});

async function start() {
  await scheduleInventoryReconciliation(
    {},
    {
      jobId: RECONCILE_INVENTORY_RESERVATIONS_JOB_NAME,
    },
  );

  logger.info(
    {
      queue: INVENTORY_RECONCILIATION_QUEUE_NAME,
      intervalMs: env.ORDER_RESERVATION_SWEEP_INTERVAL_MS,
    },
    "Inventory reconciliation worker started",
  );
}

void start();
