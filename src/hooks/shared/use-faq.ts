"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { faqService } from "@/services/faq.service";
import type { CreateFaqPayload, FaqAudience, UpdateFaqPayload } from "@/types/faq.types";

export const faqKeys = {
  list: (audience?: FaqAudience) => ["faq", audience] as const,
};

export function useFaqs(audience?: FaqAudience) {
  return useQuery({
    queryKey: faqKeys.list(audience),
    queryFn: () => faqService.getFaqs({ audience }),
  });
}

export function useCreateFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFaqPayload) => faqService.createFaq(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["faq"] }),
  });
}

export function useUpdateFaq(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateFaqPayload) => faqService.updateFaq(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["faq"] }),
  });
}

export function useDeleteFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => faqService.deleteFaq(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["faq"] }),
  });
}
