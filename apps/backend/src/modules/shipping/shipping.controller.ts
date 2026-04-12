import { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../../lib/errors/app-error";
import {
  generateSingleShippingLabel,
  generateBulkShippingLabels,
} from "./shipping.service";

// ─────────────────────────────────────────────────────────────────────────────
// ERROR HANDLER
// ─────────────────────────────────────────────────────────────────────────────

const handleError = (req: Request, res: Response, err: unknown) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }
  req.log.error({ err }, "Shipping label operation failed");
  return res.status(500).json({ error: "Internal server error" });
};

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

const singleLabelParamsSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "Order ID must be a positive integer")
    .transform((v) => BigInt(v)),
});

const bulkLabelBodySchema = z.object({
  orderIds: z
    .array(
      z
        .number()
        .int()
        .positive("Each order ID must be a positive integer"),
    )
    .min(1, "At least one order ID is required")
    .max(50, "Maximum 50 order IDs per bulk request"),
});

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE LABEL
// GET /api/v1/admin/orders/:id/shipping-label
// ─────────────────────────────────────────────────────────────────────────────

export const adminGetShippingLabel = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const parsed = singleLabelParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid order ID",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const pdfBuffer = await generateSingleShippingLabel(parsed.data.id);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="shipping-label-${req.params.id}.pdf"`,
      "Content-Length": pdfBuffer.length,
      // Prevent caching of shipping labels
      "Cache-Control": "no-store",
    });
    res.end(pdfBuffer);
  } catch (err) {
    handleError(req, res, err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BULK LABELS
// POST /api/v1/admin/orders/shipping-labels
// ─────────────────────────────────────────────────────────────────────────────

export const adminGetBulkShippingLabels = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const parsed = bulkLabelBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const orderIds = parsed.data.orderIds.map((id) => BigInt(id));
    const { buffer, skipped } = await generateBulkShippingLabels(orderIds);

    // Include skipped orders in a response header for logging/debugging
    // without blocking the PDF stream response.
    if (skipped.length > 0) {
      res.set(
        "X-Skipped-Orders",
        JSON.stringify(skipped),
      );
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="shipping-labels-bulk.pdf"`,
      "Content-Length": buffer.length,
      "Cache-Control": "no-store",
    });
    res.end(buffer);
  } catch (err) {
    handleError(req, res, err);
  }
};
