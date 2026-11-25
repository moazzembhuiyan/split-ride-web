"use client";

import { CommandIcon, SearchIcon } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useT } from "@/i18n";
import { AdminUserInfo } from "./_components/admin-user-info";
import { NotificationBell } from "./_components/notification-bell";

export default function Layout({ children }: { children: React.ReactNode }) {
  const t = useT();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="bg-white shadow flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ms-1" />
            <Separator
              orientation="vertical"
              className="me-2 data-vertical:h-4 data-vertical:self-auto"
            />
            {/* <InputGroup className="h-10 lg:min-w-md">
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                placeholder={t("admin.layout.searchPlaceholder")}
              />
              <InputGroupAddon align="inline-end">
                <CommandIcon />K
              </InputGroupAddon>
            </InputGroup> */}
          </div>
          <div className="flex items-center ms-auto pe-4 gap-4">
            <AdminUserInfo />
            <NotificationBell />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4  pt-0 bg-muted">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
