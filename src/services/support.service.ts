import { howl } from "@/lib/api";
import type { ApiResponse, PagedResponse } from "@/types/base";
import type { ChangeSupportStatusPayload, CreateSupportPayload, GetSupportsQuery, SendSupportMessagePayload, Support } from "@/types/support.types";

export const supportService = {
  createSupport: (payload: CreateSupportPayload) =>
    howl<ApiResponse<Support>>("/supports", { method: "POST", body: payload }),

  getAll: (query?: GetSupportsQuery) => {
    const params = new URLSearchParams();
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));
    if (query?.status) params.set("status", query.status);
    if (query?.searchTerm) params.set("searchTerm", query.searchTerm);
    const qs = params.toString();
    return howl<PagedResponse<Support>>(`/supports${qs ? `?${qs}` : ""}`);
  },

  sendMessage: (id: string, payload: SendSupportMessagePayload) =>
    howl<ApiResponse<Support>>(`/supports/${id}`, { method: "POST", body: payload }),

  changeStatus: (id: string, payload: ChangeSupportStatusPayload) =>
    howl<ApiResponse<Support>>(`/supports/${id}`, { method: "PATCH", body: payload }),

  deleteSupport: (id: string) =>
    howl<ApiResponse<null>>(`/supports/${id}`, { method: "DELETE" }),
};
