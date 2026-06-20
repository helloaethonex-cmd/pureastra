import { Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../lib/errors/app-error";
import {
  createVendorSchema,
  updateVendorSchema,
  vendorListQuerySchema,
  createWholesaleInvoiceSchema,
  wholesaleInvoiceListQuerySchema,
  wholesaleReportQuerySchema,
} from "./vendors.types";
import {
  createVendor,
  updateVendor,
  listVendors,
  getVendor,
  createWholesaleInvoice,
  regenerateWholesaleInvoicePdf,
  listWholesaleInvoices,
  getWholesaleReport,
  getWholesaleReportCsv,
} from "./vendors.service";

const handleError = (req: Request, res: Response, err: unknown) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Invalid request", details: err.issues });
  }
  req.log.error({ err }, "Vendor operation failed");
  return res.status(500).json({ error: "Internal server error" });
};

const parseId = (raw: string | string[] | undefined) => {
  if (typeof raw !== "string") return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
};

// ─── Vendors ──────────────────────────────────────────────────────────────────

export const createVendorHandler = async (req: Request, res: Response) => {
  try {
    const input = createVendorSchema.parse(req.body);
    const vendor = await createVendor(input);
    return res.status(201).json(vendor);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const listVendorsHandler = async (req: Request, res: Response) => {
  try {
    const query = vendorListQuerySchema.parse(req.query);
    const result = await listVendors(query);
    return res.status(200).json(result);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const getVendorHandler = async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ error: "Invalid vendor id" });
    const vendor = await getVendor(id);
    return res.status(200).json(vendor);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const updateVendorHandler = async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ error: "Invalid vendor id" });
    const input = updateVendorSchema.parse(req.body);
    const vendor = await updateVendor(id, input);
    return res.status(200).json(vendor);
  } catch (err) {
    return handleError(req, res, err);
  }
};

// ─── Wholesale invoices ───────────────────────────────────────────────────────

export const createWholesaleInvoiceHandler = async (req: Request, res: Response) => {
  try {
    const vendorId = parseId(req.params.id);
    if (vendorId === null) return res.status(400).json({ error: "Invalid vendor id" });
    const input = createWholesaleInvoiceSchema.parse(req.body);
    const result = await createWholesaleInvoice(vendorId, input);
    return res.status(201).json(result);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const listWholesaleInvoicesHandler = async (req: Request, res: Response) => {
  try {
    const query = wholesaleInvoiceListQuerySchema.parse(req.query);
    const result = await listWholesaleInvoices(query);
    return res.status(200).json(result);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const regenerateWholesaleInvoicePdfHandler = async (req: Request, res: Response) => {
  try {
    const invoiceId = parseId(req.params.invoiceId);
    if (invoiceId === null) return res.status(400).json({ error: "Invalid invoice id" });
    const result = await regenerateWholesaleInvoicePdf(invoiceId);
    return res.status(202).json({ message: "PDF regeneration started", ...result });
  } catch (err) {
    return handleError(req, res, err);
  }
};

// ─── Wholesale GST report ─────────────────────────────────────────────────────

export const getWholesaleReportHandler = async (req: Request, res: Response) => {
  try {
    const query = wholesaleReportQuerySchema.parse(req.query);
    const report = await getWholesaleReport(query);
    return res.status(200).json(report);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const exportWholesaleReportCsvHandler = async (req: Request, res: Response) => {
  try {
    const query = wholesaleReportQuerySchema.parse(req.query);
    const csv = await getWholesaleReportCsv(query);
    const filename = `wholesale-gst-${query.from}-to-${query.to}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(csv);
  } catch (err) {
    return handleError(req, res, err);
  }
};
