import path from "path";
import ejs from "ejs";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors/app-error";
import { env } from "../../config/env";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Valid order statuses for shipping label generation.
 * PLACED = 0, CONFIRMED = 1, PACKED = 2
 */
const VALID_LABEL_STATUSES = new Set([0, 1, 2]);

const PAYMENT_STATUS_PAID = 1;

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL TYPES
// ─────────────────────────────────────────────────────────────────────────────

type OrderForLabel = {
  id: bigint;
  orderNumber: string;
  shippingName: string;
  shippingPhone: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;
  totalPaid: { toString(): string };
  paymentStatus: number;
  orderStatus: number;
  _count: { items: number };
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a single order and validate it's eligible for a shipping label.
 * Uses snapshot fields — never live user data.
 */
async function fetchOrderForLabel(orderId: bigint): Promise<OrderForLabel> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      shippingName: true,
      shippingPhone: true,
      shippingLine1: true,
      shippingLine2: true,
      shippingCity: true,
      shippingState: true,
      shippingPostalCode: true,
      shippingCountry: true,
      totalPaid: true,
      paymentStatus: true,
      orderStatus: true,
      _count: { select: { items: true } },
    },
  });

  if (!order) {
    throw new AppError(404, "Order not found", "ORDER_NOT_FOUND");
  }

  if (!VALID_LABEL_STATUSES.has(order.orderStatus)) {
    throw new AppError(
      422,
      `Shipping label can only be generated for orders in PLACED, CONFIRMED, or PACKED state (current status: ${order.orderStatus})`,
      "INVALID_ORDER_STATUS",
    );
  }

  return order;
}

/**
 * Build the EJS template context for a single order.
 */
function buildLabelContext(order: OrderForLabel) {
  const isPrepaid = order.paymentStatus === PAYMENT_STATUS_PAID;
  const badgeBg = isPrepaid ? "#d4edda" : "#ffffff";
  const badgeColor = isPrepaid ? "#155724" : "#111111";

  // Build the badge color rule as a plain static <style> block.
  // This avoids the need for EJS inside style="" attributes (which breaks IDE parsers).
  const dynamicStyle = `<style>.header .payment-badge{background:${badgeBg};color:${badgeColor};}</style>`;

  // Build barcode bar HTML upfront so the template never needs EJS inside style="".
  const barWidths = [3,1,2,1,3,1,1,3,2,1,3,1,2,1,1,3,2,1,2,3,1,1,3,2,1,3,1,2,1,3,1,1,2,3,1,2,1,3,1,2];
  const barcodeHtml = barWidths
    .map((w) => `<div style="flex:0 0 ${w}mm;background:#111;"></div><div style="flex:0 0 0.5mm;background:#fff;"></div>`)
    .join("");

  return {
    sellerName: env.SELLER_NAME,
    sellerAddress: env.SELLER_ADDRESS,
    paymentType: isPrepaid ? "PREPAID" : "COD",
    dynamicStyle,
    barcodeHtml,
    order: {
      orderNumber: order.orderNumber,
      shippingName: order.shippingName,
      shippingPhone: order.shippingPhone,
      shippingLine1: order.shippingLine1,
      shippingLine2: order.shippingLine2,
      shippingCity: order.shippingCity,
      shippingState: order.shippingState,
      shippingPostalCode: order.shippingPostalCode,
      shippingCountry: order.shippingCountry,
      totalPaid: order.totalPaid.toString(),
      itemCount: order._count.items,
    },
    printedAt: new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

/**
 * Launch a Puppeteer browser instance using the system Chromium binary.
 * Shared across both single and bulk label generation.
 */
async function launchBrowser() {
  const puppeteer = await import("puppeteer-core");
  const executablePath = process.env.CHROMIUM_PATH ?? "/usr/bin/chromium";

  return puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
}

const TEMPLATE_PATH = path.join(
  __dirname,
  "templates",
  "shipping-label.ejs",
);

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE LABEL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a single A6 shipping label PDF for one order.
 * Returns a Buffer containing the PDF bytes.
 */
export async function generateSingleShippingLabel(
  orderId: bigint,
): Promise<Buffer> {
  const order = await fetchOrderForLabel(orderId);
  const context = buildLabelContext(order);

  const html = await ejs.renderFile(TEMPLATE_PATH, context);

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      width: "105mm",
      height: "148mm",  // A6
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BULK LABELS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a single PDF containing multiple A6 shipping labels, one per page.
 * Skips invalid orders and collects them in a `skipped` list.
 * Returns the PDF buffer and a list of skipped order IDs with reasons.
 */
export async function generateBulkShippingLabels(orderIds: bigint[]): Promise<{
  buffer: Buffer;
  skipped: { orderId: string; reason: string }[];
}> {
  if (orderIds.length === 0) {
    throw new AppError(400, "No order IDs provided", "NO_ORDER_IDS");
  }
  if (orderIds.length > 50) {
    throw new AppError(
      422,
      "Bulk label generation is limited to 50 orders per request",
      "BULK_LIMIT_EXCEEDED",
    );
  }

  const skipped: { orderId: string; reason: string }[] = [];
  const htmlPages: string[] = [];

  // Fetch each order individually to get precise error per order
  for (const orderId of orderIds) {
    try {
      const order = await fetchOrderForLabel(orderId);
      const context = buildLabelContext(order);
      const html = await ejs.renderFile(TEMPLATE_PATH, context);
      htmlPages.push(html);
    } catch (err) {
      const reason =
        err instanceof AppError ? err.message : "Unexpected error";
      skipped.push({ orderId: orderId.toString(), reason });
    }
  }

  if (htmlPages.length === 0) {
    throw new AppError(
      422,
      "No valid orders to generate labels for",
      "NO_VALID_ORDERS",
    );
  }

  // Combine all label HTMLs into a single multi-page document.
  // Each label gets its own @page rule for A6 size.
  const combinedHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    @page { size: 105mm 148mm; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #fff; }
    .page-break { page-break-after: always; }
  </style>
</head>
<body>
  ${htmlPages
    .map((html, i) => {
      // Strip the outer html/head/body tags from each label — keep only body content
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const content = bodyMatch ? bodyMatch[1].trim() : html;
      const isLast = i === htmlPages.length - 1;
      return `<div class="${isLast ? "" : "page-break"}">${content}</div>`;
    })
    .join("\n")}
</body>
</html>`;

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(combinedHtml, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      width: "105mm",
      height: "148mm",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });
    return { buffer: Buffer.from(pdfBuffer), skipped };
  } finally {
    await browser.close();
  }
}
