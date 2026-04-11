import { Prisma } from "../generated/prisma/client";

const ZERO = new Prisma.Decimal(0);
const HUNDRED = new Prisma.Decimal(100);

export const roundMoney = (value: Prisma.Decimal) =>
  value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

export const normalizeStateCode = (value: string) => value.trim().toUpperCase();

export type GstLineComputation = {
  unitInclusivePrice: Prisma.Decimal;
  quantity: number;
  gstRate: Prisma.Decimal;
  unitBasePrice: Prisma.Decimal;
  unitTaxPrice: Prisma.Decimal;
  lineBaseAmount: Prisma.Decimal;
  lineTaxAmount: Prisma.Decimal;
  lineInclusiveAmount: Prisma.Decimal;
};

export const computeGstForInclusivePriceLine = (
  unitInclusivePrice: Prisma.Decimal,
  quantity: number,
  gstRateInput: Prisma.Decimal,
): GstLineComputation => {
  const safeRate = gstRateInput.lt(ZERO) ? ZERO : gstRateInput;
  const divisor = new Prisma.Decimal(1).plus(safeRate.div(HUNDRED));

  const unitBasePrice = roundMoney(unitInclusivePrice.div(divisor));
  const unitTaxPrice = roundMoney(unitInclusivePrice.minus(unitBasePrice));

  const qty = new Prisma.Decimal(quantity);
  const lineBaseAmount = roundMoney(unitBasePrice.mul(qty));
  const lineTaxAmount = roundMoney(unitTaxPrice.mul(qty));
  const lineInclusiveAmount = roundMoney(unitInclusivePrice.mul(qty));

  return {
    unitInclusivePrice: roundMoney(unitInclusivePrice),
    quantity,
    gstRate: roundMoney(safeRate),
    unitBasePrice,
    unitTaxPrice,
    lineBaseAmount,
    lineTaxAmount,
    lineInclusiveAmount,
  };
};

export type GstOrderLineInput = {
  quantity: number;
  unitInclusivePrice: Prisma.Decimal;
  gstRate: Prisma.Decimal;
};

export type GstOrderLineResult = {
  quantity: number;
  gstRate: Prisma.Decimal;
  unitInclusivePrice: Prisma.Decimal;
  lineInclusiveAmount: Prisma.Decimal;
  discountShare: Prisma.Decimal;
  lineInclusiveAfterDiscount: Prisma.Decimal;
  unitBasePrice: Prisma.Decimal;
  lineBaseAmount: Prisma.Decimal;
  lineTaxAmount: Prisma.Decimal;
};

export type GstOrderTotals = {
  lines: GstOrderLineResult[];
  discountApplied: Prisma.Decimal;
  productBaseAmount: Prisma.Decimal;
  itemTaxAmount: Prisma.Decimal;
  shippingBaseAmount: Prisma.Decimal;
  shippingTaxAmount: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  grandTotal: Prisma.Decimal;
};

export const computeOrderTotalsFromInclusivePricing = (
  lines: GstOrderLineInput[],
  discountAmountInclusive: Prisma.Decimal,
  shippingAmountInclusive: Prisma.Decimal,
  shippingGstRate: Prisma.Decimal,
): GstOrderTotals => {
  const lineInclusiveTotals = lines.map((line) =>
    roundMoney(line.unitInclusivePrice.mul(line.quantity)),
  );
  const itemsInclusiveTotal = roundMoney(
    lineInclusiveTotals.reduce(
      (sum, value) => sum.plus(value),
      new Prisma.Decimal(0),
    ),
  );

  const cappedDiscount = discountAmountInclusive.lt(ZERO)
    ? ZERO
    : discountAmountInclusive.gt(itemsInclusiveTotal)
      ? itemsInclusiveTotal
      : discountAmountInclusive;

  const discountShares = lines.map(() => ZERO);
  if (cappedDiscount.gt(ZERO) && itemsInclusiveTotal.gt(ZERO)) {
    let allocated = new Prisma.Decimal(0);
    for (let i = 0; i < lines.length; i += 1) {
      const isLast = i === lines.length - 1;
      if (isLast) {
        discountShares[i] = roundMoney(cappedDiscount.minus(allocated));
      } else {
        const share = roundMoney(
          cappedDiscount.mul(lineInclusiveTotals[i]).div(itemsInclusiveTotal),
        );
        discountShares[i] = share;
        allocated = allocated.plus(share);
      }
    }
  }

  const computedLines = lines.map((line, index) => {
    const lineInclusiveAmount = lineInclusiveTotals[index];
    const discountShare = discountShares[index];
    const lineInclusiveAfterDiscount = roundMoney(
      lineInclusiveAmount.minus(discountShare).lt(ZERO)
        ? ZERO
        : lineInclusiveAmount.minus(discountShare),
    );

    const divisor = new Prisma.Decimal(1).plus(line.gstRate.div(HUNDRED));
    const lineBaseAmount = roundMoney(lineInclusiveAfterDiscount.div(divisor));
    const lineTaxAmount = roundMoney(
      lineInclusiveAfterDiscount.minus(lineBaseAmount),
    );
    const unitInclusivePrice = roundMoney(
      lineInclusiveAfterDiscount.div(line.quantity),
    );
    const unitBasePrice = roundMoney(lineBaseAmount.div(line.quantity));

    return {
      quantity: line.quantity,
      gstRate: roundMoney(line.gstRate),
      unitInclusivePrice,
      lineInclusiveAmount,
      discountShare,
      lineInclusiveAfterDiscount,
      unitBasePrice,
      lineBaseAmount,
      lineTaxAmount,
    };
  });

  const productBaseAmount = roundMoney(
    computedLines.reduce(
      (sum, line) => sum.plus(line.lineBaseAmount),
      new Prisma.Decimal(0),
    ),
  );
  const itemTaxAmount = roundMoney(
    computedLines.reduce(
      (sum, line) => sum.plus(line.lineTaxAmount),
      new Prisma.Decimal(0),
    ),
  );

  const shippingDivisor = new Prisma.Decimal(1).plus(
    shippingGstRate.div(HUNDRED),
  );
  const shippingBaseAmount = roundMoney(
    shippingAmountInclusive.div(shippingDivisor),
  );
  const shippingTaxAmount = roundMoney(
    shippingAmountInclusive.minus(shippingBaseAmount),
  );

  const taxAmount = roundMoney(itemTaxAmount.plus(shippingTaxAmount));
  const grandTotal = roundMoney(
    productBaseAmount.plus(shippingBaseAmount).plus(taxAmount),
  );

  return {
    lines: computedLines,
    discountApplied: roundMoney(cappedDiscount),
    productBaseAmount,
    itemTaxAmount,
    shippingBaseAmount,
    shippingTaxAmount,
    taxAmount,
    grandTotal,
  };
};
