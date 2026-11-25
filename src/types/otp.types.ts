import type { OtpType } from "./auth.types";

export interface VerifyOtpPayload {
  otp: string;
}

export interface VerifyOtpQuery {
  type: OtpType;
}

export interface SendOtpEmailPayload {
  email: string;
}

export interface SendOtpPhonePayload {
  countryCode: string;
  phone: string;
}
