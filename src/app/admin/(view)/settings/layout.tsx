"use client";

import {
  FileEditIcon,
  LanguageCircleIcon,
  LockPasswordIcon,
  PercentCircleIcon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { useT } from "@/i18n";

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useT();

  const NAV_ITEMS = [
    {
      label: t("admin.settings.nav.account"),
      description: t("admin.settings.nav.accountDesc"),
      href: "/admin/settings",
      icon: UserCircleIcon,
      exact: true,
    },
    {
      label: t("admin.settings.nav.languages"),
      description: t("admin.settings.nav.languagesDesc"),
      href: "/admin/settings/language",
      icon: LanguageCircleIcon,
    },
    {
      label: t("admin.settings.nav.password"),
      description: t("admin.settings.nav.passwordDesc"),
      href: "/admin/settings/password",
      icon: LockPasswordIcon,
    },
    {
      label: t("admin.settings.general.title"),
      description: t("admin.settings.general.navDesc"),
      href: "/admin/settings/platform-charges",
      icon: PercentCircleIcon,
    },
    {
      label: t("admin.settings.nav.terms"),
      description: t("admin.settings.nav.termsDesc"),
      href: "/admin/settings/terms",
      icon: FileEditIcon,
    },
  ];

  return (
    <div className="flex flex-col md:grid md:grid-cols-4 h-full z-0 border-t">
      {/* Mobile: horizontal scrollable strip */}
      <div className="md:hidden flex overflow-x-auto bg-white border-b scrollbar-none">
        {NAV_ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-4 py-3 shrink-0 transition-colors border-b-2 ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground"
              }`}
            >
              <div
                className={`size-9 rounded-full flex items-center justify-center ${
                  active ? "bg-primary/10" : "bg-muted"
                }`}
              >
                <HugeiconsIcon icon={item.icon} className="size-5" />
              </div>
              <span className="text-xs font-medium whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Desktop: vertical sidebar */}
      <div className="hidden md:block h-full bg-white overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/50 ${
                active
                  ? "bg-primary/5 border-s-4 border-primary"
                  : "border-s-4 border-transparent"
              }`}
            >
              <div
                className={`size-10 rounded-full flex items-center justify-center shrink-0 ${
                  active ? "bg-primary/10" : "bg-muted"
                }`}
              >
                <HugeiconsIcon
                  icon={item.icon}
                  className={`size-5 ${active ? "text-primary" : "text-muted-foreground"}`}
                />
              </div>
              <div className="min-w-0">
                <p
                  className={`text-sm font-semibold leading-tight ${
                    active ? "text-primary" : "text-foreground"
                  }`}
                >
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      <main className="flex-1 md:h-full bg-muted md:col-span-3 overflow-y-auto">
        <div className="bg-white m-4 md:m-6 rounded-2xl min-h-[calc(100%-2rem)] md:min-h-[calc(100%-3rem)]">
          {children}
        </div>
      </main>
    </div>
  );
}
