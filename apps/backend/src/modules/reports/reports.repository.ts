import { Prisma } from "../../generated/prisma/client";

type TxClient = Prisma.TransactionClient;
const ZERO_DECIMAL = new Prisma.Decimal(0);

type DateRangeFilter = {
  gte?: Date;
  lte?: Date;
};

const buildInvoiceItemWhere = (
  issuedAt?: DateRangeFilter,
): Prisma.InvoiceItemWhereInput => {
  if (!issuedAt) {
    return {};
  }

  return {
    invoice: { issuedAt },
  };
};

export const getGstSummaryAggregates = async (
  tx: TxClient,
  issuedAt?: DateRangeFilter,
) => {
  const invoiceWhere: Prisma.InvoiceWhereInput = issuedAt ? { issuedAt } : {};

  const [totalInvoices, invoiceTaxSums, itemTaxableSums] = await Promise.all([
    tx.invoice.count({ where: invoiceWhere }),
    tx.invoice.aggregate({
      where: invoiceWhere,
      _sum: {
        taxAmount: true,
        cgst: true,
        sgst: true,
        igst: true,
      },
    }),
    tx.invoiceItem.aggregate({
      where: issuedAt ? { invoice: { issuedAt } } : undefined,
      _sum: {
        taxableValue: true,
      },
    }),
  ]);

  return {
    totalInvoices,
    invoiceTaxSums,
    itemTaxableSums,
  };
};

export const countGstDetailedRows = (
  tx: TxClient,
  issuedAt?: DateRangeFilter,
) => {
  return tx.invoiceItem.count({ where: buildInvoiceItemWhere(issuedAt) });
};

export const findGstDetailedRows = (
  tx: TxClient,
  issuedAt: DateRangeFilter | undefined,
  pagination: { page: number; limit: number },
  sortOrder: "asc" | "desc",
) => {
  const skip = (pagination.page - 1) * pagination.limit;

  return tx.invoiceItem.findMany({
    where: buildInvoiceItemWhere(issuedAt),
    orderBy: [{ invoice: { issuedAt: sortOrder } }, { id: "asc" }],
    skip,
    take: pagination.limit,
    select: {
      gstRate: true,
      taxableValue: true,
      taxAmount: true,
      totalPrice: true,
      invoice: {
        select: {
          invoiceNumber: true,
          issuedAt: true,
          customerAddress: true,
          igst: true,
        },
      },
    },
  });
};

export const getGstDetailedTotalsAggregates = async (
  tx: TxClient,
  issuedAt?: DateRangeFilter,
) => {
  const whereAll = buildInvoiceItemWhere(issuedAt);
  const whereIntra: Prisma.InvoiceItemWhereInput = {
    invoice: issuedAt
      ? { issuedAt, OR: [{ igst: null }, { igst: { equals: ZERO_DECIMAL } }] }
      : { OR: [{ igst: null }, { igst: { equals: ZERO_DECIMAL } }] },
  };
  const whereInter: Prisma.InvoiceItemWhereInput = {
    invoice: issuedAt
      ? { issuedAt, igst: { gt: ZERO_DECIMAL } }
      : { igst: { gt: ZERO_DECIMAL } },
  };

  const [taxable, intraTax, interTax] = await Promise.all([
    tx.invoiceItem.aggregate({
      where: whereAll,
      _sum: { taxableValue: true },
    }),
    tx.invoiceItem.aggregate({
      where: whereIntra,
      _sum: { taxAmount: true },
    }),
    tx.invoiceItem.aggregate({
      where: whereInter,
      _sum: { taxAmount: true },
    }),
  ]);

  return {
    taxable,
    intraTax,
    interTax,
  };
};

export const getProfitOverviewAggregates = async (
  tx: TxClient,
  placedAt?: DateRangeFilter,
) => {
  const orderWhere: Prisma.OrderWhereInput = {
    ...(placedAt && { placedAt }),
  };

  const influencerWhere: Prisma.InfluencerSaleWhereInput = placedAt
    ? { order: { placedAt }, status: { not: "CANCELLED" } }
    : { status: { not: "CANCELLED" } };

  const [orderSums, influencerSums] = await Promise.all([
    tx.order.aggregate({
      where: orderWhere,
      _sum: {
        productTotal: true,
        taxAmount: true,
        shippingAmount: true,
        discountAmount: true,
      },
    }),
    tx.influencerSale.aggregate({
      where: influencerWhere,
      _sum: {
        commissionAmount: true,
      },
    }),
  ]);

  return {
    orderSums,
    influencerSums,
  };
};
