import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import {
  createOrder,
  getMyOrders,
  getMyOrderDetail,
} from "./orders.controller";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// USER ORDER ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/v1/orders:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Place a new order
 *     description: >
 *       Creates a new order from the user's active cart. The cart must contain
 *       at least one item. Inventory is reserved for each item and the cart is
 *       marked as checked out. An order number is generated in the format
 *       `PA-YYYY-NNNNNN`. **Requires authentication.**
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderBody'
 *           example:
 *             addressId: "5"
 *             note: "Please leave at the door"
 *     responses:
 *       201:
 *         description: Order placed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Cart is empty or invalid address
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
 *       409:
 *         description: Insufficient stock or concurrent checkout conflict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", requireAuth, createOrder);

/**
 * @openapi
 * /api/v1/orders:
 *   get:
 *     tags:
 *       - Orders
 *     summary: List my orders
 *     description: >
 *       Returns a paginated list of orders for the authenticated user.
 *       Orders are sorted by creation date (newest first). Response is
 *       lightweight and does not include item details. **Requires authentication.**
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
 *           maximum: 50
 *           default: 10
 *         description: Number of orders per page
 *     responses:
 *       200:
 *         description: Paginated list of user orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OrderListItem'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", requireAuth, getMyOrders);

/**
 * @openapi
 * /api/v1/orders/{orderNumber}:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get order details
 *     description: >
 *       Returns full details of a specific order including items, payment
 *       attempts, and status history. Only the order owner can access this
 *       endpoint. Returns 404 if order not found or belongs to another user.
 *       **Requires authentication.**
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
 *     responses:
 *       200:
 *         description: Full order details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderDetail'
 *       400:
 *         description: Invalid order number format
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
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:orderNumber", requireAuth, getMyOrderDetail);

export default router;
