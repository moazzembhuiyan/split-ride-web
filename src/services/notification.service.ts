import { howl } from "@/lib/api";
import type { ApiResponse } from "@/types/base";
import type { Notification } from "@/types/notification.types";

export const notificationService = {
  getMyNotifications: () =>
    howl<ApiResponse<Notification[]>>("/notification?sort=desc"),

  markDone: (id: string) =>
    howl<ApiResponse<null>>(`/notification/${id}`, { method: "PATCH", body: { done: true } }),

  markAllDone: () =>
    howl<ApiResponse<null>>("/notification", { method: "PATCH" }),

  deleteOne: (id: string) =>
    howl<ApiResponse<null>>(`/notification/${id}`, { method: "DELETE" }),

  deleteMyAll: () =>
    howl<ApiResponse<null>>("/notification/my-notifications", { method: "DELETE" }),
};
