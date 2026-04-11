import { Router } from "express";
import { requireAuth, requireRole } from "../auth/auth.middleware";
import {
  getOrderInvoice,
  adminGetOrderInvoice,
  adminRegeneratePdf,
} from "./invoices.controller";

// ─────────────────────────────────────────────────────────────────────────────
// USER ROUTES — mounted under /orders
// ─────────────────────────────────────────────────────────────────────────────

export const invoiceUserRouter = Router();

/**
 * @openapi
 * /api/v1/orders/{orderNumber}/invoice:
 *   get:
 *     tags:
 *       - Invoices
 *     summary: Get invoice for an order
 *     description: >
 *       Returns the GST-compliant invoice for the specified order.
 *       Only the order owner can access this. Returns 404 if no invoice
 *       exists (e.g., order is unpaid). **Requires authentication.**
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Order number (e.g., PA-2026-000001)
 *     responses:
 *       200:
 *         description: Invoice data
 *       404:
 *         description: Order or invoice not found
 *       401:
 *         description: Not authenticated
 */
invoiceUserRouter.get(
  "/:orderNumber/invoice",
  requireAuth,
  getOrderInvoice,
);

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES — mounted under /admin/orders
// ─────────────────────────────────────────────────────────────────────────────

export const invoiceAdminRouter = Router();

/**
 * @openapi
 * /api/v1/admin/orders/{orderNumber}/invoice:
 *   get:
 *     tags:
 *       - Admin - Invoices
 *     summary: Get invoice for any order (admin)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice data
 *       404:
 *         description: Order or invoice not found
 */
invoiceAdminRouter.get(
  "/:orderNumber/invoice",
  requireAuth,
  requireRole("admin"),
  adminGetOrderInvoice,
);

/**
 * @openapi
 * /api/v1/admin/orders/{orderNumber}/invoice/regenerate-pdf:
 *   post:
 *     tags:
 *       - Admin - Invoices
 *     summary: Regenerate invoice PDF
 *     description: >
 *       Triggers async PDF regeneration for an existing invoice.
 *       Use when PDF generation initially failed (pdfUrl is null).
 *       **Requires admin role.**
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       202:
 *         description: PDF regeneration started
 *       404:
 *         description: Order or invoice not found
 */
invoiceAdminRouter.post(
  "/:orderNumber/invoice/regenerate-pdf",
  requireAuth,
  requireRole("admin"),
  adminRegeneratePdf,
);
