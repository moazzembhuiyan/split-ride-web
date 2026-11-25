"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { byNewest } from "@/lib/admin-list";
import { notificationService } from "@/services/notification.service";

export const notificationKeys = {
  my: ["notifications", "my"] as const,
};

export function useMyNotifications() {
  return useQuery({
    queryKey: notificationKeys.my,
    queryFn: () => notificationService.getMyNotifications(),
    select: (res) => ({
      ...res,
      data: [...new Map((res.data ?? []).map((n) => [n._id, n])).values()].sort(
        byNewest,
      ),
    }),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useMarkAllNotificationsDone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllDone(),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.my }),
  });
}

export function useMarkNotificationDone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markDone(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.my }),
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.deleteOne(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.my }),
  });
}

export function useDeleteMyNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.deleteMyAll(),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.my }),
  });
}
