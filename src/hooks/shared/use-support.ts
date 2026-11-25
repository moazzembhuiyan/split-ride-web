"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supportService } from "@/services/support.service";
import type {
  ChangeSupportStatusPayload,
  CreateSupportPayload,
  GetSupportsQuery,
  SendSupportMessagePayload,
} from "@/types/support.types";

export const supportKeys = {
  all: (query?: GetSupportsQuery) => ["supports", query] as const,
};

export function useCreateSupport() {
  return useMutation({
    mutationFn: (payload: CreateSupportPayload) =>
      supportService.createSupport(payload),
  });
}

export function useAllSupports(query?: GetSupportsQuery) {
  return useQuery({
    queryKey: supportKeys.all(query),
    queryFn: () => supportService.getAll(query),
  });
}

export function useSendSupportMessage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendSupportMessagePayload) =>
      supportService.sendMessage(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supports"] }),
  });
}

export function useChangeSupportStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ChangeSupportStatusPayload) =>
      supportService.changeStatus(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supports"] }),
  });
}

export function useDeleteSupport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supportService.deleteSupport(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supports"] }),
  });
}
