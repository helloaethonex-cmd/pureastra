import { JobsOptions, Queue } from "bullmq";
import { env } from "../../config/env";
import { redisConnectionOptions } from "../../lib/redis/connection";
import {
  InventoryReconciliationJobPayload,
  inventoryReconciliationJobPayloadSchema,
} from "./inventory-reconciliation.types";

export const INVENTORY_RECONCILIATION_QUEUE_NAME =
  "inventory-reconciliation-queue";
export const RECONCILE_INVENTORY_RESERVATIONS_JOB_NAME =
  "reconcile-inventory-reservations";

export const inventoryReconciliationQueue = new Queue<
  InventoryReconciliationJobPayload,
  { mismatches: number; lowStock: number },
  typeof RECONCILE_INVENTORY_RESERVATIONS_JOB_NAME
>(INVENTORY_RECONCILIATION_QUEUE_NAME, {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});

export async function scheduleInventoryReconciliation(
  payload: InventoryReconciliationJobPayload = {},
  options?: JobsOptions,
) {
  const validatedPayload =
    inventoryReconciliationJobPayloadSchema.parse(payload);

  return inventoryReconciliationQueue.add(
    RECONCILE_INVENTORY_RESERVATIONS_JOB_NAME,
    validatedPayload,
    {
      jobId: RECONCILE_INVENTORY_RESERVATIONS_JOB_NAME,
      repeat: {
        every: env.ORDER_RESERVATION_SWEEP_INTERVAL_MS,
      },
      ...options,
    },
  );
}
