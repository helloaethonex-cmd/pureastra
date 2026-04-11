import { Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../../lib/errors/app-error";
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
    const input = gstReportExportQuerySchema.parse(req.query);
    const csv = await getGstReportDetailedCsv(input);
    const filename = buildGstCsvFileName(input.from, input.to);

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
