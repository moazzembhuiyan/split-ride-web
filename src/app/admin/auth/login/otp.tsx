"use client";
import { LockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { UseMutationResult } from "@tanstack/react-query";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useResetPassword } from "@/hooks/auth/use-auth";
import { useVerifyOtp } from "@/hooks/auth/use-otp";
import { useT } from "@/i18n";
import type { OtpTokenResponse } from "@/types/auth.types";

export default function OTP({
  otpToken,
  email,
  resendOtpMutation,
  onOtpTokenChange,
}: {
  otpToken: string;
  email?: string;
  resendOtpMutation?: UseMutationResult<
    { data?: unknown },
    Error,
    { email: string }
  >;
  onOtpTokenChange?: React.Dispatch<React.SetStateAction<string | undefined>>;
}) {
  const t = useT();
  const [otp, setOtp] = React.useState("");
  const [resetToken, setResetToken] = React.useState<string | undefined>(
    undefined,
  );
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const router = useRouter();

  const verifyOtp = useVerifyOtp("forgot", otpToken);
  const resetPassword = useResetPassword(resetToken);

  function handleVerify() {
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    verifyOtp.mutate(
      { otp },
      {
        onSuccess(res) {
          const data = res.data as OtpTokenResponse;
          if (data?.verificationToken) {
            setResetToken(data.verificationToken);
          }
        },
        onError(err) {
          toast.error(err.message);
        },
      },
    );
  }

  function handleResend() {
    if (!email || !resendOtpMutation) return;

    resendOtpMutation.mutate(
      { email },
      {
        onSuccess(res) {
          const nextToken = (res as { data?: { verificationToken?: string } })
            .data?.verificationToken;
          if (nextToken) {
            onOtpTokenChange?.(nextToken);
          }
          setOtp("");
          toast.success("A new code has been sent");
        },
        onError(err) {
          toast.error(err.message);
        },
      },
    );
  }

  function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    resetPassword.mutate(
      { password, confirmPassword },
      {
        onSuccess() {
          toast.success("Password reset successful");
          router.push("/admin/auth/login");
        },
        onError(err) {
          toast.error(err.message);
        },
      },
    );
  }

  if (resetToken) {
    return (
      <>
        <DialogHeader className="text-center">
          <DialogTitle>{t("admin.auth.setupPassword")}</DialogTitle>
          <DialogDescription>
            {t("admin.auth.setupPasswordDesc")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center gap-4 w-full">
          <div className="w-full">
            <form onSubmit={handleReset}>
              <FieldGroup>
                <Field>
                  <FieldLabel>{t("common.password")}</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <HugeiconsIcon icon={LockIcon} />
                    </InputGroupAddon>
                    <InputGroupInput
                      placeholder={t("common.passwordPlaceholder")}
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <InputGroupAddon align={"inline-end"}>
                      <Button
                        type="button"
                        className="p-2 size-8"
                        variant="ghost"
                        onClick={() => setShowPassword((p) => !p)}
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </Button>
                    </InputGroupAddon>
                  </InputGroup>
                </Field>
                <Field>
                  <FieldLabel>{t("admin.auth.confirmPassword")}</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <HugeiconsIcon icon={LockIcon} />
                    </InputGroupAddon>
                    <InputGroupInput
                      placeholder={t("admin.auth.confirmPasswordPlaceholder")}
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <InputGroupAddon align={"inline-end"}>
                      <Button
                        type="button"
                        className="p-2 size-8"
                        variant="ghost"
                        onClick={() => setShowPassword((p) => !p)}
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </Button>
                    </InputGroupAddon>
                  </InputGroup>
                </Field>
                <Button
                  type="submit"
                  className="w-full mt-4"
                  disabled={resetPassword.isPending}
                >
                  {resetPassword.isPending
                    ? t("admin.auth.resetting")
                    : t("admin.common.submit")}
                </Button>
              </FieldGroup>
            </form>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DialogHeader className="text-center">
        <DialogTitle>{t("admin.auth.enterCode")}</DialogTitle>
        <DialogDescription>{t("admin.auth.enterCodeDesc")}</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 w-full">
        <div className="flex justify-center items-center mt-4">
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup className="*:data-[slot=input-otp-slot]:bg-muted gap-2 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:border-transparent *:data-[slot=input-otp-slot]:shadow-none">
              <InputOTPSlot index={0} className="size-12" />
              <InputOTPSlot index={1} className="size-12" />
              <InputOTPSlot index={2} className="size-12" />
              <InputOTPSlot index={3} className="size-12" />
              <InputOTPSlot index={4} className="size-12" />
              <InputOTPSlot index={5} className="size-12" />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <div className="w-full">
          <Button
            className="mt-2 w-full"
            onClick={handleVerify}
            disabled={verifyOtp.isPending}
          >
            {verifyOtp.isPending
              ? t("admin.auth.verifying")
              : t("admin.auth.verify")}
          </Button>
          <div className="flex justify-center items-center mt-0">
            {t("admin.auth.didntGetCode")}{" "}
            <Button
              variant="link"
              className="px-0"
              onClick={handleResend}
              disabled={!email || resendOtpMutation?.isPending}
            >
              {resendOtpMutation?.isPending
                ? "Sending..."
                : t("admin.auth.resend")}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
