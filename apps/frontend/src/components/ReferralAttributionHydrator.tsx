"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { validateInfluencerReferral } from "@/services/api";
import {
  normalizeReferralCode,
  saveReferralAttribution,
} from "@/lib/referral";

export default function ReferralAttributionHydrator() {
  const searchParams = useSearchParams();
  const lastProcessed = useRef<string | null>(null);
  const referralFromUrl = searchParams.get("ref") ?? "";

  useEffect(() => {
    const normalized = normalizeReferralCode(referralFromUrl);

    if (!normalized || lastProcessed.current === normalized) {
      return;
    }

    lastProcessed.current = normalized;

    let cancelled = false;

    validateInfluencerReferral(normalized)
      .then((result) => {
        if (cancelled || !result.valid || !result.referralCode) return;
        saveReferralAttribution(result.referralCode, result.name);
      })
      .catch(() => {
        // Silent fail: attribution should never break page rendering.
      });

    return () => {
      cancelled = true;
    };
  }, [referralFromUrl]);

  return null;
}
