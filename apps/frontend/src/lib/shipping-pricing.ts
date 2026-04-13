const round2 = (value: number) => Math.round(value * 100) / 100;

const parseNumber = (value: string | undefined): number | null => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const SHIPPING_GST_RATE =
  parseNumber(process.env.NEXT_PUBLIC_SHIPPING_GST_RATE) ?? 18;

const CONFIGURED_SHIPPING_INCLUSIVE = parseNumber(
  process.env.NEXT_PUBLIC_FLAT_SHIPPING_CHARGE_INCLUSIVE,
);

export const toMoneyNumber = (
  value: number | string | null | undefined,
): number => {
  const parsed = typeof value === "string" ? Number.parseFloat(value) : value;
  return Number.isFinite(parsed) ? Number(parsed) : 0;
};

export const getConfiguredShippingInclusive = (): number | null =>
  CONFIGURED_SHIPPING_INCLUSIVE;

export const toShippingInclusiveFromBase = (
  baseAmount: number | string | null | undefined,
): {
  inclusive: number;
  gstComponent: number;
} => {
  const base = toMoneyNumber(baseAmount);
  if (base <= 0) {
    return { inclusive: 0, gstComponent: 0 };
  }

  const inclusive = round2(base * (1 + SHIPPING_GST_RATE / 100));
  const gstComponent = round2(Math.max(inclusive - base, 0));
  return { inclusive, gstComponent };
};
