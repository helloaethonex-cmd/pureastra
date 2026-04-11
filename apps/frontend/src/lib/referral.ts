export const REFERRAL_STORAGE_KEY = "pureastra.referral";
const REFERRAL_TTL_MS = 24 * 60 * 60 * 1000;

export interface ReferralAttribution {
  code: string;
  expiresAt: number;
  influencerName?: string;
}

const normalizeStored = (
  value: Partial<ReferralAttribution> | null | undefined,
): ReferralAttribution | null => {
  if (!value || typeof value.code !== "string" || typeof value.expiresAt !== "number") {
    return null;
  }

  const code = normalizeReferralCode(value.code);
  if (!code || Number.isNaN(value.expiresAt) || value.expiresAt <= 0) {
    return null;
  }

  return {
    code,
    expiresAt: value.expiresAt,
    influencerName:
      typeof value.influencerName === "string" && value.influencerName.trim()
        ? value.influencerName.trim()
        : undefined,
  };
};

export const normalizeReferralCode = (raw: string) => raw.trim().toUpperCase().slice(0, 30);

export const saveReferralAttribution = (code: string, influencerName?: string) => {
  if (typeof window === "undefined") return;

  const normalizedCode = normalizeReferralCode(code);
  if (!normalizedCode) return;

  const payload: ReferralAttribution = {
    code: normalizedCode,
    expiresAt: Date.now() + REFERRAL_TTL_MS,
    ...(influencerName?.trim() ? { influencerName: influencerName.trim() } : {}),
  };

  window.localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(payload));
};

export const clearReferralAttribution = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
};

export const getActiveReferralAttribution = (): ReferralAttribution | null => {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(REFERRAL_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<ReferralAttribution>;
    const normalized = normalizeStored(parsed);
    if (!normalized) {
      clearReferralAttribution();
      return null;
    }

    if (normalized.expiresAt <= Date.now()) {
      clearReferralAttribution();
      return null;
    }

    return normalized;
  } catch {
    clearReferralAttribution();
    return null;
  }
};
