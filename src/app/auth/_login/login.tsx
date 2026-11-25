"use client";
import { Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { FaApple } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import type { Value as PhoneValue } from "react-phone-number-input";
import { parsePhoneNumber } from "react-phone-number-input";
import { toast } from "sonner";
import { PhoneInput } from "@/components/core/phone-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Separator } from "@/components/ui/separator";
import { useLoginWithPhone } from "@/hooks/auth/use-auth";
import { useSendOtpPhoneDirect, useVerifyOtp } from "@/hooks/auth/use-otp";
import { useSocialAuth } from "@/hooks/auth/use-social-auth";
import { useFcmToken } from "@/hooks/shared/use-fcm";
import { useT } from "@/i18n";
import { saveSession } from "@/lib/session";
import type { LoginResponse } from "@/types/auth.types";

function OTPDialog({
  type,
  otpToken,
  phonePayload,
  onOtpTokenChange,
  open,
  onOpenChange,
  mockOtp,
}: {
  type: "passenger" | "driver";
  otpToken: string;
  phonePayload?: { countryCode: string; phone: string };
  onOtpTokenChange?: (token: string) => void;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mockOtp?: string;
}) {
  const t = useT();
  const [otp, setOtp] = React.useState("");
  const [verified, setVerified] = React.useState(false);
  const router = useRouter();
  const verifyOtp = useVerifyOtp("login", otpToken);
  const resendOtp = useSendOtpPhoneDirect();

  useEffect(() => {
    if (mockOtp) {
      setOtp(mockOtp);
    }
  }, [mockOtp]);

  function handleVerify() {
    if (otp.length !== 6) {
      toast.error(t("auth.login.otpTitle"));
      return;
    }
    verifyOtp.mutate(
      { otp },
      {
        onSuccess(res) {
          const data = res.data as LoginResponse;
          saveSession(data ?? {});
          setVerified(true);
          setTimeout(() => {
            if (type === "passenger") router.push("/book");
            else router.push("/driver");
          }, 1200);
        },
        onError(err) {
          toast.error(err.message);
        },
      },
    );
  }

  function handleResend() {
    if (!phonePayload) return;

    resendOtp.mutate(phonePayload, {
      onSuccess(res) {
        const nextToken = res.data?.verificationToken;
        if (nextToken && onOtpTokenChange) {
          onOtpTokenChange(nextToken);
        }
        setOtp("");
        toast.success("A new code has been sent");
      },
      onError(err) {
        toast.error(err.message);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {verified ? (
          <div className="flex flex-col items-center justify-center gap-4 w-full">
            <div className="size-24 bg-linear-to-r from-cyan-400 to-violet-500 rounded-full flex justify-center items-center">
              <HugeiconsIcon
                icon={Tick01Icon}
                className="size-18 text-background"
              />
            </div>
            <h2 className="text-2xl font-bold">{t("auth.login.verified")}</h2>
            <p className="text-muted-foreground">{t("auth.login.loggingIn")}</p>
          </div>
        ) : (
          <>
            <DialogHeader className="text-center">
              <DialogTitle>{t("auth.login.otpTitle")}</DialogTitle>
              <DialogDescription>{t("auth.login.otpDesc")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 w-full">
              <div className="flex justify-center items-center mt-4">
                <InputOTP maxLength={6} value={otp} onChange={setOtp} autoFocus={false}>
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
                    ? t("auth.login.verifying")
                    : t("auth.login.verifyBtn")}
                </Button>
                <div className="flex justify-center items-center mt-0">
                  {t("auth.login.didntGetCode")}{" "}
                  <Button
                    variant="link"
                    className="px-0"
                    onClick={handleResend}
                    disabled={resendOtp.isPending || !phonePayload}
                  >
                    {resendOtp.isPending
                      ? "Sending..."
                      : t("auth.login.resend")}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full mt-2"
                  onClick={() => onOpenChange(false)}
                >
                  Back
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Login() {
  const t = useT();
  const [type, setType] = React.useState<"passenger" | "driver">("passenger");
  const [phone, setPhone] = React.useState<PhoneValue | undefined>(undefined);
  const [mockOtp, setMockOtp] = React.useState<string | undefined>(undefined);
  const [otpToken, setOtpToken] = React.useState<string>("");
  const [otpOpen, setOtpOpen] = React.useState(false);
  const [otpPhonePayload, setOtpPhonePayload] = React.useState<{
    countryCode: string;
    phone: string;
  } | null>(null);

  const loginWithPhone = useLoginWithPhone();
  const fcmToken = useFcmToken();
  const { loginWithGoogle, loginWithApple, isGooglePending, isApplePending } =
    useSocialAuth(type === "driver" ? "provider" : "user");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = phone ? parsePhoneNumber(phone) : null;
    if (!parsed) {
      toast.error(t("auth.login.invalidPhone"));
      return;
    }
    loginWithPhone.mutate(
      {
        countryCode: parsed.country ?? `+${parsed.countryCallingCode}`,
        phone: parsed.number,
        fcmToken: fcmToken ?? undefined,
      },
      {
        onSuccess(res) {
          setOtpToken(res.data.verificationToken);
          setOtpPhonePayload({
            countryCode: parsed.country ?? `+${parsed.countryCallingCode}`,
            phone: parsed.number,
          });
          if (res.data.mock) {
            setMockOtp(res.data.otp ?? "");
          }

          setOtpOpen(true);
        },
        onError(err) {
          toast.error(err.message);
        },
      },
    );
  }

  return (
    <div className="h-full w-full py-12 flex flex-col items-center justify-start gap-4 px-12">
      <Image
        src="/logo.webp"
        alt="Logo"
        width={600}
        height={200}
        className="w-1/2"
      />
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">{t("auth.login.title")}</h1>
        <p className="text-lg text-muted-foreground">
          {t("auth.login.subtitle")}
        </p>
      </div>
      <div className="w-full">
        <div className="space-y-4 grid grid-cols-2 gap-4 w-full ">
          <Button
            variant={type === "passenger" ? "default" : "accent"}
            className="w-full"
            onClick={() => setType("passenger")}
          >
            {t("common.passenger")}
          </Button>
          <Button
            variant={type === "driver" ? "default" : "accent"}
            className="w-full"
            onClick={() => setType("driver")}
          >
            {t("common.driver")}
          </Button>
        </div>
      </div>
      <div className="w-full">
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel>{t("auth.login.phoneLabel")}</FieldLabel>
              <PhoneInput
                defaultCountry="CY"
                value={phone}
                onChange={setPhone}
              />
            </Field>
            <Button type="submit" disabled={loginWithPhone.isPending}>
              {loginWithPhone.isPending
                ? t("auth.login.sendingCode")
                : t("auth.login.login")}
            </Button>
          </FieldGroup>
        </form>
        <div className="mt-4 flex justify-center items-center w-full overflow-hidden">
          <Separator className="w-full h-0.5" />
          <span className="px-4">{t("common.or")}</span>
          <Separator className="w-full h-0.5" />
        </div>
        <div className="mt-4 grid gap-4">
          <Button
            variant={"secondary"}
            onClick={loginWithGoogle}
            disabled={isGooglePending}
          >
            <FcGoogle />{" "}
            {isGooglePending
              ? t("auth.login.signingIn")
              : t("auth.login.continueGoogle")}
          </Button>
          <Button
            variant={"secondary"}
            className="bg-black text-white hover:bg-zinc-800"
            onClick={loginWithApple}
            disabled={isApplePending}
          >
            <FaApple />{" "}
            {isApplePending
              ? t("auth.login.signingIn")
              : t("auth.login.continueApple")}
          </Button>
        </div>
        <div className="mt-4 text-center text-sm text-muted-foreground ">
          {t("auth.login.notMember")}{" "}
          <Link href="/auth/register" className="text-primary">
            {t("auth.login.signUpNow")}
          </Link>
        </div>
      </div>
      {otpToken && (
        <OTPDialog
          type={type}
          otpToken={otpToken}
          phonePayload={otpPhonePayload ?? undefined}
          onOtpTokenChange={setOtpToken}
          open={otpOpen}
          mockOtp={mockOtp}
          onOpenChange={setOtpOpen}
        />
      )}
    </div>
  );
}
