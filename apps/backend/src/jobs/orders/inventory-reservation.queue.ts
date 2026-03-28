import { JobsOptions, Queue } from "bullmq";
import { env } from "../../config/env";
import { redisConnectionOptions } from "../../lib/redis/connection";
import {
  InventoryReservationJobPayload,
  inventoryReservationJobPayloadSchema,
} from "./inventory-reservation.types";

export const INVENTORY_RESERVATION_QUEUE_NAME = "inventory-reservation-queue";
export const EXPIRE_INVENTORY_RESERVATIONS_JOB_NAME = "expire-inventory-reservations";

export const inventoryReservationQueue = new Queue<
  InventoryReservationJobPayload,
  { released: number },
  typeof EXPIRE_INVENTORY_RESERVATIONS_JOB_NAME
>(INVENTORY_RESERVATION_QUEUE_NAME, {
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

export async function scheduleExpireInventoryReservations(
  payload: InventoryReservationJobPayload = {},
  options?: JobsOptions,
) {
  const validatedPayload = inventoryReservationJobPayloadSchema.parse(payload);

  return inventoryReservationQueue.add(
    EXPIRE_INVENTORY_RESERVATIONS_JOB_NAME,
    validatedPayload,
    {
      jobId: EXPIRE_INVENTORY_RESERVATIONS_JOB_NAME,
      repeat: {
        every: env.ORDER_RESERVATION_SWEEP_INTERVAL_MS,
      },
      ...options,
    },
  );
}

