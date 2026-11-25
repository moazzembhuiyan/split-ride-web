"use client";
import { Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useVerifyOtp } from "@/hooks/auth/use-otp";
import type { UseMutationResult } from "@tanstack/react-query";
import { useT } from "@/i18n";
import { saveSession } from "@/lib/session";
import type { LoginResponse } from "@/types/auth.types";

export default function OTP({
  type,
  otpToken,
  phonePayload,
  onOtpTokenChange,
  resendOtpMutation,
  onBack,
}: {
  type: "passenger" | "driver";
  otpToken?: string;
  phonePayload?: { countryCode: string; phone: string };
  onOtpTokenChange?: (token: string) => void;
  onBack?: () => void;
  resendOtpMutation?: UseMutationResult<
    { data: { verificationToken?: string, otp?: string } },

    Error,
    { countryCode: string; phone: string }
  >;
}) {
  const t = useT();
  const [otp, setOtp] = React.useState("");
  const [verified, setVerified] = React.useState(false);

  const verifyOtp = useVerifyOtp("signup", otpToken);

  function handleVerify() {
    if (otp.length !== 6) {
      toast.error(t("auth.register.otpTitle"));
      return;
    }
    verifyOtp.mutate(
      { otp },
      {
        onSuccess(res) {
          const data = res.data as LoginResponse;
          saveSession(data ?? {});
          setVerified(true);
        },
        onError(err) {
          toast.error(err.message);
        },
      },
    );
  }

  function handleResend() {
    if (!phonePayload || !resendOtpMutation) return;

    resendOtpMutation.mutate(phonePayload, {
      onSuccess(res) {
        const nextToken = res.data?.verificationToken;
        if (nextToken && onOtpTokenChange) {
          onOtpTokenChange(nextToken);
        }
        if (res.data?.otp) {
          setOtp(res?.data?.otp);
        } else {
        }
        toast.success("A new code has been sent");
      },
      onError(err) {
        toast.error(err.message);
      },
    });
  }

  if (verified) {
    return (
      <>
        <DialogHeader className="text-center hidden">
          <DialogTitle>{t("auth.register.otpTitle")}</DialogTitle>
          <DialogDescription>{t("auth.register.otpDesc")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center gap-4 w-full">
          <div className="size-24 bg-linear-to-r from-cyan-400 to-violet-500 rounded-full flex justify-center items-center">
            <HugeiconsIcon
              icon={Tick01Icon}
              className="size-18 text-background"
            />
          </div>
          <h2 className="text-2xl font-bold">{t("auth.register.verified")}</h2>
          <p className="text-muted-foreground">
            {t("auth.register.verifiedMsg")}
          </p>
          <Button className="w-full" asChild>
            <Link href={type === "passenger" ? "/book" : "/driver"}>
              {t("auth.register.startEnjoy")}
            </Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <DialogHeader className="text-center">
        <DialogTitle>{t("auth.register.otpTitle")}</DialogTitle>
        <DialogDescription>{t("auth.register.otpDesc")}</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 w-full">
        <div className="flex justify-center items-center mt-4">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            autoFocus={false}
          >
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
              ? t("auth.register.verifying")
              : t("auth.register.verifyBtn")}
          </Button>
          <div className="flex justify-center items-center mt-0">
            {t("auth.register.didntGetCode")}{" "}
            <Button
              variant="link"
              className="px-0"
              onClick={handleResend}
              disabled={!phonePayload || resendOtpMutation?.isPending}
            >
              {resendOtpMutation?.isPending
                ? "Sending..."
                : t("auth.register.resend")}
            </Button>
          </div>
          {onBack && (
            <Button
              type="button"
              variant="ghost"
              className="w-full mt-2"
              onClick={onBack}
            >
              Back
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
