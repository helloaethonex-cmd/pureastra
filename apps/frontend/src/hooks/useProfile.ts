"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyProfile, updateMyProfile } from "@/services/api";

export function useMyProfile(enabled = true) {
  return useQuery({
    queryKey: ["me"],
    queryFn: getMyProfile,
    enabled,
    staleTime: 1000 * 60 * 2,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateMyProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
