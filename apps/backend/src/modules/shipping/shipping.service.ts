import path from "path";
import ejs from "ejs";
import bwipjs from "bwip-js";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors/app-error";
import { env } from "../../config/env";
import { toStateCode } from "../../utils/state";

const VALID_LABEL_STATUSES = new Set([0, 1, 2]);
const PAYMENT_STATUS_PAID = 1;
const TEMPLATE_PATH = path.join(__dirname, "templates", "shipping-label.ejs");

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
  placedAt: Date | null;
  createdAt: Date;
  items: Array<{
    productName: string;
    variantName: string | null;
    sku: string | null;
    quantity: number;
  }>;
};

type ShippingLabelContext = {
  seller: {
    name: string;
    stateName: string;
    stateCode: string;
  };
  order: {
    orderId: string;
    customerName: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    stateName: string;
    stateCode: string;
    pincode: string;
    phone: string;
    date: string;
    isCOD: boolean;
    codAmount: string | null;
  };
  items: Array<{
    name: string;
    sku: string | null;
    quantity: number;
  }>;
  remainingItemCount: number;
  barcode: string;
};

const STATE_NAME_BY_CODE: Record<string, string> = {
  AP: "ANDHRA PRADESH",
  AR: "ARUNACHAL PRADESH",
  AS: "ASSAM",
  BR: "BIHAR",
  CG: "CHHATTISGARH",
  GA: "GOA",
  GJ: "GUJARAT",
  HR: "HARYANA",
  HP: "HIMACHAL PRADESH",
  JH: "JHARKHAND",
  KA: "KARNATAKA",
  KL: "KERALA",
  MP: "MADHYA PRADESH",
  MH: "MAHARASHTRA",
  MN: "MANIPUR",
  ML: "MEGHALAYA",
  MZ: "MIZORAM",
  NL: "NAGALAND",
  OD: "ODISHA",
  PB: "PUNJAB",
  RJ: "RAJASTHAN",
  SK: "SIKKIM",
  TN: "TAMIL NADU",
  TS: "TELANGANA",
  TR: "TRIPURA",
  UP: "UTTAR PRADESH",
  UK: "UTTARAKHAND",
  WB: "WEST BENGAL",
  AN: "ANDAMAN AND NICOBAR ISLANDS",
  CH: "CHANDIGARH",
  DN: "DADRA AND NAGAR HAVELI",
  DD: "DAMAN AND DIU",
  DL: "DELHI",
  JK: "JAMMU AND KASHMIR",
  LA: "LADAKH",
  LD: "LAKSHADWEEP",
  PY: "PUDUCHERRY",
};

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);

const normalizeText = (value: string) => value.trim().replace(/\s+/g, " ");
const normalizeUpper = (value: string) => normalizeText(value).toUpperCase();

const money = (value: { toString(): string }) => {
  const numeric = Number(value.toString());
  if (Number.isFinite(numeric)) return numeric.toFixed(2);
  return value.toString();
};

const displayStateName = (value: string) => {
  const stateCode = toStateCode(value);
  return STATE_NAME_BY_CODE[stateCode] ?? normalizeUpper(value);
};

const cleanBarcodeValue = (value: string) => {
  const barcodeValue = value.trim().toUpperCase().replace(/[^\x20-\x7F]/g, "?");
  if (!barcodeValue) {
    throw new AppError(422, "Order barcode value is empty", "EMPTY_BARCODE_VALUE");
  }
  return barcodeValue;
};

async function generateCode128Barcode(value: string): Promise<string> {
  const barcode = await bwipjs.toBuffer({
    bcid: "code128",
    text: cleanBarcodeValue(value),
    scale: 3,
    height: 10,
    includetext: false,
    paddingwidth: 10,
    paddingheight: 2,
  });
  return `data:image/png;base64,${barcode.toString("base64")}`;
}

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
      placedAt: true,
      createdAt: true,
      items: {
        select: {
          productName: true,
          variantName: true,
          sku: true,
          quantity: true,
        },
        orderBy: { createdAt: "asc" },
      },
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

async function buildLabelContext(
  order: OrderForLabel,
): Promise<ShippingLabelContext> {
  const isPrepaid = order.paymentStatus === PAYMENT_STATUS_PAID;
  const sellerStateCode = toStateCode(env.SELLER_STATE);
  const receiverStateCode = toStateCode(order.shippingState);
  const items = order.items.map((item) => ({
    name: item.variantName
      ? `${normalizeText(item.productName)} (${normalizeText(item.variantName)})`
      : normalizeText(item.productName),
    sku: item.sku ? normalizeUpper(item.sku) : null,
    quantity: item.quantity,
  }));

  return {
    seller: {
      name: normalizeUpper(env.SELLER_NAME),
      stateName: STATE_NAME_BY_CODE[sellerStateCode] ?? normalizeUpper(env.SELLER_STATE),
      stateCode: sellerStateCode,
    },
    order: {
      orderId: order.orderNumber,
      customerName: normalizeUpper(order.shippingName),
      addressLine1: normalizeText(order.shippingLine1),
      addressLine2: order.shippingLine2 ? normalizeText(order.shippingLine2) : null,
      city: normalizeText(order.shippingCity),
      stateName: displayStateName(order.shippingState),
      stateCode: receiverStateCode,
      pincode: normalizeUpper(order.shippingPostalCode),
      phone: normalizeText(order.shippingPhone),
      date: formatDate(order.placedAt ?? order.createdAt),
      isCOD: !isPrepaid,
      codAmount: isPrepaid ? null : money(order.totalPaid),
    },
    items: items.slice(0, 4),
    remainingItemCount: Math.max(items.length - 4, 0),
    barcode: await generateCode128Barcode(order.orderNumber),
  };
}

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

async function renderLabelsPdf(labels: ShippingLabelContext[]): Promise<Buffer> {
  const html = await ejs.renderFile(TEMPLATE_PATH, { labels });

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      width: "105mm",
      height: "148mm",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
      preferCSSPageSize: true,
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

export async function generateSingleShippingLabel(
  orderId: bigint,
): Promise<Buffer> {
  const order = await fetchOrderForLabel(orderId);
  return renderLabelsPdf([await buildLabelContext(order)]);
}

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
  const labels: ShippingLabelContext[] = [];

  for (const orderId of orderIds) {
    try {
      const order = await fetchOrderForLabel(orderId);
      labels.push(await buildLabelContext(order));
    } catch (err) {
      const reason = err instanceof AppError ? err.message : "Unexpected error";
      skipped.push({ orderId: orderId.toString(), reason });
    }
  }

  if (labels.length === 0) {
    throw new AppError(
      422,
      "No valid orders to generate labels for",
      "NO_VALID_ORDERS",
    );
  }

  return { buffer: await renderLabelsPdf(labels), skipped };
}
