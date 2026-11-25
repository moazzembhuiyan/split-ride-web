"use client";

import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Calendar01Icon,
  CashIcon,
  DashboardBrowsingIcon,
  Settings01Icon,
  SteeringIcon,
  UserGroupIcon,
  UserMinus01Icon,
  ChatQuestion01Icon,
  HandHelpingIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n";

const navItems = [
  { label: "admin.nav.dashboard", href: "/admin/dashboard", icon: DashboardBrowsingIcon },
  { label: "admin.common.users", href: "/admin/users", icon: UserGroupIcon },
  { label: "admin.common.drivers", href: "/admin/drivers", icon: SteeringIcon },
  { label: "admin.common.bookings", href: "/admin/bookings", icon: Calendar01Icon },
  // {
  //   label: "Price Management",
  //   href: "/admin/price-management",
  //   icon: HotPriceIcon,
  // },
  { label: "admin.nav.transactions", href: "/admin/transactions", icon: CashIcon },
  // {
  //   label: "Withdraw Request",
  //   href: "/admin/withdraw-request",
  //   icon: Wallet01Icon,
  // },
  {
    label: "admin.nav.deletedAccounts",
    href: "/admin/delete-account",
    icon: UserMinus01Icon,
  },
  { label: "admin.nav.faq", href: "/admin/faq", icon: ChatQuestion01Icon },
  {
    label: "admin.nav.help",
    href: "/admin/help-and-support",
    icon: HandHelpingIcon,
  },
  { label: "admin.nav.settings", href: "/admin/settings", icon: Settings01Icon },
];

export function AppSidebar() {
  const path = usePathname();
  const { t, isRTL } = useI18n();

  return (
    <Sidebar collapsible="icon" side={isRTL ? "right" : "left"}>
      <SidebarHeader className="px-4 py-5">
        <Image
          src="/logo.webp"
          alt="Splitride"
          width={160}
          height={52}
          className="object-contain w-36 h-auto group-data-[collapsible=icon]:hidden"
        />
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarMenu>
          {navItems.map((item) => {
            const active = path === item.href;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={t(item.label)}
                  className={cn(
                    "rounded-full gap-3 px-4 py-3 h-auto font-medium text-sm transition-colors",
                    active
                      ? "bg-linear-to-r! from-cyan-500 to-violet-500 text-white hover:bg-none"
                      : "hover:bg-secondary",
                  )}
                >
                  <Link href={item.href}>
                    <HugeiconsIcon
                      icon={item.icon}
                      strokeWidth={2}
                      className={cn(
                        "size-5 shrink-0",
                        active ? "text-white" : "text-primary",
                      )}
                    />
                    <span
                      className={cn(active ? "text-white" : "text-primary")}
                    >
                      {t(item.label)}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
