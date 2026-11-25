"use client";

import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import type {
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginWithEmailPayload,
  LoginWithPhonePayload,
  RegisterPayload,
  ResetPasswordPayload,
  SocialLoginPayload,
} from "@/types/auth.types";

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
  });
}

export function useLoginWithPhone() {
  return useMutation({
    mutationFn: (payload: LoginWithPhonePayload) => authService.loginWithPhone(payload),
  });
}

export function useLoginWithEmail() {
  return useMutation({
    mutationFn: (payload: LoginWithEmailPayload) => authService.loginWithEmail(payload),
  });
}

export function useLoginWithGoogle() {
  return useMutation({
    mutationFn: (payload: SocialLoginPayload) => authService.loginWithGoogle(payload),
  });
}

export function useLoginWithApple() {
  return useMutation({
    mutationFn: (payload: SocialLoginPayload) => authService.loginWithApple(payload),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => authService.forgotPassword(payload),
  });
}

export function useResetPassword(token?: string) {
  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => authService.resetPassword(payload, token),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => authService.changePassword(payload),
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: () => authService.logout(),
  });
}
