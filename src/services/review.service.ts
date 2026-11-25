import { howl } from "@/lib/api";
import type { ApiResponse } from "@/types/base";
import type { CreateReviewPayload, Review } from "@/types/review.types";

export const reviewService = {
  createReview: (payload: CreateReviewPayload) =>
    howl<ApiResponse<Review>>("/review", { method: "POST", body: payload }),

  getByUserId: (userId: string) =>
    howl<ApiResponse<Review[]>>(`/review/${userId}`),
};
