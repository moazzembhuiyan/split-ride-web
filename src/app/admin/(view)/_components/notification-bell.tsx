"use client";

import { Notification01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useMyNotifications,
  useMarkAllNotificationsDone,
  useMarkNotificationDone,
} from "@/hooks/shared/use-notification";
import { useT } from "@/i18n";
import { notificationHref } from "@/lib/notification-href";

export function NotificationBell() {
  const t = useT();
  const { data: notifData } = useMyNotifications();
  const markAllDone = useMarkAllNotificationsDone();
  const markOneDone = useMarkNotificationDone();

  const notifications = notifData?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          className="hidden sm:flex p-0! justify-center relative"
          variant="ghost"
        >
          <HugeiconsIcon icon={Notification01Icon} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-[10px] text-primary-foreground font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="min-w-md">
        <PopoverHeader className="flex items-center justify-between">
          <PopoverTitle className="text-xl p-2 pb-0">
            {t("admin.notifications.title")}
          </PopoverTitle>
          {unreadCount > 0 && (
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => markAllDone.mutate()}
            >
              {t("admin.notifications.markAllRead")}
            </button>
          )}
        </PopoverHeader>
        <div className="max-h-80 overflow-y-auto space-y-2">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t("admin.notifications.empty")}
            </p>
          ) : (
            notifications.map((notif) => {
              const href = notificationHref(notif, "admin");
              return (
                <Alert
                  key={notif._id}
                  className={`flex gap-4 ${!notif.read ? "bg-muted border-primary/40" : "bg-transparent"}`}
                  onClick={() => {
                    if (!notif.read) {
                      markOneDone.mutate(notif._id);
                    }
                  }}
                >
                  <div className="p-2 size-10 rounded-full bg-background shrink-0">
                    <HugeiconsIcon icon={UserIcon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {href ? (
                      <a
                        href={href}
                        className="hover:underline"
                      >
                        <AlertTitle className="truncate">{notif.title}</AlertTitle>
                      </a>
                    ) : (
                      <AlertTitle className="truncate">{notif.title}</AlertTitle>
                    )}
                    <AlertDescription className="line-clamp-2">
                      {notif.message}
                    </AlertDescription>
                    <AlertDescription className="mt-2 text-xs">
                      {new Date(notif.createdAt).toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      |{" "}
                      {new Date(notif.createdAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </AlertDescription>
                  </div>
                </Alert>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
