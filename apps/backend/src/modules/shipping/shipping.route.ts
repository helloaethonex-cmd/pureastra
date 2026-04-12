import { Router } from "express";
import { requireAuth, requireRole } from "../auth/auth.middleware";
import {
  adminGetShippingLabel,
  adminGetBulkShippingLabels,
} from "./shipping.controller";

export const shippingAdminRouter = Router();

/**
 * @openapi
 * /api/v1/admin/orders/{id}/shipping-label:
 *   get:
 *     tags:
 *       - Admin - Shipping
 *     summary: Download shipping label PDF for a single order
 *     description: >
 *       Generates and downloads an A6 shipping label PDF for the specified order.
 *       Order must be in PLACED (0), CONFIRMED (1), or PACKED (2) status.
 *       **Requires admin role.**
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order database ID (numeric)
 *     responses:
 *       200:
 *         description: PDF shipping label
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Order not found
 *       422:
 *         description: Order status not valid for label generation
 */
shippingAdminRouter.get(
  "/:id/shipping-label",
  requireAuth,
  requireRole("admin"),
  adminGetShippingLabel,
);

/**
 * @openapi
 * /api/v1/admin/orders/shipping-labels:
 *   post:
 *     tags:
 *       - Admin - Shipping
 *     summary: Download bulk shipping labels PDF
 *     description: >
 *       Generates a single PDF containing shipping labels for multiple orders.
 *       Each label is on its own A6 page. Invalid orders are skipped and reported
 *       in the `X-Skipped-Orders` response header. Maximum 50 orders per request.
 *       **Requires admin role.**
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderIds
 *             properties:
 *               orderIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 minItems: 1
 *                 maxItems: 50
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Bulk PDF shipping labels
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           X-Skipped-Orders:
 *             description: JSON array of skipped orders with reasons
 *             schema:
 *               type: string
 *       400:
 *         description: Invalid request body
 *       422:
 *         description: No valid orders found
 */
shippingAdminRouter.post(
  "/shipping-labels",
  requireAuth,
  requireRole("admin"),
  adminGetBulkShippingLabels,
);
