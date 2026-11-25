"use client";

import {
  EyeIcon,
  FileDownloadIcon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format } from "date-fns";
import { CalendarIcon, Filter, Search } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { DualRangeSlider } from "@/components/spectrumui/dual-range-slider-dependecies";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAllWithdraws,
  useChangeWithdrawStatus,
} from "@/hooks/driver/use-withdraw";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import type {
  Withdraw,
  WithdrawStatus,
  WithdrawUser,
} from "@/types/driver.types";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

/** Safely extract WithdrawUser from a Withdraw's user field (may be string ID or populated object) */
function getUser(w: Withdraw): WithdrawUser {
  if (typeof w.user === "string") {
    return { _id: w.user, name: "Unknown", email: "", phone: "" };
  }
  return w.user;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function StatusBadge({ status }: { status: WithdrawStatus }) {
  const cfg = {
    pending: "bg-amber-100 text-amber-700 before:bg-amber-500",
    proceed: "bg-blue-100 text-blue-700 before:bg-blue-500",
    completed: "bg-emerald-100 text-emerald-700 before:bg-emerald-500",
    cancelled: "bg-red-100 text-red-700 before:bg-red-500",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
        cfg[status] ?? cfg.pending,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "pending" && "bg-amber-500",
          status === "proceed" && "bg-blue-500",
          status === "completed" && "bg-emerald-500",
          status === "cancelled" && "bg-red-500",
        )}
      />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Detail / Action Dialog ───────────────────────────────────────────────────

function DetailDialog({
  request,
  open,
  onOpenChange,
}: {
  request: Withdraw;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const t = useT();
  const { mutate: changeStatus, isPending } = useChangeWithdrawStatus(
    request._id,
  );

  function act(status: "proceed" | "cancelled") {
    changeStatus({ status }, { onSuccess: () => onOpenChange(false) });
  }

  const user = getUser(request);
  const fields = [
    { label: t("admin.withdraw.colRequestId"), value: request.id },
    {
      label: t("admin.withdraw.colDriverName"),
      value: user.name,
      avatar: user.profileImage,
    },
    { label: "Email", value: user.email },
    { label: "Phone", value: user.phone ?? "—" },
    {
      label: t("admin.common.amountSpent"),
      value: `€${request.amount.toFixed(2)}`,
    },
    {
      label: t("admin.withdraw.colRequestDate"),
      value: new Date(request.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    },
    ...(request.stripeTransferId
      ? [{ label: "Stripe Transfer ID", value: request.stripeTransferId }]
      : []),
    ...(request.note ? [{ label: "Note", value: request.note }] : []),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {t("admin.withdraw.detailTitle")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {fields.map((field) => (
            <div key={field.label} className="space-y-1.5">
              <p className="text-sm text-muted-foreground">{field.label}</p>
              <div className="bg-muted/50 rounded-lg px-4 py-3 flex items-center gap-3">
                {field.avatar !== undefined && (
                  <Avatar className="size-7">
                    <AvatarImage
                      src={field.avatar ?? undefined}
                      alt={field.value}
                    />
                    <AvatarFallback>{initials(field.value)}</AvatarFallback>
                  </Avatar>
                )}
                <span className="text-sm font-medium break-all">
                  {field.value}
                </span>
              </div>
            </div>
          ))}
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">Status</p>
            <div className="bg-muted/50 rounded-lg px-4 py-3">
              <StatusBadge status={request.status} />
            </div>
          </div>
        </div>

        {request.status === "pending" && (
          <div className="flex gap-3 mt-2">
            <Button
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold h-12 rounded-xl"
              onClick={() => act("cancelled")}
              disabled={isPending}
            >
              {t("admin.withdraw.reject")}
            </Button>
            <Button
              className="flex-1 bg-green-700 hover:bg-green-800 text-white font-semibold h-12 rounded-xl"
              onClick={() => act("proceed")}
              disabled={isPending}
            >
              {isPending ? "Processing…" : t("admin.withdraw.disburse")}
            </Button>
          </div>
        )}
        {request.status !== "pending" && (
          <Button
            variant="outline"
            className="w-full h-11 rounded-xl font-semibold mt-2"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Page() {
  const t = useT();
  const [search, setSearch] = useState("");
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [amountRange, setAmountRange] = useState([0, 500]);
  const [amountActive, setAmountActive] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Withdraw | null>(null);
  const [confirmProceed, setConfirmProceed] = useState<Withdraw | null>(null);

  const { mutate: changeStatus, isPending: isProceeding } =
    useChangeWithdrawStatus(confirmProceed?._id ?? "");

  const query = {
    page,
    limit: pageSize,
    ...(search.trim() ? { searchTerm: search.trim() } : {}),
    ...(amountActive
      ? { minAmount: amountRange[0], maxAmount: amountRange[1] }
      : {}),
    ...(date?.from ? { dateFrom: format(date.from, "yyyy-MM-dd") } : {}),
    ...(date?.to ? { dateTo: format(date.to, "yyyy-MM-dd") } : {}),
  };

  const { data, isPending } = useAllWithdraws(query);
  const requests = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPage = pagination?.totalPage ?? 1;

  const hasDateFilter = !!date?.from;
  const hasAmountFilter = amountActive;
  const filterCount = [hasAmountFilter, hasDateFilter].filter(Boolean).length;

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
    <div className="w-full mt-4 p-4">
      <div className="bg-white rounded-xl p-6 flex flex-col gap-4">
        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={t("admin.common.searchById")}
              className="pl-9 bg-muted/40 border-0 rounded-xl h-11"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Amount + filter popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "gap-2 h-11 px-5 rounded-xl border-border text-sm font-medium",
                  filterCount > 0 && "border-primary text-primary",
                )}
              >
                <Filter className="size-4" />
                Filters
                {filterCount > 0 && (
                  <span className="size-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">
                    {filterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Amount</h4>
                {hasAmountFilter && (
                  <button
                    type="button"
                    onClick={() => {
                      setAmountActive(false);
                      setAmountRange([0, 500]);
                      setPage(1);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>
              <DualRangeSlider
                value={amountRange}
                onValueChange={(v) => {
                  setAmountRange(v);
                  setAmountActive(true);
                  setPage(1);
                }}
                min={0}
                max={500}
                step={1}
              />
              <span className="text-sm text-muted-foreground">
                €{amountRange[0]} – €{amountRange[1]}
              </span>
            </PopoverContent>
          </Popover>

          {/* Date range */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "gap-2 h-11 px-5 rounded-xl border-border text-sm font-medium",
                  hasDateFilter && "border-primary text-primary",
                )}
              >
                <CalendarIcon className="size-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "MMM dd")} –{" "}
                      {format(date.to, "MMM dd")}
                    </>
                  ) : (
                    format(date.from, "MMM dd, y")
                  )
                ) : (
                  t("admin.common.pickDate")
                )}
                {hasDateFilter && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDate(undefined);
                      setPage(1);
                    }}
                    className="ml-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={(r) => {
                  setDate(r);
                  setPage(1);
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* <Button
            variant="outline"
            className="gap-2 h-11 px-5 rounded-xl border-border text-sm font-medium"
          >
            <HugeiconsIcon
              className="text-primary size-4"
              icon={FileDownloadIcon}
            />
            {t("admin.common.download")}
          </Button> */}
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-primary font-semibold rounded-l-lg">
                {t("admin.withdraw.colRequestId")}
              </TableHead>
              <TableHead className="text-primary font-semibold">
                {t("admin.withdraw.colDriverName")}
              </TableHead>
              <TableHead className="text-primary font-semibold">
                {t("admin.withdraw.colAmount")}
              </TableHead>
              <TableHead className="text-primary font-semibold">
                {t("admin.withdraw.colRequestDate")}
              </TableHead>
              <TableHead className="text-primary font-semibold">
                {t("admin.withdraw.colStatus")}
              </TableHead>
              <TableHead className="text-primary font-semibold text-right rounded-r-lg">
                {t("admin.withdraw.colAction")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-12 text-sm"
                >
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isPending && requests.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-12 text-sm"
                >
                  No withdraw requests found.
                </TableCell>
              </TableRow>
            )}
            {!isPending &&
              requests.map((req) => (
                <TableRow
                  key={req._id}
                  className="hover:bg-muted/20 transition-colors border-b border-border/30"
                >
                  <TableCell className="font-medium text-sm font-mono">
                    {req.id}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const u = getUser(req);
                        return (
                          <>
                            <Avatar className="size-8 shrink-0">
                              <AvatarImage
                                src={u.profileImage ?? undefined}
                                alt={u.name}
                              />
                              <AvatarFallback>
                                {initials(u.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{u.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {u.email}
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-semibold">
                    €{req.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(req.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={req.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {req.status === "pending" && (
                        <button
                          type="button"
                          className="text-green-600 hover:text-green-700 transition-colors"
                          aria-label="Approve"
                          onClick={() => setConfirmProceed(req)}
                        >
                          <HugeiconsIcon icon={Tick01Icon} className="size-5" />
                        </button>
                      )}
                      <button
                        type="button"
                        className="text-amber-500 hover:text-amber-600 transition-colors"
                        aria-label="View"
                        onClick={() => setSelected(req)}
                      >
                        <HugeiconsIcon icon={EyeIcon} className="size-5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {t("admin.common.showResult")}
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-16 h-8 text-sm">
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
            {pagination && (
              <span className="ml-1 text-xs">
                {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, pagination.total)} of{" "}
                {pagination.total}
              </span>
            )}
          </div>

          {totalPage > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="size-8 flex items-center justify-center rounded-full text-sm text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                      onClick={() => setPage(p as number)}
                      className={cn(
                        "size-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors",
                        page === p
                          ? "bg-linear-to-r from-cyan-500 to-violet-500 text-white"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {p}
                    </button>
                  );
                });
              })()}
              <button
                type="button"
                className="size-8 flex items-center justify-center rounded-full text-sm text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
                onClick={() => setPage((p) => Math.min(totalPage, p + 1))}
                disabled={page === totalPage}
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detail dialog */}
      {selected && (
        <DetailDialog
          request={selected}
          open
          onOpenChange={(v) => !v && setSelected(null)}
        />
      )}

      {/* Quick proceed confirm */}
      <AlertDialog
        open={!!confirmProceed}
        onOpenChange={(v) => !v && setConfirmProceed(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Proceed withdraw?</AlertDialogTitle>
            <AlertDialogDescription>
              Disburse{" "}
              <span className="font-semibold">
                €{confirmProceed?.amount.toFixed(2)}
              </span>{" "}
              to{" "}
              <span className="font-semibold">
                {confirmProceed ? getUser(confirmProceed).name : ""}
              </span>
              . This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isProceeding}
              onClick={() =>
                changeStatus(
                  { status: "proceed" },
                  { onSuccess: () => setConfirmProceed(null) },
                )
              }
              className="bg-green-700 hover:bg-green-800 text-white"
            >
              {isProceeding ? "Processing…" : "Proceed"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
