"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import type { MetaAmountSort } from "@/types/admin.types";

export const adminKeys = {
  meta: ["admin", "meta"] as const,
  accountDeletions: (page = 1, limit = 10) =>
    ["admin", "account-deletions", page, limit] as const,
  accountDeletion: (id: string) => ["admin", "account-deletion", id] as const,
};

export function useAdminMeta(amount?: MetaAmountSort) {
  return useQuery({
    queryKey: [...adminKeys.meta, amount] as const,
    queryFn: () => adminService.getMeta(amount),
  });
}

export function useAllAccountDeletions(
  page = 1,
  limit = 10,
  query?: { role?: "user" | "provider"; searchTerm?: string },
) {
  return useQuery({
    queryKey: [...adminKeys.accountDeletions(page, limit), query] as const,
    queryFn: () => adminService.getAllAccountDeletions(page, limit, query),
    placeholderData: (previous) => previous,
  });
}

export function useAccountDeletionById(id: string) {
  return useQuery({
    queryKey: adminKeys.accountDeletion(id),
    queryFn: () => adminService.getAccountDeletionById(id),
    enabled: !!id,
  });
}

export function useDeleteAccountDeletion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.deleteAccountDeletion(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "account-deletions"] }),
  });
}
