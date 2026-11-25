"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { byNewest, fetchAllRows } from "@/lib/admin-list";
import { userService } from "@/services/user.service";
import { useUserStore } from "@/store/user-store";
import type {
  ChangeEmailPayload,
  ChangePhonePayload,
  ChangeUserStatusPayload,
  DeleteProfilePayload,
  GetUsersQuery,
  UpdateLocationPayload,
  UpdateProfilePayload,
} from "@/types/user.types";
import { bookingService } from "@/services/booking.service";

export const userKeys = {
  me: ["user", "me"] as const,
  list: (query?: GetUsersQuery) => ["user", "list", query] as const,
  detail: (id: string) => ["user", id] as const,
};

export function useMe() {
  return useQuery({
    queryKey: userKeys.me,
    queryFn: () => userService.getMe(),
  });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      userService.updateMe(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.me }),
  });
}

export function useChangeEmail() {
  return useMutation({
    mutationFn: (payload: ChangeEmailPayload) =>
      userService.changeEmail(payload),
  });
}

export function useChangePhone() {
  return useMutation({
    mutationFn: (payload: ChangePhonePayload) =>
      userService.changePhone(payload),
  });
}

export function useUpdateLocation() {
  return useMutation({
    mutationFn: (payload: UpdateLocationPayload) =>
      userService.updateLocation(payload),
  });
}

export function useDeleteMe() {
  return useMutation({
    mutationFn: (payload: DeleteProfilePayload) =>
      userService.deleteMe(payload),
  });
}

/**
 * Every matching user, newest first. The role is checked here as well because
 * the API does not reliably apply its role filter.
 */
export function useAllUsers(query: Omit<GetUsersQuery, "page" | "limit">) {
  return useQuery({
    queryKey: userKeys.list(query),
    queryFn: async () => {
      const users = await fetchAllRows((page, limit) =>
        userService.getUsers({
          ...query,
          sortField: "createdAt",
          sortOrder: "desc",
          page,
          limit,
        }),
      );
      return users
        .filter((user) => !query.role || user.role === query.role)
        .sort(byNewest);
    },
  });
}

export function useUserById(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userService.getUserById(id),
    enabled: options?.enabled !== undefined ? options.enabled : !!id,
  });
}

export function useChangeUserStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ChangeUserStatusPayload) =>
      userService.changeUserStatus(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user", "list"] });
      qc.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}
export function useDeleteUser(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      userService.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user", "list"] });
      qc.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}
export function useDeleteRide(rideId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      bookingService.deleteRide(rideId),
    onSuccess: () => {
      // Lists only: refetching the deleted ride itself would return 404.
      qc.invalidateQueries({ queryKey: ["booking"] });
      qc.invalidateQueries({ queryKey: ["admin", "meta"] });
    },
  });
}

export function useUserIdSync() {
  const { data, refetch } = useMe();
  const setUserId = useUserStore((s) => s.setUserId);
  const clearUserId = useUserStore((s) => s.clearUserId);
  const userId = useUserStore((s) => s.userId);

  useEffect(() => {
    const id = data?.data?._id ?? data?.data?.id;
    if (id) {
      setUserId(id);
    } else {
      clearUserId();
    }
  }, [data, setUserId, clearUserId]);

  useEffect(() => {
    if (!userId) {
      const hasToken =
        typeof document !== "undefined" && document.cookie.includes("token=");
      if (hasToken) refetch();
    }
  }, [userId, refetch]);
}
