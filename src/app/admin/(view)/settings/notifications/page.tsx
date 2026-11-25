"use client";

import {
  AlertCircleIcon,
  CreditCardIcon,
  Mail01Icon,
  Notification01Icon,
  SmartPhone01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/i18n";

export default function NotificationsPage() {
  const t = useT();

  const NOTIFICATIONS = [
    {
      icon: UserIcon,
      label: t("admin.settings.notifications.newUsers"),
      description: t("admin.settings.notifications.newUsersDesc"),
      id: "new-users",
    },
    {
      icon: SmartPhone01Icon,
      label: t("admin.settings.notifications.newBookings"),
      description: t("admin.settings.notifications.newBookingsDesc"),
      id: "new-bookings",
    },
    {
      icon: CreditCardIcon,
      label: t("admin.settings.notifications.payments"),
      description: t("admin.settings.notifications.paymentsDesc"),
      id: "payments",
    },
    {
      icon: AlertCircleIcon,
      label: t("admin.settings.notifications.driverIssues"),
      description: t("admin.settings.notifications.driverIssuesDesc"),
      id: "driver-issues",
    },
    {
      icon: Mail01Icon,
      label: t("admin.settings.notifications.email"),
      description: t("admin.settings.notifications.emailDesc"),
      id: "email",
    },
    {
      icon: Notification01Icon,
      label: t("admin.settings.notifications.push"),
      description: t("admin.settings.notifications.pushDesc"),
      id: "push",
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold">
        {t("admin.settings.notifications.title")}
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        {t("admin.settings.notifications.desc")}
      </p>

      <div className="mt-8 space-y-3">
        {NOTIFICATIONS.map((item) => (
          <Card key={item.id} className="border-0 shadow-sm rounded-lg">
            <CardContent className="flex justify-between items-center py-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <HugeiconsIcon
                    icon={item.icon}
                    className="size-5 text-primary"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
              <Switch id={item.id} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
