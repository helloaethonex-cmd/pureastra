"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyProfile } from "@/services/api";

export function useMyProfile(enabled = true) {
  return useQuery({
    queryKey: ["me"],
    queryFn: getMyProfile,
    enabled,
    staleTime: 1000 * 60 * 2,
  });
}
