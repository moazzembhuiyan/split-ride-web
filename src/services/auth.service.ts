import { howl } from "@/lib/api";
import type { ApiResponse } from "@/types/base";
import type {
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginResponse,
  LoginWithEmailPayload,
  LoginWithPhonePayload,
  OtpTokenResponse,
  RegisterPayload,
  ResetPasswordPayload,
  SocialLoginPayload,
} from "@/types/auth.types";

export const authService = {
  register: (payload: RegisterPayload) =>
    howl<ApiResponse<OtpTokenResponse>>("/auth/register", { method: "POST", body: payload }),

  loginWithPhone: (payload: LoginWithPhonePayload) =>
    howl<ApiResponse<OtpTokenResponse>>("/auth/login-with-phone", { method: "POST", body: payload }),

  loginWithEmail: (payload: LoginWithEmailPayload) =>
    howl<ApiResponse<LoginResponse>>("/auth/login-with-email", { method: "POST", body: payload }),

  loginWithGoogle: (payload: SocialLoginPayload) =>
    howl<ApiResponse<LoginResponse>>("/auth/google", { method: "POST", body: payload }),

  loginWithApple: (payload: SocialLoginPayload) =>
    howl<ApiResponse<LoginResponse>>("/auth/apple", { method: "POST", body: payload }),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    howl<ApiResponse<OtpTokenResponse>>("/auth/forgot-password", { method: "POST", body: payload }),

  resetPassword: (payload: ResetPasswordPayload, token?: string) =>
    howl<ApiResponse<null>>("/auth/reset-password", { method: "POST", body: payload, ...(token ? { token } : {}) }),

  changePassword: (payload: ChangePasswordPayload) =>
    howl<ApiResponse<null>>("/auth/change-password", { method: "POST", body: payload }),

  updateFcmToken: (fcmToken: string) =>
    howl<ApiResponse<null>>("/auth/fcm-token", { method: "PATCH", body: { fcmToken } }),

  logout: () =>
    howl<ApiResponse<null>>("/auth/logout", { method: "POST" }),
};
