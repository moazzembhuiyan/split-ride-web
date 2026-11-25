"use client";

import { CallingIcon, MailIcon, Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Rings from "@/components/core/rings";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useGeneralSettings } from "@/hooks/shared/use-settings";
import { useCreateSupport } from "@/hooks/shared/use-support";
import { useMe } from "@/hooks/shared/use-user";
import { useT } from "@/i18n";
import { settingsMap } from "@/lib/general-settings";
import {
  supportEmail as emailFromSettings,
  supportPhone as phoneFromSettings,
} from "@/lib/support";
import { cn } from "@/lib/utils";

export default function Help({
  driver: _driver,
  embedded = false,
}: {
  driver?: boolean;
  embedded?: boolean;
}) {
  const t = useT();
  const { data: meData } = useMe();
  const user = meData?.data;

  const { data: settingsData } = useGeneralSettings();
  const generals = settingsMap(settingsData?.data);

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [bookingId, setBookingId] = useState("");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const createSupport = useCreateSupport();

  useEffect(() => {
    if (!user) return;
    setName((n) => n || user.name || "");
    setPhone((p) => p || `${user.countryCode ?? ""}${user.phone ?? ""}`);
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !reason.trim()) {
      toast.error("Name, phone, and message are required");
      return;
    }
    try {
      await createSupport.mutateAsync({
        name: name.trim(),
        phone: phone.trim(),
        booking: bookingId.trim() || undefined,
        reason: reason.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    }
  }

  const supportPhone = phoneFromSettings(generals);
  const supportEmail = emailFromSettings(generals);
  const phoneHref = `tel:${supportPhone.replace(/[^\d+]/g, "")}`;
  const canSubmit =
    name.trim().length > 0 &&
    phone.trim().length > 0 &&
    reason.trim().length > 0 &&
    !createSupport.isPending;

  const body = submitted ? (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
        <HugeiconsIcon icon={Tick01Icon} className="size-8 text-primary" />
      </div>
      <h2 className="text-xl font-bold">{t("profile.help.submitted")}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        {t("profile.help.submittedMsg")}
      </p>
      <Button
        variant="outline"
        className="mt-2 rounded-full px-6"
        onClick={() => {
          setReason("");
          setBookingId("");
          setSubmitted(false);
        }}
      >
        {t("profile.help.submitAnother")}
      </Button>
    </div>
  ) : (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t("profile.help.title")}
        </h1>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <a
          href={`mailto:${supportEmail}`}
          className="flex min-w-0 items-center gap-3 rounded-2xl border bg-muted/30 px-4 py-3 text-sm transition-colors hover:bg-muted/60"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <HugeiconsIcon icon={MailIcon} className="size-4 text-primary" />
          </span>
          <span className="min-w-0 truncate text-muted-foreground">
            {supportEmail}
          </span>
        </a>
        <a
          href={phoneHref}
          className="flex min-w-0 items-center gap-3 rounded-2xl border bg-muted/30 px-4 py-3 text-sm transition-colors hover:bg-muted/60"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <HugeiconsIcon icon={CallingIcon} className="size-4 text-primary" />
          </span>
          <span className="min-w-0 truncate text-muted-foreground">
            {supportPhone}
          </span>
        </a>
      </div>

      <form
        onSubmit={handleSubmit}
        className={cn(
          !embedded && "rounded-3xl border bg-background/80 p-5 sm:p-6",
        )}
      >
        <FieldGroup className="gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>{t("common.fullName")}</FieldLabel>
              <Input
                placeholder={t("profile.help.namePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </Field>
            <Field>
              <FieldLabel>{t("common.phone")}</FieldLabel>
              <Input
                placeholder={t("profile.help.phonePlaceholder")}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                inputMode="tel"
                dir="ltr"
                required
              />
            </Field>
          </div>

          <Field>
            <FieldLabel>{t("common.bookingId")}</FieldLabel>
            <Input
              placeholder={t("profile.help.bookingIdPlaceholder")}
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("profile.help.bookingIdHint")}
            </p>
          </Field>

          <Field>
            <FieldLabel>{t("profile.help.message")}</FieldLabel>
            <Textarea
              placeholder={t("profile.help.messagePlaceholder")}
              className="min-h-36 resize-y"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </Field>

          <Button
            type="submit"
            disabled={!canSubmit}
            className="h-12 w-full rounded-full bg-linear-to-r from-cyan-400 via-violet-500 to-pink-400 text-sm font-semibold text-white hover:opacity-90"
          >
            {createSupport.isPending
              ? t("profile.help.submitting")
              : t("profile.help.submit")}
          </Button>
        </FieldGroup>
      </form>
    </>
  );

  if (embedded) {
    return (
      <div className="h-full w-full overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-xl flex-col px-5 py-6 sm:px-8 sm:py-8">
          {body}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-full w-full">
      <Rings />
      <div className="pointer-events-none absolute -right-48 -top-48 z-0 size-96 rounded-full bg-linear-to-br from-cyan-400/80 to-violet-500 p-15 xl:-right-60 xl:-top-60 xl:size-120 xl:p-20">
        <div className="h-full w-full rounded-full bg-background" />
      </div>
      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-xl flex-col px-4 py-8 sm:py-12">
        {body}
      </div>
    </div>
  );
}
