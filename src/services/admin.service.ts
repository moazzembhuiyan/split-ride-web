import { howl } from "@/lib/api";
import type {
  AccountDeletion,
  AccountDeletionListResponse,
  AdminMeta,
  MetaAmountSort,
} from "@/types/admin.types";
import type { ApiResponse } from "@/types/base";

export const adminService = {
  getMeta: (amount?: MetaAmountSort) => {
    const query = amount ? `?amount=${amount}` : "";
    return howl<ApiResponse<AdminMeta>>(`/meta${query}`);
  },

  getAllAccountDeletions: (
    page?: number,
    limit?: number,
    query?: { role?: "user" | "provider"; searchTerm?: string },
  ) => {
    const params = new URLSearchParams();
    if (page) params.set("page", String(page));
    if (limit) params.set("limit", String(limit));
    if (query?.role) params.set("role", query.role);
    if (query?.searchTerm) params.set("searchTerm", query.searchTerm);
    return howl<AccountDeletionListResponse>(
      `/account-deletion?${params.toString()}`,
    );
  },

  getAccountDeletionById: (id: string) =>
    howl<ApiResponse<AccountDeletion>>(`/account-deletion/${id}`),

  deleteAccountDeletion: (id: string) =>
    howl<ApiResponse<null>>(`/account-deletion/${id}`, { method: "DELETE" }),
};
