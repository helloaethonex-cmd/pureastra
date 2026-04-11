"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getMyInfluencerDashboard,
  validateInfluencerReferral,
} from "@/services/api";

export function useMyInfluencerDashboard(enabled = true) {
  return useQuery({
    queryKey: ["influencer", "dashboard"],
    queryFn: getMyInfluencerDashboard,
    enabled,
    staleTime: 1000 * 60,
    retry: false,
  });
}

export function useValidateInfluencerReferral(
  code: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ["influencer", "validate", code],
    queryFn: () => validateInfluencerReferral(code!),
    enabled: Boolean(code) && enabled,
    staleTime: 1000 * 60 * 10,
    retry: false,
  });
}
