import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { logger } from "../../lib/logger";
import { AppError } from "../../lib/errors/app-error";
import { uploadBufferToR2 } from "../../lib/r2";
import {
  incrementInvoiceNumberSequence,
  findInvoiceByOrderId,
  findInvoiceForApi,
  findInvoiceById,
  createInvoice,
  updateInvoicePdfUrl,
} from "./invoices.repository";
import {
  formatInvoiceNumber,
  computeGstBreakdown,
  PDF_STATUS,
  validateGstin,
} from "./invoices.types";

type TxClient = Prisma.TransactionClient;

// ─────────────────────────────────────────────────────────────────────────────
// TYPES (internal — shapes of data flowing into createInvoiceInTx)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The subset of Order fields needed to create an invoice.
 * Matches the `payment.order` include inside confirmPaymentAttempt.
 */
type OrderForInvoice = {
  id: bigint;
  shippingName: string;
  shippingPhone: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;
  productTotal: Prisma.Decimal;
  shippingAmount: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  discountAmount: Prisma.Decimal;
  totalPaid: Prisma.Decimal;
  items: {
    productName: string;
    variantName: string | null;
    sku: string | null;
    quantity: number;
    priceAtPurchase: Prisma.Decimal;
  }[];
};

type PaymentForInvoice = {
  paidAt: Date | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE INVOICE (inside Serializable TX)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates an immutable invoice record atomically inside the payment TX.
 *
 * Guarantees:
 *  - Idempotent: UNIQUE(order_id) + pre-check → safe on webhook retries.
 *  - issuedAt = payment.paidAt (legal requirement), NOT now().
 *  - All financial values are snapshots — never recomputed.
 *  - PDF is NOT generated here (too slow for Serializable TX).
 *    pdfUrl starts null; filled async in Phase 2.
 *
 * @throws AppError if payment.paidAt is null (defensive — should never happen).
 */
export const createInvoiceInTx = async (
  tx: TxClient,
  order: OrderForInvoice,
  payment: PaymentForInvoice,
) => {
  // ── Idempotency guard ─────────────────────────────────────────────────────
  const existing = await findInvoiceByOrderId(tx, order.id);
  if (existing) {
    logger.info(
      { orderId: order.id.toString(), invoiceNumber: existing.invoiceNumber },
      "[invoice] skipped — already exists (idempotent)",
    );
    return existing;
  }

  // ── Hard fail if paidAt is missing ────────────────────────────────────────
  if (!payment.paidAt) {
    throw new AppError(
      500,
      "Cannot create invoice — payment.paidAt is null",
      "INVOICE_MISSING_PAID_AT",
    );
  }

  // ── Validate GSTIN before creating invoice ────────────────────────────────
  const gstin = env.SELLER_GSTIN ?? "";
  if (gstin) {
    const gstinError = validateGstin(gstin.trim().toUpperCase());
    if (gstinError) {
      // Warn but don't hard-fail — invoice is still legally required
      logger.warn(
        { orderId: order.id.toString(), gstin, error: gstinError },
        "[invoice] SELLER_GSTIN failed format validation",
      );
    }
  }

  // ── Generate invoice number ───────────────────────────────────────────────
  const year = payment.paidAt.getUTCFullYear();
  const sequence = await incrementInvoiceNumberSequence(tx, year);
  const invoiceNumber = formatInvoiceNumber(year, sequence.lastValue);

  // ── GST breakdown ─────────────────────────────────────────────────────────
  const gst = computeGstBreakdown(
    order.taxAmount,
    order.shippingState,
    env.SELLER_STATE,
  );

  // ── Customer address snapshot (JSON) ──────────────────────────────────────
  const customerAddress = {
    line1: order.shippingLine1,
    line2: order.shippingLine2,
    city: order.shippingCity,
    state: order.shippingState,
    postalCode: order.shippingPostalCode,
    country: order.shippingCountry,
  };

  // ── Total amount snapshot ─────────────────────────────────────────────────
  // Use the order's paid total (= productTotal + shipping + tax - discount)
  const totalAmount = order.totalPaid;

  // ── Invoice item snapshots ────────────────────────────────────────────────
  const invoiceItems = order.items.map((item) => ({
    productName: item.productName,
    variantName: item.variantName,
    sku: item.sku,
    quantity: item.quantity,
    unitPrice: item.priceAtPurchase,
    totalPrice: item.priceAtPurchase.mul(item.quantity).toDecimalPlaces(2),
  }));

  // ── Create ────────────────────────────────────────────────────────────────
  const invoice = await createInvoice(tx, {
    order: { connect: { id: order.id } },
    invoiceNumber,
    issuedAt: payment.paidAt,
    customerName: order.shippingName,
    customerPhone: order.shippingPhone,
    customerAddress,
    sellerName: env.SELLER_NAME,
    sellerAddress: env.SELLER_ADDRESS,
    sellerGstin: gstin,
    sellerState: env.SELLER_STATE,
    productTotal: order.productTotal,
    shippingAmount: order.shippingAmount,
    taxAmount: order.taxAmount,
    discountAmount: order.discountAmount,
    totalAmount,
    cgst: gst.cgst,
    sgst: gst.sgst,
    igst: gst.igst,
    pdfStatus: PDF_STATUS.PENDING,
    items: {
      createMany: {
        data: invoiceItems,
      },
    },
  });

  logger.info(
    {
      orderId: order.id.toString(),
      invoiceId: invoice.id.toString(),
      invoiceNumber,
    },
    "[invoice] created",
  );

  return invoice;
};

// ─────────────────────────────────────────────────────────────────────────────
// PDF GENERATION (async, outside TX)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate PDF for an invoice, upload to R2, update pdfUrl + pdfStatus.
 * Runs OUTSIDE the Serializable TX — safe to take as long as needed.
 *
 * Guard: if pdfStatus === GENERATED, skip unless force=true.
 * This prevents duplicate uploads on retries when PDF already succeeded.
 */
export const generateInvoicePdf = async (
  invoiceId: bigint,
  force = false,
): Promise<void> => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: true },
  });

  if (!invoice) {
    logger.error({ invoiceId: invoiceId.toString() }, "[invoice-pdf] invoice not found");
    return;
  }

  // Guard: skip if already successfully generated — unless admin forces regeneration
  if (invoice.pdfStatus === PDF_STATUS.GENERATED && !force) {
    logger.info(
      { invoiceId: invoiceId.toString(), invoiceNumber: invoice.invoiceNumber },
      "[invoice-pdf] skipped — pdf_status=GENERATED, use force=true to regenerate",
    );
    return;
  }

  try {
    const ejs = await import("ejs");
    const path = await import("path");
    const puppeteer = await import("puppeteer-core");

    // Render EJS template
    const templatePath = path.join(__dirname, "templates", "invoice.ejs");
    const html = await ejs.renderFile(templatePath, {
      invoice: {
        invoiceNumber: invoice.invoiceNumber,
        issuedAt: invoice.issuedAt,
        customerName: invoice.customerName,
        customerPhone: invoice.customerPhone,
        customerAddress: invoice.customerAddress as Record<string, string>,
        sellerName: invoice.sellerName,
        sellerAddress: invoice.sellerAddress,
        sellerGstin: invoice.sellerGstin,
        sellerState: invoice.sellerState,
        productTotal: invoice.productTotal.toString(),
        shippingAmount: invoice.shippingAmount.toString(),
        taxAmount: invoice.taxAmount.toString(),
        discountAmount: invoice.discountAmount.toString(),
        totalAmount: invoice.totalAmount.toString(),
        cgst: invoice.cgst?.toString() ?? null,
        sgst: invoice.sgst?.toString() ?? null,
        igst: invoice.igst?.toString() ?? null,
      },
      items: invoice.items.map((item) => ({
        productName: item.productName,
        variantName: item.variantName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        totalPrice: item.totalPrice.toString(),
      })),
    });

    // Use system Chromium in production (installed via Alpine apk in Dockerfile).
    // CHROMIUM_PATH env var is set by the Dockerfile to /usr/bin/chromium.
    // Falls back to /usr/bin/chromium for most Linux distros.
    const executablePath =
      process.env.CHROMIUM_PATH ?? "/usr/bin/chromium";

    // HTML → PDF via Puppeteer
    const browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
      });
      const buffer = Buffer.from(pdfBuffer);

      // Upload to R2 — clean path: /invoices/{invoiceNumber}.pdf
      const r2Key = `invoices/${invoice.invoiceNumber}.pdf`;
      const pdfUrl = await uploadBufferToR2(r2Key, buffer, "application/pdf");

      // Update invoice: pdfUrl + pdfStatus = GENERATED
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { pdfUrl, pdfStatus: PDF_STATUS.GENERATED },
      });

      logger.info(
        {
          invoiceId: invoice.id.toString(),
          invoiceNumber: invoice.invoiceNumber,
          pdfUrl,
        },
        "[invoice] pdf generated",
      );
    } finally {
      await browser.close();
    }
  } catch (err) {
    // Mark as FAILED so admin dashboard and monitoring can surface it
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { pdfStatus: PDF_STATUS.FAILED },
    }).catch((updateErr) => {
      logger.error(
        { invoiceId: invoiceId.toString(), err: updateErr },
        "[invoice] failed to mark pdf_status=FAILED",
      );
    });

    logger.error(
      { invoiceId: invoiceId.toString(), invoiceNumber: invoice.invoiceNumber, err },
      "[invoice] pdf failed",
    );

    throw err; // Let caller (setImmediate / BullMQ) handle retry
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// API — Get invoice by order
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches invoice for an order. Used by both user and admin endpoints.
 * Returns null if no invoice exists for the order.
 */
export const getInvoiceByOrderId = async (orderId: bigint) => {
  const invoice = await findInvoiceForApi(prisma, orderId);

  if (!invoice) {
    return null;
  }

  return {
    id: invoice.id.toString(),
    orderId: invoice.orderId.toString(),
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    pdfStatus: invoice.pdfStatus,
    issuedAt: invoice.issuedAt.toISOString(),
    customerName: invoice.customerName,
    customerPhone: invoice.customerPhone,
    customerAddress: invoice.customerAddress,
    sellerName: invoice.sellerName,
    sellerAddress: invoice.sellerAddress,
    sellerGstin: invoice.sellerGstin,
    sellerState: invoice.sellerState,
    productTotal: invoice.productTotal.toString(),
    shippingAmount: invoice.shippingAmount.toString(),
    taxAmount: invoice.taxAmount.toString(),
    discountAmount: invoice.discountAmount.toString(),
    totalAmount: invoice.totalAmount.toString(),
    cgst: invoice.cgst?.toString() ?? null,
    sgst: invoice.sgst?.toString() ?? null,
    igst: invoice.igst?.toString() ?? null,
    pdfUrl: invoice.pdfUrl,
    createdAt: invoice.createdAt.toISOString(),
    items: invoice.items.map((item) => ({
      id: item.id.toString(),
      productName: item.productName,
      variantName: item.variantName,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
      totalPrice: item.totalPrice.toString(),
    })),
  };
};
