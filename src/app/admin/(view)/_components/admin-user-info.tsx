"use client";
import { LogoutIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMe } from "@/hooks/shared/use-user";
import { useT } from "@/i18n";

export function AdminUserInfo() {
  const t = useT();
  const { data } = useMe();
  const user = data?.data;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "A";

  return (
    <Popover>
      <PopoverTrigger className="flex items-center gap-2">
        <Avatar>
          <AvatarImage
            src={user?.profileImage ?? "/user.png"}
            alt={user?.name ?? t("admin.status.admin")}
          />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-col hidden sm:flex items-start justify-center gap-1">
          <span className="text-sm font-medium">
            {user?.name ?? t("admin.status.admin")}
          </span>
          <span className="text-xs text-transparent bg-linear-to-r from-cyan-400 to-violet-500 bg-clip-text">
            {t("admin.status.admin")}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-48">
        <Button
          variant="destructive"
          size="lg"
          className="w-full"
          onClick={() => {
            window.location.href = "/logout";
          }}
        >
          {t("admin.nav.logout")} <HugeiconsIcon icon={LogoutIcon} />
        </Button>
      </PopoverContent>
    </Popover>
  );
}
