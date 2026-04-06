import { Router } from "express";
import { requireAuth, requireRole } from "../auth/auth.middleware";
import { listOrders, updateOrderStatus } from "./orders.controller";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ORDER ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/v1/admin/orders:
 *   get:
 *     tags:
 *       - Admin - Orders
 *     summary: List all orders (Admin)
 *     description: >
 *       Returns a paginated list of all orders in the system. Supports filtering
 *       by order status, payment status, and searching by order number. Results
 *       are sorted by creation date. **Requires ADMIN role.**
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of orders per page
 *       - in: query
 *         name: orderStatus
 *         schema:
 *           type: integer
 *           enum: [0, 1, 2, 3, 4, 5]
 *         description: >
 *           Filter by order status:
 *           0=PLACED, 1=CONFIRMED, 2=PACKED, 3=SHIPPED, 4=DELIVERED, 5=CANCELLED
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: integer
 *           enum: [0, 1, 2, 3]
 *         description: >
 *           Filter by payment status:
 *           0=PENDING, 1=SUCCESS, 2=FAILED, 3=REFUNDED
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 50
 *         description: Search by order number (case-insensitive partial match)
 *         example: "PA-2026"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort direction by creation date
 *     responses:
 *       200:
 *         description: Paginated list of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AdminOrderListItem'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - requires ADMIN role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", requireAuth, requireRole("admin"), listOrders);

/**
 * @openapi
 * /api/v1/admin/orders/{orderNumber}/status:
 *   patch:
 *     tags:
 *       - Admin - Orders
 *     summary: Update order status (Admin)
 *     description: >
 *       Updates the status of an order. Status transitions are strictly enforced:
 *
 *       **Valid transitions:**
 *       - PLACED(0) → CONFIRMED(1) or CANCELLED(5)
 *       - CONFIRMED(1) → PACKED(2) or CANCELLED(5)
 *       - PACKED(2) → SHIPPED(3) or CANCELLED(5)
 *       - SHIPPED(3) → DELIVERED(4)
 *       - DELIVERED(4) → (terminal state)
 *       - CANCELLED(5) → (terminal state)
 *
 *       **Important behaviors:**
 *       - No skipping steps (e.g., PLACED → SHIPPED is invalid)
 *       - No backward transitions (e.g., SHIPPED → PACKED is invalid)
 *       - Cancellation is not allowed after SHIPPED
 *       - On SHIPPED: inventory is deducted (stockQuantity) and reserved stock is released
 *       - On CANCELLED (before shipped): reserved stock is released
 *       - All status changes are logged in order_status_history
 *
 *       **Requires ADMIN role.**
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Order number (e.g., PA-2026-000001)
 *         example: "PA-2026-000001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateOrderStatusBody'
 *           example:
 *             newStatus: 1
 *             note: "Order confirmed by admin"
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: >
 *           Invalid request - possible reasons:
 *           - Invalid order number format
 *           - Invalid status value
 *           - Order already in requested status
 *           - Invalid status transition
 *           - Cannot cancel after shipping
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - requires ADMIN role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Insufficient stock when transitioning to SHIPPED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/:orderNumber/status",
  requireAuth,
  requireRole("admin"),
  updateOrderStatus,
);

export default router;
