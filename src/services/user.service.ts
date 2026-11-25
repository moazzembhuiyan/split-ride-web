import { howl } from "@/lib/api";
import type { ApiResponse, PagedResponse } from "@/types/base";
import type { User } from "@/types/user.types";
import type {
  ChangeEmailPayload,
  ChangePhonePayload,
  ChangeUserStatusPayload,
  DeleteProfilePayload,
  GetUsersQuery,
  UpdateLocationPayload,
  UpdateProfilePayload,
} from "@/types/user.types";

export const userService = {
  getMe: () =>
    howl<ApiResponse<User>>("/user/me"),

  updateMe: (payload: UpdateProfilePayload) =>
    howl<ApiResponse<User>>("/user/me", { method: "PUT", body: payload }),

  changeEmail: (payload: ChangeEmailPayload) =>
    howl<ApiResponse<null>>("/user/change-email", { method: "PUT", body: payload }),

  changePhone: (payload: ChangePhonePayload) =>
    howl<ApiResponse<null>>("/user/me", { method: "PUT", body: payload }),

  updateLocation: (payload: UpdateLocationPayload) =>
    howl<ApiResponse<null>>("/user/location", { method: "PUT", body: payload }),

  deleteMe: (payload: DeleteProfilePayload) =>
    howl<ApiResponse<null>>("/user/me", { method: "DELETE", body: payload }),

  deleteUser: (userId: string) =>
    howl<ApiResponse<null>>(`/user/${userId}`, { method: "DELETE", body: { reason: "Deleted by admin" } }),

  // Admin
  getUsers: (query?: GetUsersQuery) => {
    const params = new URLSearchParams();
    if (query?.role) params.set("role", query.role);
    if (query?.searchTerm) params.set("searchTerm", query.searchTerm);
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));
    if (query?.sortField) params.set("sortField", query.sortField);
    if (query?.sortOrder) params.set("sortOrder", query.sortOrder);
    const qs = params.toString();
    return howl<PagedResponse<User>>(`/user${qs ? `?${qs}` : ""}`);
  },

  getUserById: (id: string) =>
    howl<ApiResponse<{
      _id: string
      name: string
      email: string
      fcmToken: string
      role: string
      profileImage: string
      documents: Array<any>
      phone: string
      countryCode: string
      location: {
        type: string
        coordinates: Array<number>
      }
      timeZone: string
      registerWith: string
      language: any
      experience: any
      status: string
      isSignUpOtpVerified: boolean
      isLoginOTPVerified: boolean
      isResetPasswordVerified: boolean
      isChangeEmailOtpVerified: boolean
      isChangePhoneOtpVerified: boolean
      isProfileComplete: boolean
      isKycVerified: boolean
      stripeAccountId: any
      customerId: any
      isOnline: boolean
      lastOnlineAt: string
      avgRating: number
      totalRating: number
      isDeleted: boolean
      createdAt: string
      address: string
      dateOfBirth: string
      gender: string
      unreadCount: number
      provider: {
        _id: string
        companyName: string
        companyReg: string
        vatNumber: string
        socialInsurance: string
        cnicFront: string
        cnicBack: string
        licenseFront: string
        licenseBack: string
        carPapers: Array<string>
        status: string
      }
      vehicles: Array<{
        _id: string
        name: string
        number: string
        year: number
        seats: number
        isDefault: boolean
        carPapers?: Array<string>
      }>
      completedRides: number
      todayEarning: number
      isKycSubmitted: boolean
      hasVehicle: boolean
      isConnectedStripe: boolean
      hasDefaultCard: boolean
    }>>(`/user/${id}?t=${Date.now()}`),

  changeUserStatus: (id: string, payload: ChangeUserStatusPayload) =>
    howl<ApiResponse<User>>(`/user/${id}`, { method: "PATCH", body: payload }),
};
