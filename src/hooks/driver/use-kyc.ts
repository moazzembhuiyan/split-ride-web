"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { kycService } from "@/services/driver.service";
import type { ChangeKycStatusPayload, ProviderKyc } from "@/types/driver.types";

export const kycKeys = {
  all: ["kyc", "all"] as const,
  detail: (id: string) => ["kyc", id] as const,
};

export function useSetupKyc() {
  return useMutation({
    mutationFn: (payload: Partial<ProviderKyc>) => kycService.setupKyc(payload),
  });
}

export function useAllKyc() {
  return useQuery({
    queryKey: kycKeys.all,
    queryFn: () => kycService.getAllKyc(),
  });
}

export function useKycById(id: string) {
  return useQuery({
    queryKey: kycKeys.detail(id),
    queryFn: () => kycService.getKycById(id),
    enabled: !!id,
  });
}
export function useKycByUserId(userId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: kycKeys.detail(userId),
    queryFn: () => kycService.getKycByUserId(userId),
    enabled: options?.enabled !== undefined ? options.enabled : !!userId,
  });
}

export function useChangeKycStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ChangeKycStatusPayload) => kycService.changeKycStatus(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: kycKeys.all });
      qc.invalidateQueries({ queryKey: kycKeys.detail(id) });
    },
  });
}
