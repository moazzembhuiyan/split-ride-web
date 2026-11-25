"use client";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";
import { toRideClock } from "@/lib/ride-time";

/** The code the rider tells the driver at pickup. */
export function StartCodeCard({
  otp,
  expiresAt,
}: {
  otp: string;
  expiresAt: number | null;
}) {
  const t = useT();
  return (
    <section
      className="mt-3 rounded-lg border bg-secondary p-3 text-center"
      aria-label={t("ride.otp.title")}
    >
      <p className="text-xs font-medium text-muted-foreground">
        {t("ride.otp.title")}
      </p>
      <p
        dir="ltr"
        className="my-1 text-3xl font-bold tracking-[0.3em] tabular-nums"
      >
        {otp}
      </p>
      <p className="text-xs text-muted-foreground">{t("ride.otp.hint")}</p>
      {expiresAt !== null && (
        <p className="mt-1 text-xs text-muted-foreground">
          {t("ride.otp.validUntil", { time: toRideClock(expiresAt).time })}
        </p>
      )}
    </section>
  );
}

/** For a code that was missed, or after the page was reloaded. */
export function AskCodeButton({
  asking,
  onAsk,
}: {
  asking: boolean;
  onAsk: () => void;
}) {
  const t = useT();
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="mt-3 w-full rounded-full"
      disabled={asking}
      onClick={onAsk}
    >
      {t("ride.otp.show")}
    </Button>
  );
}
