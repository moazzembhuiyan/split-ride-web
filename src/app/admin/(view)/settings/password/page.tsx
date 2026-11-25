"use client";

import { LockPasswordIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useChangePassword } from "@/hooks/auth/use-auth";
import { useT } from "@/i18n";

export default function PasswordPage() {
  const t = useT();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { mutate, isPending } = useChangePassword();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword || !password || !confirmPassword) return;
    if (password !== confirmPassword) {
      toast.error(t("admin.settings.password.mismatch"));
      return;
    }
    mutate(
      { currentPassword, password, confirmPassword },
      {
        onSuccess: () => {
          toast.success(t("admin.settings.password.updated"));
          setCurrentPassword("");
          setPassword("");
          setConfirmPassword("");
        },
        onError: () => toast.error(t("admin.settings.password.updateFailed")),
      },
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold">
        {t("admin.settings.password.title")}
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        {t("admin.settings.password.desc")}
      </p>

      <form className="mt-8" onSubmit={handleSubmit}>
        <FieldGroup className="space-y-5 grid grid-cols-2 gap-6">
          <Field className="col-span-2">
            <FieldLabel>{t("admin.settings.password.current")}</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <HugeiconsIcon icon={LockPasswordIcon} />
              </InputGroupAddon>
              <InputGroupInput
                type="password"
                placeholder={t("admin.settings.password.currentPlaceholder")}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </InputGroup>
          </Field>

          <Field>
            <FieldLabel>{t("admin.settings.password.new")}</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <HugeiconsIcon icon={LockPasswordIcon} />
              </InputGroupAddon>
              <InputGroupInput
                type="password"
                placeholder={t("admin.settings.password.newPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </InputGroup>
          </Field>

          <Field>
            <FieldLabel>{t("admin.settings.password.confirm")}</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <HugeiconsIcon icon={LockPasswordIcon} />
              </InputGroupAddon>
              <InputGroupInput
                type="password"
                placeholder={t("admin.settings.password.confirmPlaceholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </InputGroup>
          </Field>

          <div className="pt-2 flex justify-end col-span-2">
            <Button
              type="submit"
              disabled={
                isPending || !currentPassword || !password || !confirmPassword
              }
            >
              {isPending
                ? t("admin.settings.password.updating")
                : t("admin.settings.password.update")}
            </Button>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}
