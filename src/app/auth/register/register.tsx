"use client";
import { MailIcon, UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { FaApple } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import type { Value as PhoneValue } from "react-phone-number-input";
import { parsePhoneNumber } from "react-phone-number-input";
import { toast } from "sonner";
import { PhoneInput } from "@/components/core/phone-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { useRegister } from "@/hooks/auth/use-auth";
import { useSendOtpPhoneDirect } from "@/hooks/auth/use-otp";
import { useSocialAuth } from "@/hooks/auth/use-social-auth";
import { useFcmToken } from "@/hooks/shared/use-fcm";
import { useT } from "@/i18n";
import OTP from "./otp";

export default function Register() {
  const t = useT();
  const [type, setType] = React.useState<"passenger" | "driver">("passenger");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState<PhoneValue | undefined>(undefined);
  const [agreed, setAgreed] = React.useState(false);
  const [otpToken, setOtpToken] = React.useState<string | undefined>(undefined);
  const [otpOpen, setOtpOpen] = React.useState(false);
  const [otpPhonePayload, setOtpPhonePayload] = React.useState<{
    countryCode: string;
    phone: string;
  } | null>(null);

  const register = useRegister();
  const fcmToken = useFcmToken();
  const resendOtp = useSendOtpPhoneDirect();
  const { loginWithGoogle, loginWithApple, isGooglePending, isApplePending } =
    useSocialAuth(type === "driver" ? "provider" : "user");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = phone ? parsePhoneNumber(phone) : null;
    if (!parsed) {
      toast.error(t("auth.login.invalidPhone"));
      return;
    }
    const countryCode = parsed.country ?? `+${parsed.countryCallingCode}`;
    register.mutate(
      {
        name,
        email,
        countryCode,
        phone: parsed.number,
        role: type === "driver" ? "provider" : "user",
        fcmToken: fcmToken ?? undefined,
      },
      {
        onSuccess(res) {
          setOtpToken(res.data.otp);
          setOtpPhonePayload({
            countryCode,
            phone: parsed.number,
          });
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
        <h1 className="text-3xl font-bold">{t("auth.register.title")}</h1>
        <p className="text-lg text-muted-foreground">
          {t("auth.register.subtitle")}
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
              <FieldLabel>{t("common.fullName")}</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <HugeiconsIcon icon={UserIcon} />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder={t("auth.register.namePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel>{t("common.email")}</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <HugeiconsIcon icon={MailIcon} />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder={t("auth.register.emailPlaceholder")}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel>{t("auth.login.phoneLabel")}</FieldLabel>
              <PhoneInput
                defaultCountry="CY"
                placeholder={t("auth.register.phonePlaceholder")}
                value={phone}
                onChange={(v) => setPhone(v)}
              />
            </Field>
            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="mt-1"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>
                I agree to the{" "}
                <Link
                  href="/terms"
                  className="text-primary font-semibold underline"
                >
                  Terms and Conditions
                </Link>
              </span>
            </label>
            <Button type="submit" disabled={register.isPending || !agreed}>
              {register.isPending
                ? t("auth.register.signingUp")
                : t("auth.register.signUp")}
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
            disabled={isGooglePending || !agreed}
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
            disabled={isApplePending || !agreed}
          >
            <FaApple />{" "}
            {isApplePending
              ? t("auth.login.signingIn")
              : t("auth.login.continueApple")}
          </Button>
        </div>
        <div className="mt-4 text-center text-sm text-muted-foreground ">
          {t("auth.register.alreadyMember")}{" "}
          <Link href="/" className="text-primary">
            {t("auth.register.loginNow")}
          </Link>
        </div>
      </div>
      <Dialog open={otpOpen} onOpenChange={setOtpOpen}>
        <DialogContent
          showCloseButton={false}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <OTP
            type={type}
            otpToken={otpToken}
            phonePayload={otpPhonePayload ?? undefined}
            onOtpTokenChange={setOtpToken}
            resendOtpMutation={resendOtp}
            onBack={() => setOtpOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
