import { Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../lib/errors/app-error";
import {
  createManualInvoiceSchema,
  updateManualInvoiceSchema,
  manualInvoiceListQuerySchema,
} from "./manual-invoices.types";
import {
  createManualInvoice,
  updateManualInvoice,
  listManualInvoices,
} from "./manual-invoices.service";

const handleError = (req: Request, res: Response, err: unknown) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Invalid request body", details: err.issues });
  }
  req.log.error({ err }, "Manual invoice operation failed");
  return res.status(500).json({ error: "Internal server error" });
};

export const listManualInvoicesHandler = async (req: Request, res: Response) => {
  try {
    const query = manualInvoiceListQuerySchema.parse(req.query);
    const result = await listManualInvoices(query);
    return res.status(200).json(result);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const createManualInvoiceHandler = async (req: Request, res: Response) => {
  try {
    const input = createManualInvoiceSchema.parse(req.body);
    const invoice = await createManualInvoice(input);
    return res.status(201).json({ id: invoice.id.toString(), invoiceNumber: invoice.invoiceNumber });
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const updateManualInvoiceHandler = async (req: Request, res: Response) => {
  try {
    const id = BigInt(String(req.params.id));
    const input = updateManualInvoiceSchema.parse(req.body);
    const invoice = await updateManualInvoice(id, input);
    return res.status(200).json({ id: invoice.id.toString(), invoiceNumber: invoice.invoiceNumber });
  } catch (err) {
    if (err instanceof SyntaxError || err instanceof TypeError) {
      return res.status(400).json({ error: "Invalid invoice id" });
    }
    return handleError(req, res, err);
  }
};
