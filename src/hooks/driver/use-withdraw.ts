"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { withdrawService } from "@/services/driver.service";
import type { ChangeWithdrawStatusPayload, CreateWithdrawPayload, GetWithdrawsQuery } from "@/types/driver.types";

export const withdrawKeys = {
  my: (query?: GetWithdrawsQuery) => ["withdraw", "my", query] as const,
  all: (query?: GetWithdrawsQuery) => ["withdraw", "all", query] as const,
  detail: (id: string) => ["withdraw", id] as const,
};

export function useCreateWithdraw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWithdrawPayload) => withdrawService.createWithdraw(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["withdraw"] }),
  });
}

export function useMyWithdraws(query?: GetWithdrawsQuery) {
  return useQuery({
    queryKey: withdrawKeys.my(query),
    queryFn: () => withdrawService.getMyWithdraws(query),
  });
}

export function useAllWithdraws(query?: GetWithdrawsQuery) {
  return useQuery({
    queryKey: withdrawKeys.all(query),
    queryFn: () => withdrawService.getAllWithdraws(query),
  });
}

export function useWithdrawById(id: string) {
  return useQuery({
    queryKey: withdrawKeys.detail(id),
    queryFn: () => withdrawService.getWithdrawById(id),
    enabled: !!id,
  });
}

export function useChangeWithdrawStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ChangeWithdrawStatusPayload) => withdrawService.changeWithdrawStatus(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["withdraw"] }),
  });
}
