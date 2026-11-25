"use client";
import { LockIcon, MailIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useForgotPassword, useLoginWithEmail } from "@/hooks/auth/use-auth";
import { useSendOtpEmail } from "@/hooks/auth/use-otp";
import { useFcmToken } from "@/hooks/shared/use-fcm";
import { useT } from "@/i18n";
import { saveSession } from "@/lib/session";
import type { LoginResponse } from "@/types/auth.types";
import OTP from "./otp";

export default function Login() {
  const t = useT();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [showForgotDialog, setShowForgotDialog] = useState(false);
  const [otpToken, setOtpToken] = useState<string | undefined>(undefined);
  const router = useRouter();

  const loginWithEmail = useLoginWithEmail();
  const fcmToken = useFcmToken();
  const forgotPassword = useForgotPassword();
  const resendOtp = useSendOtpEmail();

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    loginWithEmail.mutate(
      { email, password, fcmToken: fcmToken ?? undefined },
      {
        onSuccess(res) {
          const data = res.data as LoginResponse;
          saveSession(data ?? {});
          router.push("/admin/dashboard");
        },
        onError(err) {
          toast.error(err.message);
        },
      },
    );
  }

  function handleForgotContinue() {
    if (!forgotEmail) {
      toast.error(t("admin.login.enterEmail"));
      return;
    }
    forgotPassword.mutate(
      { email: forgotEmail },
      {
        onSuccess(res) {
          setOtpToken(res.data.verificationToken);
        },
        onError(err) {
          toast.error(err.message);
        },
      },
    );
  }

  return (
    <div className="w-full py-12 flex flex-col items-center justify-start gap-4 px-12">
      <Image
        src="/logo.webp"
        alt="Logo"
        width={600}
        height={200}
        className="w-1/2"
      />
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">{t("admin.auth.welcomeBack")}</h1>
        <p className="text-lg text-muted-foreground">
          {t("admin.auth.loginSubtitle")}
        </p>
      </div>
      <div className="w-full">
        <form onSubmit={handleLogin}>
          <FieldGroup>
            <Field>
              <FieldLabel>{t("common.email")}</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <HugeiconsIcon icon={MailIcon} />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder={t("common.emailPlaceholder")}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </InputGroup>
            </Field>
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
            <div className="flex justify-end items-center -my-6 p-0!">
              <Button
                type="button"
                className="w-min p-0!"
                variant="link"
                onClick={() => setShowForgotDialog(true)}
              >
                {t("admin.auth.forgotPassword")}
              </Button>
            </div>
            <Button type="submit" disabled={loginWithEmail.isPending}>
              {loginWithEmail.isPending
                ? t("admin.auth.loggingIn")
                : t("admin.auth.login")}
            </Button>
          </FieldGroup>
        </form>

        <Dialog open={showForgotDialog} onOpenChange={setShowForgotDialog}>
          {otpToken ? (
            <DialogContent
              showCloseButton={false}
              onInteractOutside={(e) => e.preventDefault()}
            >
              <OTP
                otpToken={otpToken}
                email={forgotEmail}
                onOtpTokenChange={setOtpToken}
                resendOtpMutation={resendOtp}
              />
            </DialogContent>
          ) : (
            <DialogContent className="gap-2">
              <DialogHeader>
                <DialogTitle className="text-center text-2xl">
                  {t("admin.auth.forgotTitle")}
                </DialogTitle>
                <DialogDescription className="text-center">
                  {t("admin.auth.forgotDesc")}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel>{t("common.email")}</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <HugeiconsIcon icon={MailIcon} />
                      </InputGroupAddon>
                      <InputGroupInput
                        placeholder={t("common.emailPlaceholder")}
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                      />
                    </InputGroup>
                  </Field>
                </FieldGroup>
              </div>
              <DialogFooter className="flex justify-center w-full p-0!">
                <Button
                  className="block mx-auto"
                  type="button"
                  onClick={handleForgotContinue}
                  disabled={forgotPassword.isPending}
                >
                  {forgotPassword.isPending
                    ? t("admin.auth.sending")
                    : t("admin.auth.continue")}
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </div>
    </div>
  );
}
