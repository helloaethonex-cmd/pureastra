import { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client";
import { AppError } from "../../lib/errors/app-error";
import { prisma } from "../../lib/prisma";
import { logger } from "../../lib/logger";
import { getInvoiceByOrderId, generateInvoicePdf } from "./invoices.service";

// ─────────────────────────────────────────────────────────────────────────────
// ERROR HANDLER
// ─────────────────────────────────────────────────────────────────────────────

const handleError = (req: Request, res: Response, err: unknown) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }
  req.log.error({ err }, "Invoice operation failed");
  return res.status(500).json({ error: "Internal server error" });
};

// ─────────────────────────────────────────────────────────────────────────────
// USER — Get invoice for an order
// GET /api/v1/orders/:orderNumber/invoice
// Only the order owner can access this.
// ─────────────────────────────────────────────────────────────────────────────

export const getOrderInvoice = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { orderNumber } = req.params;
    if (typeof orderNumber !== "string") {
      return res.status(400).json({ error: "Invalid order number" });
    }

    // Verify order exists and belongs to the user
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: { id: true, userId: true },
    });

    if (!order || order.userId.toString() !== userId) {
      return res.status(404).json({ error: "Order not found" });
    }

    const invoice = await getInvoiceByOrderId(order.id);
    if (!invoice) {
      return res.status(404).json({
        error: "No invoice available for this order",
        code: "INVOICE_NOT_FOUND",
      });
    }

    return res.status(200).json(invoice);
  } catch (err) {
    return handleError(req, res, err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Get invoice for any order
// GET /api/v1/admin/orders/:orderNumber/invoice
// ─────────────────────────────────────────────────────────────────────────────

export const adminGetOrderInvoice = async (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;
    if (typeof orderNumber !== "string") {
      return res.status(400).json({ error: "Invalid order number" });
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: { id: true },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const invoice = await getInvoiceByOrderId(order.id);
    if (!invoice) {
      return res.status(404).json({
        error: "No invoice available for this order",
        code: "INVOICE_NOT_FOUND",
      });
    }

    return res.status(200).json(invoice);
  } catch (err) {
    return handleError(req, res, err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Regenerate PDF for an invoice
// POST /api/v1/admin/orders/:orderNumber/invoice/regenerate-pdf
// ─────────────────────────────────────────────────────────────────────────────

export const adminRegeneratePdf = async (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;
    if (typeof orderNumber !== "string") {
      return res.status(400).json({ error: "Invalid order number" });
    }

    // ?force=true bypasses the pdfStatus=GENERATED guard
    const force = req.query.force === "true";

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: { id: true },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { orderId: order.id },
      select: { id: true, invoiceNumber: true, pdfStatus: true },
    });

    if (!invoice) {
      return res.status(404).json({
        error: "No invoice exists for this order",
        code: "INVOICE_NOT_FOUND",
      });
    }

    // Guard: if PDF already generated, require explicit force=true
    if (invoice.pdfStatus === 1 && !force) {
      return res.status(409).json({
        error: "PDF already generated. Use ?force=true to regenerate.",
        code: "PDF_ALREADY_GENERATED",
        invoiceNumber: invoice.invoiceNumber,
      });
    }

    // Reset pdfStatus to PENDING before triggering regeneration
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { pdfStatus: 0, pdfUrl: null },
    });

    // Fire async PDF generation with force=true to bypass internal guard
    generateInvoicePdf(invoice.id, true).catch((err) => {
      logger.error(
        { invoiceId: invoice.id.toString(), err },
        "[invoice-pdf] admin regeneration failed",
      );
    });

    return res.status(202).json({
      message: "PDF regeneration started",
      invoiceNumber: invoice.invoiceNumber,
      force,
    });
  } catch (err) {
    return handleError(req, res, err);
  }
};
