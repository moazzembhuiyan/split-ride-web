import { howl } from "@/lib/api";
import type { ApiResponse } from "@/types/base";
import type { CreateFaqPayload, Faq, GetFaqQuery, UpdateFaqPayload } from "@/types/faq.types";

export const faqService = {
  getFaqs: (query?: GetFaqQuery) => {
    const qs = query?.audience ? `?audience=${query.audience}` : "";
    return howl<ApiResponse<Faq[]>>(`/faq${qs}`);
  },

  createFaq: (payload: CreateFaqPayload) =>
    howl<ApiResponse<Faq>>("/faq", { method: "POST", body: payload }),

  updateFaq: (id: string, payload: UpdateFaqPayload) =>
    howl<ApiResponse<Faq>>(`/faq/${id}`, { method: "PUT", body: payload }),

  deleteFaq: (id: string) =>
    howl<ApiResponse<null>>(`/faq/${id}`, { method: "DELETE" }),
};
