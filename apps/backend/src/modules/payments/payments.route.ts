import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import {
  createOrderPaymentAttempt,
  handleRazorpayWebhook,
  verifyRazorpayPayment,
} from "./payments.controller";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/v1/orders/{id}/payments:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Create payment attempt for an order
 *     description: >
 *       Creates a new payment attempt for the specified order. The payment amount
 *       is automatically calculated as the outstanding balance (grand total minus
 *       already paid amount).
 *
 *
 *       **Idempotency:** The `Idempotency-Key` header is required. If a payment
 *       attempt with the same key already exists for this order, the existing
 *       payment is returned instead of creating a duplicate.
 *
 *
 *       **Validations:**
 *       - Order must exist and belong to the authenticated user
 *       - Order must not be cancelled
 *       - Order must have an outstanding balance (not fully paid)
 *
 *
 *       **Requires authentication.**
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID (internal numeric ID)
 *         example: "42"
 *       - in: header
 *         name: Idempotency-Key
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique key to prevent duplicate payment attempts (e.g., UUID)
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentProvider
 *             properties:
*               paymentProvider:
*                 type: string
*                 description: Payment gateway provider (currently "razorpay")
*                 example: "razorpay"
*               paymentMethod:
*                 type: string
*                 description: Payment method type (e.g., "card", "upi", "netbanking")
*                 example: "upi"
*               providerIntentRef:
*                 type: string
*                 description: Provider order/intent reference (if pre-created)
*                 example: "order_QF2cN5k8vP3rT1"
*           example:
*             paymentProvider: "razorpay"
*             paymentMethod: "upi"
*             providerIntentRef: "order_QF2cN5k8vP3rT1"
 *     responses:
 *       201:
 *         description: Payment attempt created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Payment attempt ID
 *                   example: "15"
 *                 orderId:
 *                   type: string
 *                   description: Associated order ID
 *                   example: "42"
*                 paymentProvider:
*                   type: string
*                   example: "razorpay"
*                 paymentMethod:
*                   type: string
*                   nullable: true
*                   example: "upi"
*                 paymentIntentId:
*                   type: string
*                   nullable: true
*                   example: "order_QF2cN5k8vP3rT1"
 *                 idempotencyKey:
 *                   type: string
 *                   example: "550e8400-e29b-41d4-a716-446655440000"
 *                 amount:
 *                   type: string
 *                   description: Payment amount in decimal format
 *                   example: "1299.99"
 *                 paymentStatus:
 *                   type: integer
 *                   description: "0=PENDING, 1=SUCCESS, 2=FAILED, 3=REFUNDED"
 *                   example: 0
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       200:
 *         description: Existing payment returned (idempotent replay or already successful)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentAttempt'
 *       400:
 *         description: >
 *           Invalid request - possible reasons:
 *           - Missing Idempotency-Key header
 *           - Invalid request body (missing paymentProvider, invalid format)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingIdempotencyKey:
 *                 summary: Missing idempotency key
 *                 value:
 *                   error: "Idempotency-Key header is required"
 *               validationError:
 *                 summary: Validation error
 *                 value:
 *                   error: "Invalid request payload"
 *                   details: [{ "path": ["paymentProvider"], "message": "Required" }]
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Order not found or does not belong to user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Order not found"
 *               code: "ORDER_NOT_FOUND"
 *       409:
 *         description: >
 *           Conflict - possible reasons:
 *           - Order is cancelled
 *           - Order is already fully paid
 *           - Concurrent payment conflict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               orderCancelled:
 *                 summary: Order cancelled
 *                 value:
 *                   error: "Cannot create payment for cancelled order"
 *                   code: "ORDER_CANCELLED"
 *               alreadyPaid:
 *                 summary: Already paid
 *                 value:
 *                   error: "Order is already fully paid"
 *                   code: "ORDER_ALREADY_PAID"
 *               concurrentConflict:
 *                 summary: Concurrent conflict
 *                 value:
 *                   error: "Concurrent payment conflict, please retry"
 */
router.post("/orders/:id/payments", requireAuth, createOrderPaymentAttempt);

/**
 * @openapi
 * /api/v1/payments/{id}/razorpay/verify:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Verify Razorpay checkout success payload
 *     description: >
 *       Verifies checkout signature (`order_id|payment_id`) using Razorpay secret
 *       and marks the payment attempt successful in an idempotent transaction.
 *       **Requires authentication.**
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - razorpayOrderId
 *               - razorpayPaymentId
 *               - razorpaySignature
 *             properties:
 *               razorpayOrderId:
 *                 type: string
 *               razorpayPaymentId:
 *                 type: string
 *               razorpaySignature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified and processed
 *       401:
 *         description: Unauthorized or invalid signature
 *       409:
 *         description: Stale/mismatched payment attempt
 */
router.post("/payments/:id/razorpay/verify", requireAuth, verifyRazorpayPayment);

/**
 * @openapi
 * /api/v1/payments/webhooks/razorpay:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Razorpay webhook receiver
 *     description: >
 *       Verifies Razorpay webhook signature from raw request body and processes
 *       payment success/failure idempotently using provider event dedupe.
 *     parameters:
 *       - in: header
 *         name: x-razorpay-signature
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event acknowledged
 *       401:
 *         description: Invalid signature
 *       400:
 *         description: Invalid webhook payload
 */
router.post("/payments/webhooks/razorpay", handleRazorpayWebhook);

export default router;
