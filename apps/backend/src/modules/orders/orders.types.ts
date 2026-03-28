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

/**
 * Defines valid order status transitions.
 * Key = current status, Value = array of allowed next statuses
 */
export const STATUS_TRANSITIONS: Record<number, number[]> = {
  [ORDER_STATUS.PLACED]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PACKED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PACKED]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.CANCELLED]: [],
} as const;

export const createOrderSchema = z.object({
  addressId: z.coerce.bigint(),
  note: z.string().trim().max(500).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
  newStatus: z.number().int().min(0).max(5),
  note: z.string().trim().max(500).optional(),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const adminListOrdersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  orderStatus: z.coerce.number().int().min(0).max(5).optional(),
  paymentStatus: z.coerce.number().int().min(0).max(3).optional(),
  search: z.string().trim().max(50).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type AdminListOrdersInput = z.infer<typeof adminListOrdersSchema>;

export const userListOrdersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type UserListOrdersInput = z.infer<typeof userListOrdersSchema>;
