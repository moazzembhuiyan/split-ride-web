"use client";

import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LOCALES, type Locale, useI18n } from "@/i18n";

export default function Language({ driver }: { driver?: boolean }) {
  const { locale, setLocale, t } = useI18n();
  const [selected, setSelected] = useState<Locale>(locale);
  const [search, setSearch] = useState("");

  const allLanguages = LOCALES.map((code) => ({
    code,
    label: t(`profile.language.${code}`),
  }));

  const filtered = allLanguages.filter((l) =>
    l.label.toLowerCase().includes(search.toLowerCase()),
  );

  function handleSave() {
    setLocale(selected);
  }

  return (
    <div className="p-4 sm:p-8 lg:p-12 h-full w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">{t("profile.language.title")}</h1>
        <div className="flex items-center gap-2 rounded-3xl bg-input/50 px-4 h-10 w-56">
          <HugeiconsIcon
            icon={Search01Icon}
            className="size-4 text-muted-foreground shrink-0"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("profile.language.searchPlaceholder")}
            className="bg-transparent outline-none text-sm w-full placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-3">
        {t("profile.language.choose")}
      </p>

      <div className="h-72 overflow-y-auto rounded-2xl border border-border">
        <div className="divide-y divide-border">
          {filtered.map((lang) => (
            <label
              key={lang.code}
              htmlFor={`lang-${lang.code}`}
              className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-muted/40 transition-colors"
            >
              <input
                type="radio"
                id={`lang-${lang.code}`}
                name="language"
                value={lang.code}
                checked={selected === lang.code}
                onChange={() => setSelected(lang.code)}
                className="sr-only"
              />
              <div
                className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  selected === lang.code
                    ? "border-primary"
                    : "border-muted-foreground/40"
                }`}
              >
                {selected === lang.code && (
                  <div className="size-2.5 rounded-full bg-primary" />
                )}
              </div>
              <span className="text-sm font-medium">{lang.label}</span>
            </label>
          ))}
          {filtered.length === 0 && (
            <p className="px-5 py-6 text-sm text-muted-foreground text-center">
              {t("profile.language.noFound")}
            </p>
          )}
        </div>
      </div>

      <Button
        className="mt-8"
        onClick={handleSave}
        disabled={selected === locale}
      >
        {t("profile.language.save")}
      </Button>
    </div>
  );
}
