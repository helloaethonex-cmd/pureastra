import { Prisma } from "../../generated/prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// INVOICE NUMBER FORMAT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format: PA-INV-{year}-{6-digit sequence}
 * Example: PA-INV-2026-000001
 */
export const formatInvoiceNumber = (year: number, sequence: number): string =>
  `PA-INV-${year}-${String(sequence).padStart(6, "0")}`;

// ─────────────────────────────────────────────────────────────────────────────
// PDF STATUS
// ─────────────────────────────────────────────────────────────────────────────

export const PDF_STATUS = {
  PENDING: 0,
  GENERATED: 1,
  FAILED: 2,
} as const;

export type PdfStatusValue = (typeof PDF_STATUS)[keyof typeof PDF_STATUS];

// ─────────────────────────────────────────────────────────────────────────────
// GSTIN VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate Indian GSTIN format:
 *   - Must be exactly 15 characters
 *   - Must be alphanumeric (uppercase letters + digits)
 *   - Returns null if valid, error message string if invalid
 *
 * We return a message rather than throwing so callers can decide
 * how to handle it (warn vs. hard fail) based on context.
 */
export const validateGstin = (gstin: string): string | null => {
  if (gstin.length !== 15) {
    return `GSTIN must be exactly 15 characters, got ${gstin.length}`;
  }
  if (!/^[A-Z0-9]{15}$/.test(gstin)) {
    return "GSTIN must be alphanumeric (uppercase letters and digits only)";
  }
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// GST COMPUTATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalize state name for comparison (uppercase, trimmed).
 * Prevents mismatches from casing or whitespace differences.
 */
export const normalizeState = (state: string): string =>
  state.trim().toUpperCase();

export type GstBreakdown = {
  cgst: Prisma.Decimal | null;
  sgst: Prisma.Decimal | null;
  igst: Prisma.Decimal | null;
};

/**
 * Compute GST breakdown from total tax amount.
 *
 * Rules (GST India):
 *   - Same state (intra-state):  CGST = taxAmount/2,  SGST = taxAmount/2,  IGST = null
 *   - Different state (inter-state): CGST = null,         SGST = null,         IGST = taxAmount
 *   - If taxAmount is zero, all values are null.
 *
 * All arithmetic uses Prisma.Decimal to avoid float drift.
 */
export const computeGstBreakdown = (
  taxAmount: Prisma.Decimal,
  customerState: string,
  sellerState: string,
): GstBreakdown => {
  const ZERO = new Prisma.Decimal(0);

  // No tax → no GST split
  if (taxAmount.equals(ZERO)) {
    return { cgst: null, sgst: null, igst: null };
  }

  const isSameState =
    normalizeState(customerState) === normalizeState(sellerState);

  if (isSameState) {
    // Intra-state: split equally into CGST + SGST
    const half = taxAmount
      .div(2)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    return { cgst: half, sgst: half, igst: null };
  }

  // Inter-state: full IGST
  return { cgst: null, sgst: null, igst: taxAmount };
};
