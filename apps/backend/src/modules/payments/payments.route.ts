import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import {
  confirmPayment,
  createOrderPaymentAttempt,
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
 *                 description: Payment gateway provider (e.g., "stripe", "razorpay")
 *                 example: "stripe"
 *               paymentMethod:
 *                 type: string
 *                 description: Payment method type (e.g., "card", "upi", "netbanking")
 *                 example: "card"
 *               providerIntentRef:
 *                 type: string
 *                 description: Payment intent ID from the provider (if pre-created)
 *                 example: "pi_3N1234567890"
 *           example:
 *             paymentProvider: "stripe"
 *             paymentMethod: "card"
 *             providerIntentRef: "pi_3N1234567890"
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
 *                   example: "stripe"
 *                 paymentMethod:
 *                   type: string
 *                   nullable: true
 *                   example: "card"
 *                 paymentIntentId:
 *                   type: string
 *                   nullable: true
 *                   example: "pi_3N1234567890"
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
 * /api/v1/payments/{id}/confirm:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Confirm payment result (Webhook)
 *     description: >
 *       Called by payment gateway webhooks to confirm the result of a payment
 *       attempt. This endpoint updates the payment status and, if successful,
 *       updates the order's `totalPaid` and potentially advances the order status.
 *
 *
 *       **Authentication:** Requires `x-payment-webhook-secret` header matching
 *       the server's configured `PAYMENT_WEBHOOK_SECRET`. This is NOT a user-facing
 *       endpoint.
 *
 *
 *       **Idempotent behavior:**
 *       - If payment is already SUCCESS or FAILED, returns existing payment unchanged
 *       - If order already has a successful payment from another attempt, returns unchanged
 *       - If order is already fully paid, returns unchanged
 *
 *
 *       **On SUCCESS confirmation:**
 *       - Payment status → SUCCESS
 *       - Order `totalPaid` incremented by payment amount
 *       - If fully paid: Order `paymentStatus` → SUCCESS
 *       - If order was PLACED: Order status → CONFIRMED (auto-advance)
 *       - Inventory reservations marked as CONFIRMED
 *       - Status history entry created
 *
 *
 *       **On FAILED confirmation:**
 *       - Payment status → FAILED
 *       - `failureReason` stored if provided
 *       - Order remains unchanged
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment attempt ID
 *         example: "15"
 *       - in: header
 *         name: x-payment-webhook-secret
 *         required: true
 *         schema:
 *           type: string
 *         description: Webhook authentication secret
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [SUCCESS, FAILED]
 *                 description: Payment result status
 *               gatewayTransactionId:
 *                 type: string
 *                 description: Transaction ID from payment gateway (required for SUCCESS)
 *                 example: "txn_3N1234567890"
 *               providerEventId:
 *                 type: string
 *                 description: Webhook event ID from provider (for idempotency tracking)
 *                 example: "evt_3N1234567890"
 *               failureReason:
 *                 type: string
 *                 description: Reason for payment failure (for FAILED status)
 *                 example: "card_declined"
 *           examples:
 *             success:
 *               summary: Successful payment
 *               value:
 *                 status: "SUCCESS"
 *                 gatewayTransactionId: "txn_3N1234567890"
 *                 providerEventId: "evt_3N1234567890"
 *             failed:
 *               summary: Failed payment
 *               value:
 *                 status: "FAILED"
 *                 failureReason: "card_declined"
 *                 providerEventId: "evt_3N9876543210"
 *     responses:
 *       200:
 *         description: Payment confirmation processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "15"
 *                 orderId:
 *                   type: string
 *                   example: "42"
 *                 paymentProvider:
 *                   type: string
 *                   example: "stripe"
 *                 paymentMethod:
 *                   type: string
 *                   nullable: true
 *                   example: "card"
 *                 amount:
 *                   type: string
 *                   example: "1299.99"
 *                 paymentStatus:
 *                   type: integer
 *                   description: "0=PENDING, 1=SUCCESS, 2=FAILED, 3=REFUNDED"
 *                   example: 1
 *                 gatewayTransactionId:
 *                   type: string
 *                   nullable: true
 *                   example: "txn_3N1234567890"
 *                 failureReason:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *                 paidAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: >
 *           Invalid request - possible reasons:
 *           - Invalid payment ID format
 *           - Missing required fields (status, gatewayTransactionId for SUCCESS)
 *           - Invalid status value (not SUCCESS or FAILED)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingGatewayId:
 *                 summary: Missing gateway transaction ID
 *                 value:
 *                   error: "Invalid request payload"
 *                   details: [{ "path": ["gatewayTransactionId"], "message": "gatewayTransactionId is required for SUCCESS confirmation" }]
 *       401:
 *         description: Invalid or missing webhook secret
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Invalid webhook secret"
 *       404:
 *         description: Payment attempt not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Payment not found"
 *               code: "PAYMENT_NOT_FOUND"
 *       409:
 *         description: Payment amount exceeds current outstanding (stale attempt)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Payment attempt amount exceeds current outstanding amount"
 *               code: "STALE_PAYMENT_ATTEMPT"
 */
router.post("/payments/:id/confirm", confirmPayment);

export default router;
