import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import {
  confirmBuyNowCheckout,
  confirmCheckout,
  previewBuyNowCheckout,
  previewCheckout,
} from "./checkout.controller";

const router = Router();

/**
 * @openapi
 * /api/v1/checkout/preview:
 *   post:
 *     tags:
 *       - Checkout
 *     summary: Preview cart checkout
 *     description: >
 *       Generates a short-lived preview token for the authenticated user's active cart.
 *       Coupon fields are placeholders in v1 and always return `NOT_IMPLEMENTED`.
 *       Confirm must use `previewToken` and `Idempotency-Key`.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Checkout preview
 *       400:
 *         description: Invalid address, empty cart, invalid payload
 *       401:
 *         description: Unauthorized
 */
router.post("/preview", requireAuth, previewCheckout);

/**
 * @openapi
 * /api/v1/checkout/confirm:
 *   post:
 *     tags:
 *       - Checkout
 *     summary: Confirm cart checkout
 *     description: >
 *       Consumes a preview token atomically, revalidates stock/address/totals, creates
 *       order + payment attempt transactionally, and returns Razorpay checkout payload.
 *       Requires `Idempotency-Key` header for exact replay semantics.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Checkout confirmed
 *       400:
 *         description: Invalid preview token or payload
 *       409:
 *         description: Token consumed, hash mismatch, stock conflict
 */
router.post("/confirm", requireAuth, confirmCheckout);

/**
 * @openapi
 * /api/v1/checkout/buy-now/preview:
 *   post:
 *     tags:
 *       - Checkout
 *     summary: Preview buy-now checkout
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Buy-now preview generated
 */
router.post("/buy-now/preview", requireAuth, previewBuyNowCheckout);

/**
 * @openapi
 * /api/v1/checkout/buy-now/confirm:
 *   post:
 *     tags:
 *       - Checkout
 *     summary: Confirm buy-now checkout
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Buy-now checkout confirmed
 */
router.post("/buy-now/confirm", requireAuth, confirmBuyNowCheckout);

export default router;

