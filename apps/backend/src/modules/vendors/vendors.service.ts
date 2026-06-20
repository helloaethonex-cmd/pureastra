import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { logger } from "../../lib/logger";
import { AppError } from "../../lib/errors/app-error";
import { roundMoney } from "../../utils/gst";
import { env } from "../../config/env";
import {
  formatInvoiceNumber,
  computeGstBreakdown,
} from "../invoices/invoices.types";
import { incrementInvoiceNumberSequence } from "../invoices/invoices.repository";
import { generateInvoicePdf } from "../invoices/invoices.service";
import type {
  CreateVendorInput,
  UpdateVendorInput,
  VendorListQuery,
  CreateWholesaleInvoiceInput,
  WholesaleInvoiceListQuery,
  WholesaleReportQuery,
} from "./vendors.types";

const ZERO = new Prisma.Decimal(0);
const toDecimal = (v: number | string) => new Prisma.Decimal(v);
const money = (v: Prisma.Decimal | null | undefined) => (v ?? ZERO).toFixed(2);

const buildUtcRange = (from: string, to: string) => ({
  gte: new Date(`${from}T00:00:00.000Z`),
  lte: new Date(`${to}T23:59:59.999Z`),
});

const cleanEmail = (email?: string) => (email && email.length > 0 ? email : null);

// ─── Vendor CRUD ──────────────────────────────────────────────────────────────

const serializeVendor = (v: {
  id: bigint;
  storeName: string;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  gstin: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string;
  postalCode: string | null;
  country: string;
  status: string;
  createdAt: Date;
}) => ({
  id: v.id.toString(),
  storeName: v.storeName,
  contactName: v.contactName,
  contactPhone: v.contactPhone,
  contactEmail: v.contactEmail,
  gstin: v.gstin,
  addressLine1: v.addressLine1,
  addressLine2: v.addressLine2,
  city: v.city,
  state: v.state,
  postalCode: v.postalCode,
  country: v.country,
  status: v.status,
  createdAt: v.createdAt.toISOString(),
});

export const createVendor = async (input: CreateVendorInput) => {
  const vendor = await prisma.vendor.create({
    data: {
      storeName: input.storeName,
      contactName: input.contactName ?? null,
      contactPhone: input.contactPhone ?? null,
      contactEmail: cleanEmail(input.contactEmail),
      gstin: input.gstin ?? null,
      addressLine1: input.addressLine1 ?? null,
      addressLine2: input.addressLine2 ?? null,
      city: input.city ?? null,
      state: input.state,
      postalCode: input.postalCode ?? null,
      country: input.country,
    },
  });
  return serializeVendor(vendor);
};

export const updateVendor = async (id: bigint, input: UpdateVendorInput) => {
  const existing = await prisma.vendor.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new AppError(404, "Vendor not found", "VENDOR_NOT_FOUND");

  const vendor = await prisma.vendor.update({
    where: { id },
    data: {
      storeName: input.storeName,
      contactName: input.contactName ?? null,
      contactPhone: input.contactPhone ?? null,
      contactEmail: cleanEmail(input.contactEmail),
      gstin: input.gstin ?? null,
      addressLine1: input.addressLine1 ?? null,
      addressLine2: input.addressLine2 ?? null,
      city: input.city ?? null,
      state: input.state,
      postalCode: input.postalCode ?? null,
      country: input.country,
      ...(input.status && { status: input.status }),
    },
  });
  return serializeVendor(vendor);
};

export const listVendors = async (query: VendorListQuery) => {
  const skip = (query.page - 1) * query.limit;
  const where: Prisma.VendorWhereInput = {
    ...(query.status && { status: query.status }),
  };

  const [totalRows, rows] = await Promise.all([
    prisma.vendor.count({ where }),
    prisma.vendor.findMany({
      where,
      orderBy: { storeName: "asc" },
      skip,
      take: query.limit,
    }),
  ]);

  return {
    rows: rows.map(serializeVendor),
    pagination: {
      page: query.page,
      limit: query.limit,
      totalRows,
      totalPages: totalRows === 0 ? 0 : Math.ceil(totalRows / query.limit),
    },
  };
};

export const getVendor = async (id: bigint) => {
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) throw new AppError(404, "Vendor not found", "VENDOR_NOT_FOUND");
  return serializeVendor(vendor);
};

// ─── Wholesale invoice creation ───────────────────────────────────────────────

export const createWholesaleInvoice = async (
  vendorId: bigint,
  input: CreateWholesaleInvoiceInput,
) => {
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) throw new AppError(404, "Vendor not found", "VENDOR_NOT_FOUND");
  if (vendor.status === "INACTIVE")
    throw new AppError(400, "Vendor is inactive", "VENDOR_INACTIVE");

  const invoiceId = await prisma.$transaction(async (tx) => {
    const issuedAt = new Date(`${input.invoiceDate}T00:00:00.000Z`);
    const year = issuedAt.getUTCFullYear();
    const sequence = await incrementInvoiceNumberSequence(tx, year);
    const invoiceNumber = formatInvoiceNumber(year, sequence.lastValue);

    let productTotal = ZERO;
    let totalTaxAmount = ZERO;

    const itemsData = input.items.map((item) => {
      const unitPrice = toDecimal(item.unitPrice);
      const gstRate = toDecimal(item.gstRate);
      const lineTotal = roundMoney(unitPrice.mul(item.quantity));
      const divisor = new Prisma.Decimal(1).plus(gstRate.div(100));
      const taxableValue = roundMoney(lineTotal.div(divisor));
      const taxAmount = roundMoney(lineTotal.minus(taxableValue));
      productTotal = roundMoney(productTotal.plus(lineTotal));
      totalTaxAmount = roundMoney(totalTaxAmount.plus(taxAmount));
      return {
        productName: item.productName,
        quantity: item.quantity,
        unitPrice,
        totalPrice: lineTotal,
        gstRate,
        taxableValue,
        taxAmount,
      };
    });

    // Same-state vs inter-state decided by vendor state vs configured seller state
    const gst = computeGstBreakdown(totalTaxAmount, vendor.state, env.SELLER_STATE);

    const created = await tx.invoice.create({
      data: {
        invoiceNumber,
        issuedAt,
        source: "WHOLESALE",
        status: "ACTIVE",
        vendorId: vendor.id,
        customerName: vendor.storeName,
        customerPhone: vendor.contactPhone,
        customerGstin: vendor.gstin,
        customerAddress: {
          line1: vendor.addressLine1 ?? "",
          line2: vendor.addressLine2 ?? "",
          city: vendor.city ?? "",
          state: vendor.state,
          postalCode: vendor.postalCode ?? "",
          country: vendor.country,
        },
        sellerName: env.SELLER_NAME,
        sellerAddress: env.SELLER_ADDRESS,
        sellerGstin: env.SELLER_GSTIN ?? "",
        sellerState: env.SELLER_STATE,
        productTotal,
        shippingAmount: ZERO,
        taxAmount: totalTaxAmount,
        discountAmount: ZERO,
        totalAmount: productTotal,
        cgst: gst.cgst,
        sgst: gst.sgst,
        igst: gst.igst,
        items: { create: itemsData },
      },
      select: { id: true, invoiceNumber: true },
    });

    return created;
  });

  // Fire async PDF generation (Puppeteer + R2) outside the TX
  generateInvoicePdf(invoiceId.id, true).catch((err) => {
    logger.error(
      { invoiceId: invoiceId.id.toString(), err },
      "[wholesale-invoice] pdf generation failed",
    );
  });

  return { id: invoiceId.id.toString(), invoiceNumber: invoiceId.invoiceNumber };
};

export const regenerateWholesaleInvoicePdf = async (invoiceId: bigint) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { id: true, invoiceNumber: true, source: true },
  });
  if (!invoice || invoice.source !== "WHOLESALE")
    throw new AppError(404, "Wholesale invoice not found", "INVOICE_NOT_FOUND");

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { pdfStatus: 0, pdfUrl: null },
  });

  generateInvoicePdf(invoiceId, true).catch((err) => {
    logger.error(
      { invoiceId: invoiceId.toString(), err },
      "[wholesale-invoice] pdf regeneration failed",
    );
  });

  return { invoiceNumber: invoice.invoiceNumber };
};

// ─── Wholesale invoice list ───────────────────────────────────────────────────

export const listWholesaleInvoices = async (query: WholesaleInvoiceListQuery) => {
  const skip = (query.page - 1) * query.limit;
  const where: Prisma.InvoiceWhereInput = {
    source: "WHOLESALE",
    ...(query.vendorId && { vendorId: query.vendorId }),
  };

  const [totalRows, rows] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      orderBy: { issuedAt: "desc" },
      skip,
      take: query.limit,
      select: {
        id: true,
        invoiceNumber: true,
        issuedAt: true,
        customerName: true,
        customerGstin: true,
        productTotal: true,
        taxAmount: true,
        totalAmount: true,
        cgst: true,
        sgst: true,
        igst: true,
        pdfUrl: true,
        pdfStatus: true,
        vendor: { select: { id: true, storeName: true, state: true } },
        items: {
          select: { productName: true, quantity: true, totalPrice: true, gstRate: true },
        },
      },
    }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id.toString(),
      invoiceNumber: r.invoiceNumber,
      issuedAt: r.issuedAt.toISOString(),
      vendorId: r.vendor?.id.toString() ?? null,
      vendorName: r.vendor?.storeName ?? r.customerName,
      vendorState: r.vendor?.state ?? "",
      gstin: r.customerGstin,
      taxableValue: money(r.productTotal.minus(r.taxAmount)),
      taxAmount: money(r.taxAmount),
      totalAmount: money(r.totalAmount),
      cgst: r.cgst ? money(r.cgst) : null,
      sgst: r.sgst ? money(r.sgst) : null,
      igst: r.igst ? money(r.igst) : null,
      isInterstate: !!r.igst && !r.igst.equals(ZERO),
      pdfUrl: r.pdfUrl,
      pdfStatus: r.pdfStatus,
      items: r.items.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        totalPrice: money(item.totalPrice),
        gstRate: item.gstRate.toFixed(2),
      })),
    })),
    pagination: {
      page: query.page,
      limit: query.limit,
      totalRows,
      totalPages: totalRows === 0 ? 0 : Math.ceil(totalRows / query.limit),
    },
  };
};

// ─── Wholesale GST filing report ──────────────────────────────────────────────

export const getWholesaleReport = async (query: WholesaleReportQuery) => {
  const issuedAt = buildUtcRange(query.from, query.to);
  const where: Prisma.InvoiceWhereInput = {
    source: "WHOLESALE",
    status: "ACTIVE",
    issuedAt,
  };

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { issuedAt: "asc" },
    select: {
      invoiceNumber: true,
      issuedAt: true,
      customerName: true,
      customerGstin: true,
      productTotal: true,
      taxAmount: true,
      totalAmount: true,
      cgst: true,
      sgst: true,
      igst: true,
      vendor: { select: { storeName: true, state: true } },
    },
  });

  let tTaxable = ZERO;
  let tCgst = ZERO;
  let tSgst = ZERO;
  let tIgst = ZERO;
  let tTotal = ZERO;

  const rows = invoices.map((inv) => {
    const taxable = roundMoney(inv.productTotal.minus(inv.taxAmount));
    tTaxable = roundMoney(tTaxable.plus(taxable));
    tCgst = roundMoney(tCgst.plus(inv.cgst ?? ZERO));
    tSgst = roundMoney(tSgst.plus(inv.sgst ?? ZERO));
    tIgst = roundMoney(tIgst.plus(inv.igst ?? ZERO));
    tTotal = roundMoney(tTotal.plus(inv.totalAmount));
    return {
      invoiceNumber: inv.invoiceNumber,
      issuedAt: inv.issuedAt.toISOString(),
      vendorName: inv.vendor?.storeName ?? inv.customerName,
      vendorState: inv.vendor?.state ?? "",
      gstin: inv.customerGstin ?? "",
      taxableValue: taxable.toFixed(2),
      cgst: money(inv.cgst),
      sgst: money(inv.sgst),
      igst: money(inv.igst),
      totalAmount: money(inv.totalAmount),
    };
  });

  return {
    from: query.from,
    to: query.to,
    rows,
    totals: {
      invoices: rows.length,
      taxableValue: tTaxable.toFixed(2),
      cgst: tCgst.toFixed(2),
      sgst: tSgst.toFixed(2),
      igst: tIgst.toFixed(2),
      totalSales: tTotal.toFixed(2),
    },
  };
};

const escapeCsv = (value: string) =>
  /[,"\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

export const getWholesaleReportCsv = async (query: WholesaleReportQuery) => {
  const report = await getWholesaleReport(query);
  const header = [
    "invoiceNumber",
    "issuedAt",
    "vendorName",
    "vendorState",
    "gstin",
    "taxableValue",
    "cgst",
    "sgst",
    "igst",
    "totalAmount",
  ];
  const lines: string[] = [header.join(",")];

  for (const row of report.rows) {
    lines.push(
      [
        row.invoiceNumber,
        row.issuedAt.slice(0, 10),
        row.vendorName,
        row.vendorState,
        row.gstin,
        row.taxableValue,
        row.cgst,
        row.sgst,
        row.igst,
        row.totalAmount,
      ]
        .map((v) => escapeCsv(String(v)))
        .join(","),
    );
  }

  lines.push(
    [
      "TOTAL",
      "",
      "",
      "",
      "",
      report.totals.taxableValue,
      report.totals.cgst,
      report.totals.sgst,
      report.totals.igst,
      report.totals.totalSales,
    ]
      .map((v) => escapeCsv(String(v)))
      .join(","),
  );

  return lines.join("\n");
};
