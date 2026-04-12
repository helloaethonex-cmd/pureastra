import { z } from "zod";

export const inventoryReconciliationJobPayloadSchema = z.object({});

export type InventoryReconciliationJobPayload = z.infer<
  typeof inventoryReconciliationJobPayloadSchema
>;

