import path from "path";
import ejs from "ejs";
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
    address: string;
    state: string;
    stateCode: string;
  };
  receiver: {
    name: string;
    addressLines: string[];
    city: string;
    state: string;
    stateCode: string;
    pincode: string;
    country: string;
    phone: string;
  };
  order: {
    id: string;
    barcodeValue: string;
    barcodeSvg: string;
    date: string;
    paymentType: "PREPAID" | "COD";
    codAmount: string | null;
    itemCount: number;
    totalQuantity: number;
  };
  items: Array<{
    productName: string;
    variantName: string | null;
    sku: string | null;
    quantity: number;
  }>;
  remainingItemCount: number;
  printedAt: string;
};

const CODE_128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213",
  "122312", "132212", "221213", "221312", "231212", "112232", "122132",
  "122231", "113222", "123122", "123221", "223211", "221132", "221231",
  "213212", "223112", "312131", "311222", "321122", "321221", "312212",
  "322112", "322211", "212123", "212321", "232121", "111323", "131123",
  "131321", "112313", "132113", "132311", "211313", "231113", "231311",
  "112133", "112331", "132131", "113123", "113321", "133121", "313121",
  "211331", "231131", "213113", "213311", "213131", "311123", "311321",
  "331121", "312113", "312311", "332111", "314111", "221411", "431111",
  "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114",
  "413111", "241112", "134111", "111242", "121142", "121241", "114212",
  "124112", "124211", "411212", "421112", "421211", "212141", "214121",
  "412121", "111143", "111341", "131141", "114113", "114311", "411113",
  "411311", "113141", "114131", "311141", "411131", "211412", "211214",
  "211232", "2331112",
];

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  }).format(date);

const normalizeUpper = (value: string) =>
  value.trim().replace(/\s+/g, " ").toUpperCase();

const money = (value: { toString(): string }) => {
  const numeric = Number(value.toString());
  if (Number.isFinite(numeric)) return numeric.toFixed(2);
  return value.toString();
};

const toCode128BValue = (char: string) => {
  const codePoint = char.charCodeAt(0);
  if (codePoint < 32 || codePoint > 127) return 31; // fallback to "?"
  return codePoint - 32;
};

function buildCode128Svg(rawValue: string): string {
  const value = rawValue
    .trim()
    .toUpperCase()
    .replace(/[^\x20-\x7F]/g, "?");
  if (!value) {
    throw new AppError(422, "Order barcode value is empty", "EMPTY_BARCODE_VALUE");
  }
  const dataValues = [...value].map(toCode128BValue);
  const checksum =
    (104 + dataValues.reduce((sum, code, index) => sum + code * (index + 1), 0)) %
    103;
  const codes = [104, ...dataValues, checksum, 106];
  const quietModules = 10;
  const moduleHeight = 92;
  const barElements: string[] = [];
  let x = quietModules;

  for (const code of codes) {
    const pattern = CODE_128_PATTERNS[code];
    for (let i = 0; i < pattern.length; i += 1) {
      const width = Number(pattern[i]);
      if (i % 2 === 0) {
        barElements.push(
          `<rect x="${x}" y="0" width="${width}" height="${moduleHeight}" />`,
        );
      }
      x += width;
    }
  }

  const totalWidth = x + quietModules;

  return `<svg class="barcode-svg" viewBox="0 0 ${totalWidth} ${moduleHeight}" preserveAspectRatio="none" role="img" aria-label="Code 128 barcode ${value}"><rect width="${totalWidth}" height="${moduleHeight}" fill="#fff" />${barElements.join("")}</svg>`;
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

function buildLabelContext(order: OrderForLabel): ShippingLabelContext {
  const isPrepaid = order.paymentStatus === PAYMENT_STATUS_PAID;
  const items = order.items.map((item) => ({
    productName: normalizeUpper(item.productName),
    variantName: item.variantName ? normalizeUpper(item.variantName) : null,
    sku: item.sku ? normalizeUpper(item.sku) : null,
    quantity: item.quantity,
  }));

  return {
    seller: {
      name: normalizeUpper(env.SELLER_NAME),
      address: normalizeUpper(env.SELLER_ADDRESS),
      state: normalizeUpper(env.SELLER_STATE),
      stateCode: toStateCode(env.SELLER_STATE),
    },
    receiver: {
      name: normalizeUpper(order.shippingName),
      addressLines: [
        normalizeUpper(order.shippingLine1),
        ...(order.shippingLine2 ? [normalizeUpper(order.shippingLine2)] : []),
      ],
      city: normalizeUpper(order.shippingCity),
      state: normalizeUpper(order.shippingState),
      stateCode: toStateCode(order.shippingState),
      pincode: normalizeUpper(order.shippingPostalCode),
      country: normalizeUpper(order.shippingCountry),
      phone: normalizeUpper(order.shippingPhone),
    },
    order: {
      id: order.orderNumber,
      barcodeValue: order.orderNumber,
      barcodeSvg: buildCode128Svg(order.orderNumber),
      date: formatDate(order.placedAt ?? order.createdAt),
      paymentType: isPrepaid ? "PREPAID" : "COD",
      codAmount: isPrepaid ? null : money(order.totalPaid),
      itemCount: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    },
    items: items.slice(0, 4),
    remainingItemCount: Math.max(items.length - 4, 0),
    printedAt: formatDate(new Date()),
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
  const html = await ejs.renderFile(TEMPLATE_PATH, {
    labels,
    generatedAt: formatDate(new Date()),
  });

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
  return renderLabelsPdf([buildLabelContext(order)]);
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
      labels.push(buildLabelContext(order));
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
