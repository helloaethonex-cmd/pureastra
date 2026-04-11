import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { logger } from "../../lib/logger";
import { redisClient } from "../../lib/redis/client";
import { AppError } from "../../lib/errors/app-error";
import { roundMoney } from "../../utils/gst";
import {
  buildUtcDateRange,
  GstDetailedReport,
  GstDetailedReportTotals,
  GstReportExportQueryInput,
  GstReportQueryInput,
  OverviewReportQueryInput,
  ProfitOverviewReport,
  GstSummaryReport,
} from "./reports.types";
import {
  countGstDetailedRows,
  findGstDetailedRows,
  getGstDetailedTotalsAggregates,
  getGstSummaryAggregates,
  getProfitOverviewAggregates,
} from "./reports.repository";

const ZERO = new Prisma.Decimal(0);
const REPORT_CACHE_TTL_SECONDS = 300;
const MAX_EXPORT_ALL_ROWS = 20000;

const asMoney = (value: Prisma.Decimal | null | undefined): Prisma.Decimal =>
  roundMoney(value ?? ZERO);

const toMoneyString = (value: Prisma.Decimal | null | undefined): string =>
  asMoney(value).toFixed(2);

const getIssuedAtSortOrder = (sort: "issuedAt:asc" | "issuedAt:desc") =>
  sort === "issuedAt:desc" ? "desc" : "asc";

const buildReportCacheKey = (prefix: string, input: object) =>
  `reports:${prefix}:${Buffer.from(JSON.stringify(input)).toString("base64url")}`;

const withReportCache = async <T>(
  key: string,
  factory: () => Promise<T>,
): Promise<T> => {
  try {
    const cached = await redisClient.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch (err) {
    logger.warn(
      { err, key },
      "[reports-cache] read failed, continuing without cache",
    );
  }

  const value = await factory();

  try {
    await redisClient.set(
      key,
      JSON.stringify(value),
      "EX",
      REPORT_CACHE_TTL_SECONDS,
    );
  } catch (err) {
    logger.warn(
      { err, key },
      "[reports-cache] write failed, continuing without cache",
    );
  }

  return value;
};

const getCustomerState = (address: Prisma.JsonValue): string => {
  if (address && typeof address === "object" && !Array.isArray(address)) {
    const state = (address as Record<string, unknown>).state;
    if (typeof state === "string") {
      return state;
    }
  }
  return "";
};

export const getGstReportSummary = async (
  input: GstReportQueryInput,
): Promise<GstSummaryReport> => {
  const cacheKey = buildReportCacheKey("gst:summary", {
    from: input.from,
    to: input.to,
    type: input.type,
    page: input.page,
    limit: input.limit,
    sort: input.sort,
    exportAll: false,
  });

  return withReportCache(cacheKey, async () => {
    const issuedAt = buildUtcDateRange(input.from, input.to);
    const aggregates = await getGstSummaryAggregates(prisma, issuedAt);

    return {
      totalInvoices: aggregates.totalInvoices,
      totalTaxableValue: toMoneyString(
        aggregates.itemTaxableSums._sum.taxableValue,
      ),
      totalGST: toMoneyString(aggregates.invoiceTaxSums._sum.taxAmount),
      totalCGST: toMoneyString(aggregates.invoiceTaxSums._sum.cgst),
      totalSGST: toMoneyString(aggregates.invoiceTaxSums._sum.sgst),
      totalIGST: toMoneyString(aggregates.invoiceTaxSums._sum.igst),
    };
  });
};

export const getGstReportDetailed = async (
  input: GstReportQueryInput | GstReportExportQueryInput,
): Promise<GstDetailedReport> => {
  const requestedPage = input.page ?? 1;
  const requestedLimit = input.limit ?? 50;
  const sort = input.sort;
  const exportAll = "exportAll" in input ? input.exportAll : false;
  const sortOrder = getIssuedAtSortOrder(sort);

  const cacheKey = buildReportCacheKey("gst:detailed", {
    from: input.from,
    to: input.to,
    type: "detailed",
    page: requestedPage,
    limit: requestedLimit,
    sort,
    exportAll,
  });

  return withReportCache(cacheKey, async () => {
    const issuedAt = buildUtcDateRange(input.from, input.to);
    const [totalRows, totalsAgg] = await Promise.all([
      countGstDetailedRows(prisma, issuedAt),
      getGstDetailedTotalsAggregates(prisma, issuedAt),
    ]);

    if (exportAll && totalRows > MAX_EXPORT_ALL_ROWS) {
      throw new AppError(
        413,
        `Requested export has ${totalRows} rows. Maximum allowed is ${MAX_EXPORT_ALL_ROWS}. Narrow the date range or use pagination.`,
        "REPORT_EXPORT_TOO_LARGE",
      );
    }

    const page = exportAll ? 1 : requestedPage;
    const limit = exportAll ? Math.max(totalRows, 1) : requestedLimit;
    const lineRows =
      totalRows === 0
        ? []
        : await findGstDetailedRows(
            prisma,
            issuedAt,
            { page, limit },
            sortOrder,
          );

    const rows = lineRows.map((row) => {
      const customerState = getCustomerState(
        row.invoice.customerAddress as Prisma.JsonValue,
      );
      const isInterState = !!row.invoice.igst && !row.invoice.igst.equals(ZERO);
      const lineTax = asMoney(row.taxAmount);
      const cgst = isInterState ? ZERO : roundMoney(lineTax.div(2));
      const sgst = isInterState ? ZERO : roundMoney(lineTax.minus(cgst));
      const igst = isInterState ? lineTax : ZERO;

      return {
        invoiceNumber: row.invoice.invoiceNumber,
        issuedAt: row.invoice.issuedAt.toISOString(),
        customerState,
        taxableValue: toMoneyString(row.taxableValue),
        gstRate: toMoneyString(row.gstRate),
        cgst: toMoneyString(cgst),
        sgst: toMoneyString(sgst),
        igst: toMoneyString(igst),
        totalAmount: toMoneyString(row.totalPrice),
      };
    });

    const intraTax = asMoney(totalsAgg.intraTax._sum.taxAmount);
    const totalCgst = roundMoney(intraTax.div(2));
    const totalSgst = roundMoney(intraTax.minus(totalCgst));
    const totals: GstDetailedReportTotals = {
      taxableValue: toMoneyString(totalsAgg.taxable._sum.taxableValue),
      cgst: toMoneyString(totalCgst),
      sgst: toMoneyString(totalSgst),
      igst: toMoneyString(totalsAgg.interTax._sum.taxAmount),
    };

    return {
      rows,
      totals,
      pagination: {
        page,
        limit,
        totalRows,
        totalPages: totalRows === 0 ? 0 : Math.ceil(totalRows / limit),
      },
    };
  });
};

const escapeCsv = (value: string) => {
  if (/[,"\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const getGstReportDetailedCsv = async (
  input: GstReportExportQueryInput,
): Promise<string> => {
  const detailed = await getGstReportDetailed(input);
  const header = [
    "invoiceNumber",
    "issuedAt",
    "customerState",
    "taxableValue",
    "gstRate",
    "cgst",
    "sgst",
    "igst",
    "totalAmount",
  ];

  const lines: string[] = [header.join(",")];

  for (const row of detailed.rows) {
    lines.push(
      [
        row.invoiceNumber,
        row.issuedAt,
        row.customerState,
        row.taxableValue,
        row.gstRate,
        row.cgst,
        row.sgst,
        row.igst,
        row.totalAmount,
      ]
        .map(escapeCsv)
        .join(","),
    );
  }

  lines.push(
    [
      "TOTAL",
      "",
      "",
      detailed.totals.taxableValue,
      "",
      detailed.totals.cgst,
      detailed.totals.sgst,
      detailed.totals.igst,
      "",
    ]
      .map(escapeCsv)
      .join(","),
  );

  return lines.join("\n");
};

export const getProfitOverviewReport = async (
  input: OverviewReportQueryInput,
): Promise<ProfitOverviewReport> => {
  const cacheKey = buildReportCacheKey("overview", input);

  return withReportCache(cacheKey, async () => {
    const placedAt = buildUtcDateRange(input.from, input.to);
    const aggregates = await getProfitOverviewAggregates(prisma, placedAt);

    const totalRevenue = asMoney(aggregates.orderSums._sum.productTotal);
    const totalGST = asMoney(aggregates.orderSums._sum.taxAmount);
    const shippingRevenue = asMoney(aggregates.orderSums._sum.shippingAmount);
    const discounts = asMoney(aggregates.orderSums._sum.discountAmount);
    const influencerCommission = asMoney(
      aggregates.influencerSums._sum.commissionAmount,
    );

    const profit = roundMoney(
      totalRevenue
        .plus(shippingRevenue)
        .minus(discounts)
        .minus(influencerCommission),
    );

    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalGST: totalGST.toFixed(2),
      shippingRevenue: shippingRevenue.toFixed(2),
      discounts: discounts.toFixed(2),
      influencerCommission: influencerCommission.toFixed(2),
      profit: profit.toFixed(2),
    };
  });
};
