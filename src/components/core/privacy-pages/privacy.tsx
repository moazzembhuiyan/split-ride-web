"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useT } from "@/i18n";

const DATA_ITEM_KEYS = [
  "profile.privacy.profileData",
  "profile.privacy.security",
  "profile.privacy.consents",
  "profile.privacy.billing",
  "profile.privacy.orders",
  "profile.privacy.identity",
  "profile.privacy.suspensions",
  "profile.privacy.trips",
] as const;

export default function Privacy({ driver }: { driver?: boolean }) {
  const t = useT();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  return (
    <div className="p-4 sm:p-8 lg:p-12 h-full w-full">
      <h1 className="text-2xl font-bold">{t("profile.privacy.title")}</h1>
      <p className="text-muted-foreground mt-2">
        {t("profile.privacy.subtitle")}
      </p>
      <h2 className="text-xl font-bold mt-6">
        {t("profile.privacy.selectTitle")}
      </h2>

      <div className="mt-6 rounded-2xl bg-primary/5 border border-primary/10 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DATA_ITEM_KEYS.map((key) => {
            const id = `data-${key.replace(/\./g, "-")}`;
            return (
              <div key={key} className="flex items-center gap-3">
                <Checkbox
                  id={id}
                  checked={selected.has(key)}
                  onCheckedChange={() => toggle(key)}
                />
                <label
                  htmlFor={id}
                  className="text-sm font-medium cursor-pointer select-none"
                >
                  {t(key)}
                </label>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-muted-foreground text-sm mt-4">
        {t("profile.privacy.emailShare")}
      </p>

      <Button
        className="mt-6"
        disabled={selected.size === 0}
        onClick={() => {}}
      >
        {t("profile.privacy.request")}
      </Button>
    </div>
  );
}
