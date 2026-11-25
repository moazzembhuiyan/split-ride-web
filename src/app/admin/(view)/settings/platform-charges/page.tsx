"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useGeneralSettings,
  useUpdateGeneralSettings,
} from "@/hooks/shared/use-settings";
import { useT } from "@/i18n";
import type { GeneralSettings } from "@/types/settings.types";

type FieldDef = {
  id: keyof GeneralSettings;
  type: "number" | "text";
  section: "access" | "ride" | "support";
  prefix?: string;
  /** Not returned by every API build; shown only when it is. */
  optional?: boolean;
};

type SettingsFormState = Record<string, string>;

const FIELD_DEFS: FieldDef[] = [
  {
    id: "bookingMaxDaysAhead",
    type: "number",
    section: "access",
  },
  {
    id: "splitRideMinBookingHours",
    type: "number",
    section: "access",
  },
  {
    id: "splitRideMinDistanceKm",
    type: "number",
    section: "access",
  },
  {
    id: "splitRidePickupMatchRadiusKm",
    type: "number",
    section: "access",
  },
  {
    id: "splitRideDestinationMatchRadiusKm",
    type: "number",
    section: "access",
  },
  {
    id: "splitRideMatchingTimeWindowMinutes",
    type: "number",
    section: "access",
  },
  {
    id: "splitRideRefundRestrictionHours",
    type: "number",
    section: "access",
  },
  {
    id: "privateRideMinBookingHours",
    type: "number",
    section: "access",
  },
  {
    id: "privateRideRefundRestrictionHours",
    type: "number",
    section: "access",
  },
  {
    id: "matchingNoDriverNotifyHours",
    type: "number",
    section: "access",
  },
  {
    id: "matchingLastNotifyHours",
    type: "number",
    section: "access",
  },
  {
    id: "cancellationFreeWindowHours",
    type: "number",
    section: "access",
  },
  {
    id: "cancellationPercentage50Hours",
    type: "number",
    section: "access",
  },
  {
    id: "cancellationFeePercent",
    type: "number",
    section: "access",
    prefix: "%",
    optional: true,
  },
  {
    id: "lateCancellationFeePercent",
    type: "number",
    section: "access",
    prefix: "%",
    optional: true,
  },
  {
    id: "waitingReminderIntervals",
    type: "number",
    section: "access",
  },
  {
    id: "waitingTimeMinutes",
    type: "number",
    section: "access",
  },
  {
    id: "waitNoticeMaxMinutes",
    type: "number",
    section: "access",
    optional: true,
  },
  {
    id: "tripStartEarlyWindowMinutes",
    type: "number",
    section: "access",
    optional: true,
  },
  {
    id: "dayFareInitialCharge",
    type: "number",
    section: "ride",
    prefix: "€",
  },
  {
    id: "dayFarePerKMRate",
    type: "number",
    section: "ride",
    prefix: "€",
  },
  {
    id: "dayFareWaitingCharge",
    type: "number",
    section: "ride",
    prefix: "€",
  },
  {
    id: "nightFareInitialCharge",
    type: "number",
    section: "ride",
    prefix: "€",
  },
  {
    id: "nightFarePerKMRate",
    type: "number",
    section: "ride",
    prefix: "€",
  },
  {
    id: "nightFareWaitingCharge",
    type: "number",
    section: "ride",
    prefix: "€",
  },
  {
    id: "waitNoticeFeeAmount",
    type: "number",
    section: "ride",
    prefix: "€",
    optional: true,
  },
  {
    id: "holidayIncreasePercentage",
    type: "number",
    section: "ride",
    prefix: "%",
  },
  {
    id: "perLuggageCharge",
    type: "number",
    section: "ride",
    prefix: "€",
  },
  {
    id: "fivePassengerExtraChargePercentage",
    type: "number",
    section: "ride",
    prefix: "%",
  },
  {
    id: "sixPassengerExtraChargePercentage",
    type: "number",
    section: "ride",
    prefix: "%",
  },
  {
    id: "baseFare",
    type: "number",
    section: "ride",
    prefix: "€",
  },
  {
    id: "splitRideMinimumFare",
    type: "number",
    section: "ride",
    prefix: "€",
    optional: true,
  },
  {
    id: "splitRideMatchedSurchargePercent",
    type: "number",
    section: "ride",
    prefix: "%",
  },
  {
    id: "splitRideMatchedSurchargePercent3",
    type: "number",
    section: "ride",
    prefix: "%",
  },
  {
    id: "splitRideMaxMatchedRiders",
    type: "number",
    section: "ride",
  },
  {
    id: "platformVat",
    type: "number",
    section: "ride",
    prefix: "%",
  },
  {
    id: "driverPlatformFeePercent",
    type: "number",
    section: "ride",
    prefix: "%",
  },
  {
    id: "driverVatPercent",
    type: "number",
    section: "ride",
    prefix: "%",
  },
  {
    id: "fareRoundingBracket",
    type: "number",
    section: "ride",
  },
  {
    id: "platformCommissionPercent",
    type: "number",
    section: "ride",
    prefix: "%",
  },
  {
    id: "supportEmail",
    type: "text",
    section: "support",
  },
];

const FIELD_IDS = FIELD_DEFS.map((field) => field.id);

const EMPTY_VALUES = Object.fromEntries(
  FIELD_IDS.map((id) => [id, ""]),
) as SettingsFormState;

export default function PlatformChargesPage() {
  const t = useT();
  const { data, isPending: isLoading } = useGeneralSettings();
  const { mutate, isPending: isSaving } = useUpdateGeneralSettings();
  const [values, setValues] = useState<SettingsFormState>(EMPTY_VALUES);

  const settings = data?.data ?? [];
  const returnedIds = new Set(settings.map((item) => item.key));
  const readOnlyIds = new Set(
    settings.filter((item) => item.readOnly).map((item) => item.key),
  );

  function savedValue(id: string): string {
    const value = settings.find((item) => item.key === id)?.value;
    return value === undefined || value === null ? "" : String(value);
  }

  useEffect(() => {
    if (!settings.length) return;
    const nextValues = Object.fromEntries(
      FIELD_DEFS.map((field) => {
        const entry = settings.find((item) => item.key === field.id);
        const rawValue = entry?.value;
        return [
          field.id,
          rawValue === undefined || rawValue === null ? "" : String(rawValue),
        ];
      }),
    ) as SettingsFormState;
    setValues(nextValues);
  }, [settings]);

  function handleReset() {
    if (!settings.length) return;
    const nextValues = Object.fromEntries(
      FIELD_DEFS.map((field) => {
        const entry = settings.find((item) => item.key === field.id);
        const rawValue = entry?.value;
        return [
          field.id,
          rawValue === undefined || rawValue === null ? "" : String(rawValue),
        ];
      }),
    ) as SettingsFormState;
    setValues(nextValues);
  }

  function handleSave() {
    const payload: Partial<GeneralSettings> = {};

    for (const field of FIELD_DEFS) {
      const rawValue = values[field.id];
      if (rawValue === "" || readOnlyIds.has(field.id)) continue;
      // Sent only when edited, so an API build that refuses one of these
      // cannot block saving the rest.
      if (field.optional && rawValue === savedValue(field.id)) continue;

      if (field.type === "number") {
        const numericValue = Number(rawValue);
        if (!Number.isNaN(numericValue)) {
          (payload as Record<string, number>)[field.id] = numericValue;
        }
      } else {
        (payload as Record<string, string>)[field.id] = rawValue;
      }
    }

    mutate(payload, {
      onSuccess: () => toast.success(t("admin.settings.general.saved")),
      onError: () => toast.error(t("admin.settings.general.saveFailed")),
    });
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("admin.settings.general.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("admin.settings.general.desc")}
          </p>
        </div>
        <Button variant="outline" onClick={handleReset}>
          {t("admin.settings.general.reset")}
        </Button>
      </div>

      <div className="mt-8 space-y-8">
        {(["access", "ride", "support"] as const).map((section) => {
          const fields = FIELD_DEFS.filter(
            (field) =>
              field.section === section &&
              (!field.optional || returnedIds.has(field.id)),
          );

          return (
            <section
              key={section}
              className="rounded-2xl border bg-background/60 p-6"
            >
              <div className="mb-6">
                <h2 className="text-lg font-semibold">
                  {t(`admin.settings.general.${section}Title`)}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t(`admin.settings.general.${section}Desc`)}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <label htmlFor={field.id} className="text-sm font-medium">
                      {t(`admin.settings.general.${field.id}`)}
                      {readOnlyIds.has(field.id) && (
                        <span className="ms-1 font-normal text-muted-foreground">
                          {t("admin.settings.general.fixed")}
                        </span>
                      )}
                    </label>
                    <div className="flex items-center gap-2">
                      {field.prefix ? (
                        <span className="rounded-lg border bg-muted px-3 py-2 text-sm text-muted-foreground">
                          {field.prefix}
                        </span>
                      ) : null}
                      <Input
                        id={field.id}
                        type={field.type}
                        step="any"
                        disabled={readOnlyIds.has(field.id)}
                        value={values[field.id] ?? ""}
                        onChange={(event) =>
                          setValues((previous) => ({
                            ...previous,
                            [field.id]: event.target.value,
                          }))
                        }
                        placeholder={
                          field.type === "number"
                            ? "0"
                            : t("admin.settings.general.enterValue")
                        }
                        className={field.prefix ? "flex-1" : "w-full"}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-8 flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? t("admin.common.saving") : t("admin.common.saveChanges")}
        </Button>
      </div>
    </div>
  );
}
