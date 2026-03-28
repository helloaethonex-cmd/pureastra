import { z } from "zod";

export const ORDER_STATUS = {
  PLACED: 0,
  CONFIRMED: 1,
  PACKED: 2,
  SHIPPED: 3,
  DELIVERED: 4,
  CANCELLED: 5,
} as const;

export const PAYMENT_STATUS = {
  PENDING: 0,
  SUCCESS: 1,
  FAILED: 2,
  REFUNDED: 3,
} as const;

export const INVENTORY_RESERVATION_STATUS = {
  ACTIVE: 0,
  CONFIRMED: 1,
  RELEASED: 2,
  EXPIRED: 3,
} as const;

export const CART_STATUS = {
  ACTIVE: 0,
  CHECKED_OUT: 1,
  ABANDONED: 2,
} as const;

export const createOrderSchema = z.object({
  addressId: z.coerce.bigint(),
  note: z.string().trim().max(500).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

