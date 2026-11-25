import { howl } from "@/lib/api";
import type { ApiResponse } from "@/types/base";
import type { LoginResponse, OtpTokenResponse } from "@/types/auth.types";
import type {
  SendOtpEmailPayload,
  SendOtpPhonePayload,
  VerifyOtpPayload,
  VerifyOtpQuery,
} from "@/types/otp.types";

export const otpService = {
  verifyOtp: (payload: VerifyOtpPayload, query: VerifyOtpQuery, token?: string) =>
    howl<ApiResponse<LoginResponse | OtpTokenResponse>>(
      `/otp/verify?type=${query.type}`,
      { method: "POST", body: payload, ...(token ? { token } : {}) }
    ),

  sendOtpEmail: (payload: SendOtpEmailPayload) =>
    howl<ApiResponse<null>>("/otp/send-otp-in-email", { method: "POST", body: payload }),

  sendOtpPhoneViaToken: (payload: SendOtpPhonePayload) =>
    howl<ApiResponse<null>>("/otp/send-otp-via-token-in-phone", { method: "POST", body: payload }),

  sendOtpPhoneDirect: (payload: SendOtpPhonePayload) =>
    howl<ApiResponse<OtpTokenResponse>>("/otp/send-otp-via-direct-phone", { method: "POST", body: payload }),
};
