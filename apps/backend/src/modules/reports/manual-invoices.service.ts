import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors/app-error";
import { roundMoney } from "../../utils/gst";
import { env } from "../../config/env";
import {
  formatInvoiceNumber,
  computeGstBreakdown,
} from "../invoices/invoices.types";
import { incrementInvoiceNumberSequence } from "../invoices/invoices.repository";
import type {
  CreateManualInvoiceInput,
  UpdateManualInvoiceInput,
  ManualInvoiceListQuery,
} from "./manual-invoices.types";

const ZERO = new Prisma.Decimal(0);

const toDecimal = (v: number | string) => new Prisma.Decimal(v);

const computeLine = (totalPriceInclGst: Prisma.Decimal, gstRatePct: Prisma.Decimal) => {
  // price is GST-inclusive: taxable = price / (1 + rate/100)
  const divisor = new Prisma.Decimal(1).plus(gstRatePct.div(100));
  const taxableValue = roundMoney(totalPriceInclGst.div(divisor));
  const taxAmount = roundMoney(totalPriceInclGst.minus(taxableValue));
  return { taxableValue, taxAmount };
};

export const createManualInvoice = async (input: CreateManualInvoiceInput) => {
  return prisma.$transaction(async (tx) => {
    const issuedAt = new Date(`${input.invoiceDate}T00:00:00.000Z`);
    const year = issuedAt.getUTCFullYear();
    const sequence = await incrementInvoiceNumberSequence(tx, year);
    const invoiceNumber = formatInvoiceNumber(year, sequence.lastValue);

    const sellerState = env.SELLER_STATE;

    let productTotal = ZERO;
    let totalTaxAmount = ZERO;

    const itemsData = input.items.map((item) => {
      const totalPrice = toDecimal(item.totalPrice);
      const gstRate = toDecimal(item.gstRate);
      const { taxableValue, taxAmount } = computeLine(totalPrice, gstRate);
      productTotal = roundMoney(productTotal.plus(totalPrice));
      totalTaxAmount = roundMoney(totalTaxAmount.plus(taxAmount));
      return { totalPrice, gstRate, taxableValue, taxAmount, name: item.productName };
    });

    const customerState = input.customerState;
    const gst = input.isInterstate
      ? { cgst: null, sgst: null, igst: roundMoney(totalTaxAmount) }
      : computeGstBreakdown(totalTaxAmount, customerState, sellerState);

    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        issuedAt,
        source: "MANUAL",
        status: "ACTIVE",
        customerName: input.customerName,
        customerPhone: input.customerPhone ?? null,
        customerAddress: { state: customerState },
        sellerName: env.SELLER_NAME,
        sellerAddress: env.SELLER_ADDRESS,
        sellerGstin: env.SELLER_GSTIN ?? "",
        sellerState,
        productTotal,
        shippingAmount: ZERO,
        taxAmount: totalTaxAmount,
        discountAmount: ZERO,
        totalAmount: productTotal,
        cgst: gst.cgst,
        sgst: gst.sgst,
        igst: gst.igst,
        items: {
          create: itemsData.map((item) => ({
            productName: item.name,
            quantity: 1,
            unitPrice: item.totalPrice,
            totalPrice: item.totalPrice,
            gstRate: item.gstRate,
            taxableValue: item.taxableValue,
            taxAmount: item.taxAmount,
          })),
        },
      },
      include: { items: true },
    });

    return invoice;
  });
};

export const updateManualInvoice = async (
  id: bigint,
  input: UpdateManualInvoiceInput,
) => {
  const existing = await prisma.invoice.findUnique({
    where: { id },
    select: { id: true, source: true, status: true },
  });

  if (!existing) throw new AppError(404, "Invoice not found", "INVOICE_NOT_FOUND");
  if (existing.source !== "MANUAL")
    throw new AppError(400, "Only manual invoices can be edited", "INVOICE_NOT_MANUAL");
  if (existing.status === "CANCELLED")
    throw new AppError(400, "Cancelled invoices cannot be edited", "INVOICE_CANCELLED");

  return prisma.$transaction(async (tx) => {
    const issuedAt = new Date(`${input.invoiceDate}T00:00:00.000Z`);
    const sellerState = env.SELLER_STATE;

    let productTotal = ZERO;
    let totalTaxAmount = ZERO;

    const itemsData = input.items.map((item) => {
      const totalPrice = toDecimal(item.totalPrice);
      const gstRate = toDecimal(item.gstRate);
      const { taxableValue, taxAmount } = computeLine(totalPrice, gstRate);
      productTotal = roundMoney(productTotal.plus(totalPrice));
      totalTaxAmount = roundMoney(totalTaxAmount.plus(taxAmount));
      return { totalPrice, gstRate, taxableValue, taxAmount, name: item.productName };
    });

    const customerState = input.customerState;
    const gst = input.isInterstate
      ? { cgst: null, sgst: null, igst: roundMoney(totalTaxAmount) }
      : computeGstBreakdown(totalTaxAmount, customerState, sellerState);

    // Replace all items
    await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });

    const invoice = await tx.invoice.update({
      where: { id },
      data: {
        issuedAt,
        customerName: input.customerName,
        customerPhone: input.customerPhone ?? null,
        customerAddress: { state: customerState },
        productTotal,
        taxAmount: totalTaxAmount,
        totalAmount: productTotal,
        cgst: gst.cgst,
        sgst: gst.sgst,
        igst: gst.igst,
        // Reset PDF so it gets regenerated
        pdfUrl: null,
        pdfStatus: 0,
        items: {
          create: itemsData.map((item) => ({
            productName: item.name,
            quantity: 1,
            unitPrice: item.totalPrice,
            totalPrice: item.totalPrice,
            gstRate: item.gstRate,
            taxableValue: item.taxableValue,
            taxAmount: item.taxAmount,
          })),
        },
      },
      include: { items: true },
    });

    return invoice;
  });
};

export const listManualInvoices = async (query: ManualInvoiceListQuery) => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Prisma.InvoiceWhereInput = { source: "MANUAL" };

  const [totalRows, rows] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      orderBy: { issuedAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        invoiceNumber: true,
        issuedAt: true,
        status: true,
        customerName: true,
        customerPhone: true,
        customerAddress: true,
        totalAmount: true,
        taxAmount: true,
        cgst: true,
        sgst: true,
        igst: true,
        items: {
          select: {
            id: true,
            productName: true,
            quantity: true,
            totalPrice: true,
            gstRate: true,
            taxableValue: true,
            taxAmount: true,
          },
        },
      },
    }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id.toString(),
      invoiceNumber: r.invoiceNumber,
      issuedAt: r.issuedAt.toISOString(),
      status: r.status,
      customerName: r.customerName,
      customerPhone: r.customerPhone ?? null,
      customerState:
        typeof r.customerAddress === "object" &&
        r.customerAddress !== null &&
        !Array.isArray(r.customerAddress)
          ? ((r.customerAddress as Record<string, unknown>).state as string) ?? ""
          : "",
      totalAmount: r.totalAmount.toFixed(2),
      taxAmount: r.taxAmount.toFixed(2),
      cgst: r.cgst?.toFixed(2) ?? null,
      sgst: r.sgst?.toFixed(2) ?? null,
      igst: r.igst?.toFixed(2) ?? null,
      items: r.items.map((item) => ({
        id: item.id.toString(),
        productName: item.productName,
        totalPrice: item.totalPrice.toFixed(2),
        gstRate: item.gstRate.toFixed(2),
        taxableValue: item.taxableValue.toFixed(2),
        taxAmount: item.taxAmount.toFixed(2),
      })),
    })),
    pagination: {
      page,
      limit,
      totalRows,
      totalPages: totalRows === 0 ? 0 : Math.ceil(totalRows / limit),
    },
  };
};
