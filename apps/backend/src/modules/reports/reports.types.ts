import { z } from "zod";

const dateString = z.string().date("Date must be in YYYY-MM-DD format");
const gstSortSchema = z
  .enum(["issuedAt:asc", "issuedAt:desc"])
  .default("issuedAt:asc");

export const gstReportQuerySchema = z
  .object({
    from: dateString,
    to: dateString,
    type: z.enum(["summary", "detailed"]).default("summary"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(500).default(50),
    sort: gstSortSchema,
  })
  .refine((value) => new Date(value.from) <= new Date(value.to), {
    message: "from must be less than or equal to to",
    path: ["from"],
  });

export const gstReportExportQuerySchema = z
  .object({
    from: dateString,
    to: dateString,
    type: z.enum(["detailed"]).default("detailed"),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(500).optional(),
    sort: gstSortSchema,
    exportAll: z.coerce.boolean().default(false),
  })
  .refine((value) => new Date(value.from) <= new Date(value.to), {
    message: "from must be less than or equal to to",
    path: ["from"],
  });

export const overviewReportQuerySchema = z
  .object({
    from: dateString.optional(),
    to: dateString.optional(),
  })
  .refine(
    (value) => {
      if ((value.from && !value.to) || (!value.from && value.to)) {
        return false;
      }
      if (value.from && value.to) {
        return new Date(value.from) <= new Date(value.to);
      }
      return true;
    },
    {
      message: "Provide both from and to, and ensure from <= to",
      path: ["from"],
    },
  );

export type GstReportQueryInput = z.infer<typeof gstReportQuerySchema>;
export type GstReportExportQueryInput = z.infer<
  typeof gstReportExportQuerySchema
>;
export type OverviewReportQueryInput = z.infer<
  typeof overviewReportQuerySchema
>;

export type DateRangeFilter = {
  gte?: Date;
  lte?: Date;
};

export const buildUtcDateRange = (
  from?: string,
  to?: string,
): DateRangeFilter | undefined => {
  if (!from && !to) {
    return undefined;
  }

  return {
    ...(from && { gte: new Date(`${from}T00:00:00.000Z`) }),
    ...(to && { lte: new Date(`${to}T23:59:59.999Z`) }),
  };
};

export type GstSummaryReport = {
  totalInvoices: number;
  totalTaxableValue: string;
  totalGST: string;
  totalCGST: string;
  totalSGST: string;
  totalIGST: string;
};

export type GstDetailedReportRow = {
  invoiceNumber: string;
  issuedAt: string;
  customerState: string;
  taxableValue: string;
  gstRate: string;
  cgst: string;
  sgst: string;
  igst: string;
  totalAmount: string;
};

export type GstDetailedReportTotals = {
  taxableValue: string;
  cgst: string;
  sgst: string;
  igst: string;
};

export type GstDetailedReport = {
  rows: GstDetailedReportRow[];
  totals: GstDetailedReportTotals;
  pagination: {
    page: number;
    limit: number;
    totalRows: number;
    totalPages: number;
  };
};

export type ProfitOverviewReport = {
  totalRevenue: string;
  totalGST: string;
  shippingRevenue: string;
  discounts: string;
  influencerCommission: string;
  profit: string;
};
