import { z } from "zod";

export const inventoryReservationJobPayloadSchema = z.object({});

export type InventoryReservationJobPayload = z.infer<
  typeof inventoryReservationJobPayloadSchema
>;

