import { Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../lib/errors/app-error";
import { logger } from "../../lib/logger";
import {
  gstReportExportQuerySchema,
  gstReportQuerySchema,
  overviewReportQuerySchema,
} from "./reports.types";
import {
  getGstReportDetailedCsv,
  getGstReportDetailed,
  getGstReportSummary,
  getProfitOverviewReport,
} from "./reports.service";

const EXPORT_RATE_WINDOW_MS = 60_000;
const EXPORT_RATE_LIMIT = 10;
const exportRateState = new Map<
  string,
  { count: number; windowStart: number }
>();

const enforceExportRateLimit = (key: string) => {
  const now = Date.now();
  const existing = exportRateState.get(key);

  if (!existing || now - existing.windowStart >= EXPORT_RATE_WINDOW_MS) {
    exportRateState.set(key, { count: 1, windowStart: now });
    return;
  }

  if (existing.count >= EXPORT_RATE_LIMIT) {
    throw new AppError(
      429,
      "Too many export requests. Please retry shortly.",
      "REPORT_EXPORT_RATE_LIMIT",
    );
  }

  existing.count += 1;
  exportRateState.set(key, existing);
};

const handleError = (req: Request, res: Response, err: unknown) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }

  if (err instanceof ZodError) {
    return res
      .status(400)
      .json({ error: "Invalid request query", details: err.issues });
  }

  req.log.error({ err }, "Reports operation failed");
  return res.status(500).json({ error: "Internal server error" });
};

const buildGstCsvFileName = (from: string, to: string) => {
  const fromMonth = from.slice(0, 7);
  const toMonth = to.slice(0, 7);

  if (fromMonth === toMonth) {
    return `gst-report-${fromMonth}.csv`;
  }

  return `gst-report-${fromMonth}-to-${toMonth}.csv`;
};

export const getGstReport = async (req: Request, res: Response) => {
  try {
    const input = gstReportQuerySchema.parse(req.query);

    if (input.type === "detailed") {
      const detailed = await getGstReportDetailed(input);
      return res.status(200).json({
        type: "detailed",
        from: input.from,
        to: input.to,
        sort: input.sort,
        rows: detailed.rows,
        totals: detailed.totals,
        pagination: detailed.pagination,
      });
    }

    const summary = await getGstReportSummary(input);
    return res.status(200).json({
      type: "summary",
      from: input.from,
      to: input.to,
      ...summary,
    });
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const exportGstReportCsv = async (req: Request, res: Response) => {
  try {
    const rateKey = req.user?.id?.toString() ?? req.ip ?? "unknown";
    enforceExportRateLimit(rateKey);

    const input = gstReportExportQuerySchema.parse(req.query);
    const csv = await getGstReportDetailedCsv(input);
    const filename = buildGstCsvFileName(input.from, input.to);

    logger.info(
      {
        userId: req.user?.id?.toString() ?? null,
        from: input.from,
        to: input.to,
        exportAll: input.exportAll,
        page: input.page ?? null,
        limit: input.limit ?? null,
        sort: input.sort,
      },
      "[reports] GST CSV export generated",
    );

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    return res.status(200).send(csv);
  } catch (err) {
    return handleError(req, res, err);
  }
};

export const getOverviewReport = async (req: Request, res: Response) => {
  try {
    const input = overviewReportQuerySchema.parse(req.query);
    const overview = await getProfitOverviewReport(input);

    return res.status(200).json({
      from: input.from ?? null,
      to: input.to ?? null,
      ...overview,
    });
  } catch (err) {
    return handleError(req, res, err);
  }
};
