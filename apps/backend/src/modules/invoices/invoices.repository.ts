import { Prisma } from "../../generated/prisma/client";

type TxClient = Prisma.TransactionClient;

// ─────────────────────────────────────────────────────────────────────────────
// INVOICE NUMBER SEQUENCE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Atomically increment and return the next invoice number for the given year.
 * Same upsert pattern used by OrderNumberSequence — safe under Serializable.
 */
export const incrementInvoiceNumberSequence = (tx: TxClient, year: number) => {
  return tx.invoiceNumberSequence.upsert({
    where: { year },
    create: { year, lastValue: 1 },
    update: { lastValue: { increment: 1 } },
    select: { lastValue: true },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// INVOICE CRUD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find an existing invoice by orderId.
 * Primary use: idempotency check inside the payment TX.
 */
export const findInvoiceByOrderId = (tx: TxClient, orderId: bigint) => {
  return tx.invoice.findUnique({
    where: { orderId },
    include: { items: true },
  });
};

/**
 * Find an invoice by orderId with lightweight select for API responses.
 */
export const findInvoiceForApi = (tx: TxClient, orderId: bigint) => {
  return tx.invoice.findUnique({
    where: { orderId },
    select: {
      id: true,
      orderId: true,
      invoiceNumber: true,
      status: true,
      pdfStatus: true,
      issuedAt: true,
      customerName: true,
      customerPhone: true,
      customerAddress: true,
      sellerName: true,
      sellerAddress: true,
      sellerGstin: true,
      sellerState: true,
      productTotal: true,
      shippingAmount: true,
      taxAmount: true,
      discountAmount: true,
      totalAmount: true,
      cgst: true,
      sgst: true,
      igst: true,
      pdfUrl: true,
      createdAt: true,
      items: {
        select: {
          id: true,
          productName: true,
          variantName: true,
          sku: true,
          quantity: true,
          unitPrice: true,
          totalPrice: true,
        },
      },
    },
  });
};

/**
 * Find invoice by ID (for PDF generation job).
 */
export const findInvoiceById = (tx: TxClient, id: bigint) => {
  return tx.invoice.findUnique({
    where: { id },
    include: { items: true },
  });
};

/**
 * Create an Invoice + InvoiceItems atomically.
 * Called inside the Serializable payment TX.
 */
export const createInvoice = (
  tx: TxClient,
  data: Prisma.InvoiceCreateInput,
) => {
  return tx.invoice.create({
    data,
    include: { items: true },
  });
};

/**
 * Update invoice PDF URL after async PDF generation.
 * This runs OUTSIDE the payment TX.
 */
export const updateInvoicePdfUrl = (
  tx: TxClient,
  invoiceId: bigint,
  pdfUrl: string,
) => {
  return tx.invoice.update({
    where: { id: invoiceId },
    data: { pdfUrl },
    select: { id: true, pdfUrl: true },
  });
};
