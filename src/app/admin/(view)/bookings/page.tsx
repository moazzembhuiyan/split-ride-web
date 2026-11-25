"use client";
import { CalendarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Filter } from "lucide-react";
import React from "react";
import AnimatedTabsDemo from "@/components/shadcn-studio/tabs/tabs-27";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAllBookings } from "@/hooks/booking/use-booking";
import { useT } from "@/i18n";
import { paginate } from "@/lib/admin-list";
import type {
  AdminBookingStatus,
  AdminBookingType,
} from "@/types/booking.types";
import Past from "../_components/past";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useDeleteRide } from "@/hooks/shared/use-user";

const PAGE_SIZE_OPTIONS = [8, 16, 24];

function Paginator({
  page,
  totalPage,
  onPage,
}: {
  page: number;
  totalPage: number;
  onPage: (p: number) => void;
}) {
  if (totalPage <= 1) return null;

  const pages: (number | "…")[] = [];
  if (totalPage <= 7) {
    for (let i = 1; i <= totalPage; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPage - 1, page + 1);
      i++
    )
      pages.push(i);
    if (page < totalPage - 2) pages.push("…");
    pages.push(totalPage);
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className="size-8 flex items-center justify-center rounded-full text-sm text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
      >
        ‹
      </button>
      {(() => {
        let ellipsisCount = 0;
        return pages.map((p) => {
          if (p === "…") {
            ellipsisCount += 1;
            return (
              <span
                key={`ellipsis-${ellipsisCount}`}
                className="px-1 text-muted-foreground text-sm"
              >
                …
              </span>
            );
          }
          return (
            <button
              key={p}
              type="button"
              className={`size-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${page === p
                ? "bg-linear-to-r from-cyan-500 to-violet-500 text-white"
                : "text-muted-foreground hover:bg-muted"
                }`}
              onClick={() => onPage(p as number)}
            >
              {p}
            </button>
          );
        });
      })()}
      <button
        type="button"
        className="size-8 flex items-center justify-center rounded-full text-sm text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
        onClick={() => onPage(page + 1)}
        disabled={page === totalPage}
      >
        ›
      </button>
    </div>
  );
}

type Tab = "upcoming" | "overdue" | "past" | "cancelled";

const TAB_STATUS: Record<Tab, AdminBookingStatus> = {
  upcoming: "scheduled",
  overdue: "overdue",
  past: "completed",
  cancelled: "cancelled",
};

const EMPTY_TITLE: Record<Tab, string> = {
  upcoming: "admin.bookings.emptyUpcoming",
  overdue: "admin.bookings.emptyOverdue",
  past: "admin.bookings.emptyTitle",
  cancelled: "admin.bookings.emptyCancelled",
};

export default function Page() {
  const t = useT();
  const [type, setType] = React.useState<Tab>("upcoming");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(8);
  const [rideType, setRideType] = React.useState<AdminBookingType | "all">(
    "all",
  );
  const [departureDate, setDepartureDate] = React.useState("");
  const [departureTime, setDepartureTime] = React.useState("");

  const tabs: { name: string; value: Tab }[] = [
    { name: t("admin.bookings.upcoming"), value: "upcoming" },
    { name: t("admin.bookings.overdueTab"), value: "overdue" },
    { name: t("admin.bookings.past"), value: "past" },
    { name: t("admin.bookings.cancelled"), value: "cancelled" },
  ];

  function handleTabChange(v: Tab) {
    setType(v);
    setPage(1);
  }

  function resetFilters() {
    setRideType("all");
    setDepartureDate("");
    setDepartureTime("");
    setPage(1);
  }

  const hasActiveFilters =
    rideType !== "all" || !!departureDate || !!departureTime;

  const {
    data: bookings,
    isPending,
    isError,
  } = useAllBookings({
    status: TAB_STATUS[type],
    ...(rideType !== "all" ? { type: rideType } : {}),
    ...(departureDate ? { departureDate } : {}),
    ...(departureTime ? { departureTime } : {}),
  });

  const pagination = paginate(bookings ?? [], page, pageSize);
  const items = pagination.items;

  return (
    <div className="h-full flex flex-col justify-start items-start w-full p-4 gap-6">
      <div className="w-full flex justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`gap-2 h-10 px-4 rounded-xl border-border text-sm font-medium ${hasActiveFilters ? "border-primary text-primary" : ""}`}
              >
                <Filter className="size-4" />
                {t("admin.common.filters")}
                {hasActiveFilters && (
                  <span className="size-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">
                    {
                      [
                        rideType !== "all",
                        !!departureDate,
                        !!departureTime,
                      ].filter(Boolean).length
                    }
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-64 flex flex-col gap-4"
              side="bottom"
              align="start"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">
                  {t("admin.common.filters")}
                </h4>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t("admin.common.clearAll")}
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                {/** biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
                <label className="text-xs font-medium text-muted-foreground">
                  {t("admin.bookings.rideType")}
                </label>
                <Select
                  value={rideType}
                  onValueChange={(v) => {
                    setRideType(v as AdminBookingType | "all");
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("admin.bookings.allTypes")}
                    </SelectItem>
                    <SelectItem value="private">
                      {t("admin.status.private")}
                    </SelectItem>
                    <SelectItem value="split">
                      {t("admin.status.split")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                {/** biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
                <label className="text-xs font-medium text-muted-foreground">
                  {t("admin.bookings.departureDate")}
                </label>
                <Input
                  type="date"
                  className="h-9 text-sm"
                  value={departureDate}
                  onChange={(e) => {
                    setDepartureDate(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                {/** biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
                <label className="text-xs font-medium text-muted-foreground">
                  {t("admin.bookings.departureTime")}
                </label>
                <Input
                  type="time"
                  className="h-9 text-sm"
                  value={departureTime}
                  onChange={(e) => {
                    setDepartureTime(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <AnimatedTabsDemo<Tab>
          setValue={handleTabChange}
          value={type}
          tabs={tabs}
        />
      </div>

      <div className="flex-1 w-full">
        {isPending && (
          <div className="flex justify-center items-center py-24 text-muted-foreground text-sm">
            {t("admin.common.loading")}
          </div>
        )}

        {!isPending && items.length > 0 && <Past data={items} />}

        {isError && (
          <div className="flex justify-center items-center py-24 text-muted-foreground text-sm">
            {t("admin.bookings.loadFailed")}
          </div>
        )}

        {!isPending && !isError && items.length === 0 && (
          <div className="flex justify-center items-center pb-12">
            <Empty className="max-w-xl bg-muted-foreground/5">
              <EmptyHeader>
                <EmptyMedia className="size-20" variant="icon">
                  <HugeiconsIcon className="size-16" icon={CalendarIcon} />
                </EmptyMedia>
                <EmptyTitle>
                  {t(EMPTY_TITLE[type])}
                </EmptyTitle>
                <EmptyDescription>
                  {t("admin.bookings.emptyDesc")}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="flex items-center justify-between w-full pt-4 border-t border-border/40">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t("admin.common.showResult")}</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-18 h-8 text-sm rounded-lg border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="ml-2 text-xs">
              {t("admin.common.resultRange", {
                from: pagination.from,
                to: pagination.to,
                total: pagination.total,
              })}
            </span>
          </div>
          <Paginator
            page={pagination.page}
            totalPage={pagination.totalPage}
            onPage={setPage}
          />
        </div>
      )}
    </div>
  );
}


export function DeleteRideButton({ rideId }: { rideId: string }) {
  const t = useT();
  const { mutate, isPending } = useDeleteRide(rideId);

  function handleDelete() {
    mutate(
      undefined,
      {
        onSuccess() {
          toast.success(t("admin.bookings.deleted"));
        },
        onError(err) {
          toast.error(err.message);
        },
      },
    );

  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className="px-5 py-1.5 rounded-full text-sm font-semibold border transition-colors disabled:opacity-50 text-red-500 bg-red-50 border-red-200 hover:bg-red-100"
        >
          {t("admin.common.delete")}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("admin.bookings.deleteConfirm")}
          </AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("admin.help.cancel")}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={isPending}>
            {t("admin.common.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}