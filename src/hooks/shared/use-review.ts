"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { reviewService } from "@/services/review.service";
import type { CreateReviewPayload } from "@/types/review.types";

export const reviewKeys = {
  byUser: (userId: string) => ["review", userId] as const,
};

export function useCreateReview() {
  return useMutation({
    mutationFn: (payload: CreateReviewPayload) => reviewService.createReview(payload),
  });
}

export function useReviewsByUser(userId: string) {
  return useQuery({
    queryKey: reviewKeys.byUser(userId),
    queryFn: () => reviewService.getByUserId(userId),
    enabled: !!userId,
  });
}
