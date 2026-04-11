const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export const validateGstin = (value: string): string | null => {
  const gstin = value.trim().toUpperCase();

  if (gstin.length !== 15) {
    return `GSTIN must be exactly 15 characters, got ${gstin.length}`;
  }

  if (!/^[A-Z0-9]{15}$/.test(gstin)) {
    return "GSTIN must be alphanumeric (uppercase letters and digits only)";
  }

  if (!GSTIN_REGEX.test(gstin)) {
    return "GSTIN format is invalid";
  }

  return null;
};
