"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useMe, useUpdateMe } from "@/hooks/shared/use-user";
import { useT } from "@/i18n";

export default function AccountPage() {
  const t = useT();
  const { data, isPending: isLoading } = useMe();
  const { mutate, isPending: isSaving } = useUpdateMe();

  const user = data?.data;
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  useEffect(() => {
    if (!user) return;
    const parts = user.name?.split(" ") ?? [];
    setFirstName(parts[0] ?? "");
    setLastName(parts.slice(1).join(" "));
  }, [user]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
    if (!name) return;
    mutate(
      { name },
      {
        onSuccess: () => toast.success(t("admin.settings.account.updated")),
        onError: () => toast.error(t("admin.settings.account.updateFailed")),
      },
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 text-sm text-muted-foreground">
        {t("admin.common.loading")}
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold">{t("admin.settings.account.title")}</h1>
      <p className="text-sm text-muted-foreground mt-1">
        {t("admin.settings.account.desc")}
      </p>

      <form className="mt-8" onSubmit={handleSubmit}>
        <FieldGroup className="grid grid-cols-2 gap-6">
          <Field>
            <FieldLabel>{t("admin.settings.account.firstName")}</FieldLabel>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={t("admin.settings.account.firstName")}
            />
          </Field>
          <Field>
            <FieldLabel>{t("admin.settings.account.lastName")}</FieldLabel>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={t("admin.settings.account.lastName")}
            />
          </Field>

          <Field>
            <div className="flex items-center justify-between mb-1">
              <FieldLabel className="mb-0">{t("common.email")}</FieldLabel>
            </div>
            <Input value={user?.email ?? ""} readOnly className="opacity-60" />
          </Field>

          {/* <Field>
            <FieldLabel>{t("admin.settings.account.phone")}</FieldLabel>
            <Input value={user?.phone ?? ""} readOnly className="opacity-60" />
          </Field> */}

          <div className="col-span-2 flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? t("admin.common.saving")
                : t("admin.common.saveChanges")}
            </Button>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}
