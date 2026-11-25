"use client";

import { useMutation } from "@tanstack/react-query";
import { otpService } from "@/services/otp.service";
import type { OtpType } from "@/types/auth.types";
import type { SendOtpEmailPayload, SendOtpPhonePayload } from "@/types/otp.types";

export function useVerifyOtp(type: OtpType, otpToken?: string) {
  return useMutation({
    mutationFn: ({ otp }: { otp: string }) =>
      otpService.verifyOtp({ otp }, { type }, otpToken),
  });
}

export function useSendOtpEmail() {
  return useMutation({
    mutationFn: (payload: SendOtpEmailPayload) => otpService.sendOtpEmail(payload),
  });
}

export function useSendOtpPhoneViaToken() {
  return useMutation({
    mutationFn: (payload: SendOtpPhonePayload) => otpService.sendOtpPhoneViaToken(payload),
  });
}

export function useSendOtpPhoneDirect() {
  return useMutation({
    mutationFn: (payload: SendOtpPhonePayload) => otpService.sendOtpPhoneDirect(payload),
  });
}
