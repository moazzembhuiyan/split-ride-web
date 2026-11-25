"use client";

import { FileDownloadIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format } from "date-fns";
import { CalendarIcon, Filter, Search } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { DualRangeSlider } from "@/components/spectrumui/dual-range-slider-dependecies";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useAllPayments } from "@/hooks/booking/use-payment";
import { useT } from "@/i18n";
import { paginate } from "@/lib/admin-list";
import type { GetPaymentsQuery } from "@/types/payment.types";
import { useDebounce } from "use-debounce";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function StatusBadge({ status }: { status: string }) {
  const t = useT();
  if (status === "paid" || status === "completed") {
    return (
      <span className="font-bold text-sm tracking-wide text-emerald-500 uppercase">
        {t("admin.status.paid")}
      </span>
    );
  }
  if (status === "refunded") {
    return (
      <span className="font-bold text-sm tracking-wide text-orange-500 uppercase">
        {t("admin.status.refunded")}
      </span>
    );
  }
  return (
    <button
      type="button"
      className="px-5 py-2 rounded-full text-white font-semibold text-sm bg-linear-to-r from-violet-500 to-teal-400 whitespace-nowrap hover:opacity-90 transition-opacity"
    >
      {t("admin.transactions.payNow")}
    </button>
  );
}

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

export default function Page() {
  const t = useT();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [amountRange, setAmountRange] = useState([0, 500]);
  const [amountActive, setAmountActive] = useState(false);
  const [amountSort, setAmountSort] = useState<GetPaymentsQuery["amount"]>();
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [debouncedSearch] = useDebounce(search, 500);
  const [debouncedAmountRange] = useDebounce(amountRange, 500);
  const [debouncedAmountActive] = useDebounce(amountActive, 500);

  const { data, isPending, isError } = useAllPayments({
    ...(debouncedSearch.trim()
      ? { searchTerm: debouncedSearch.trim() }
      : {}),
    ...(debouncedAmountActive
      ? {
        minAmount: debouncedAmountRange[0],
        maxAmount: debouncedAmountRange[1],
      }
      : {}),
    ...(amountSort ? { amount: amountSort } : {}),
    ...(date?.from ? { dateFrom: format(date.from, "yyyy-MM-dd") } : {}),
    ...(date?.to ? { dateTo: format(date.to, "yyyy-MM-dd") } : {}),
  });

  const pagination = paginate(data ?? [], page, pageSize);
  const payments = pagination.items;

  const allSelected =
    payments.length > 0 && payments.every((p) => selected.has(p._id));
  const someSelected = payments.some((p) => selected.has(p._id));

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const p of payments) next.delete(p._id);
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const p of payments) next.add(p._id);
        return next;
      });
    }
  }

  function handleSearch(v: string) {
    setSearch(v);
    setPage(1);
  }

  function handleDateSelect(range: DateRange | undefined) {
    setDate(range);
    setPage(1);
  }
  function exportSelectedToCSV() {
    const selectedPayments = payments.filter((p) => selected.has(p._id));

    if (selectedPayments.length === 0) {
      return;
    }

    const headers = [
      "Transaction ID",
      "Date",
      "Customer",
      "Payment Method",
      "Status",
      "Commission",
      "Driver Earning",
      "Amount",
    ];

    const rows = selectedPayments.map((tx) => [
      tx.transactionId,
      new Date(tx.createdAt).toISOString(),
      tx.user.name,
      tx.method,
      tx.status,
      tx.platformCommission.toFixed(2),
      tx.providerEarning.toFixed(2),
      tx.amount.toFixed(2),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  const hasDateFilter = !!date?.from;
  const hasAmountFilter = amountActive || !!amountSort;

  return (
    <div className="w-full mt-4 p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 w-fit mr-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={t("admin.transactions.searchPlaceholder")}
            className="pl-9"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* Amount range filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`gap-2 h-11 px-5 rounded-xl border-border text-sm font-medium ${hasAmountFilter ? "border-primary text-primary" : ""}`}
            >
              <Filter className="size-4" />
              {t("admin.common.filters")}
              {hasAmountFilter && (
                <span className="size-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">
                  1
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="gap-4 flex flex-col w-64">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                {t("admin.common.amountSpent")}
              </h4>
              {hasAmountFilter && (
                <button
                  type="button"
                  onClick={() => {
                    setAmountActive(false);
                    setAmountRange([0, 500]);
                    setAmountSort(undefined);
                    setPage(1);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("admin.common.clear")}
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
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">
                {t("admin.transactions.amountOrder")}
              </span>
              <Select
                value={amountSort ?? "none"}
                onValueChange={(value) => {
                  setAmountSort(
                    value === "none"
                      ? undefined
                      : (value as GetPaymentsQuery["amount"]),
                  );
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder={t("admin.transactions.defaultOrder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    {t("admin.transactions.defaultOrder")}
                  </SelectItem>
                  <SelectItem value="asc">
                    {t("admin.transactions.lowestFirst")}
                  </SelectItem>
                  <SelectItem value="desc">
                    {t("admin.transactions.highestFirst")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </PopoverContent>
        </Popover>

        {/* Date range picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`justify-start px-6 font-normal ${hasDateFilter ? "border-primary text-primary" : ""}`}
            >
              <CalendarIcon className="size-4 mr-2" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} –{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>{t("admin.common.pickDate")}</span>
              )}
              {hasDateFilter && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDateSelect(undefined);
                  }}
                  className="ml-2 text-xs text-muted-foreground hover:text-foreground"
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
              onSelect={handleDateSelect}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          className="gap-2 px-4"
          disabled={selected.size === 0}
          onClick={exportSelectedToCSV}
        >
          <HugeiconsIcon className="text-primary" icon={FileDownloadIcon} />
          {t("admin.common.download")}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-b border-border/60">
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
                aria-label={t("admin.common.selectAll")}
                className="data-[state=indeterminate]:bg-primary"
                {...(someSelected && !allSelected
                  ? { "data-state": "indeterminate" }
                  : {})}
              />
            </TableHead>
            <TableHead className="font-semibold text-foreground text-sm">
              {t("admin.transactions.colTransactionId")}
            </TableHead>
            <TableHead className="font-semibold text-foreground text-sm">
              {t("admin.transactions.colDate")}
            </TableHead>
            <TableHead className="font-semibold text-foreground text-sm">
              {t("admin.transactions.colCustomer")}
            </TableHead>
            <TableHead className="font-semibold text-foreground text-sm">
              {t("admin.transactions.colMethod")}
            </TableHead>
            <TableHead className="font-semibold text-foreground text-sm">
              {t("admin.transactions.colCommission")}
            </TableHead>
            <TableHead className="font-semibold text-foreground text-sm">
              {t("admin.transactions.colDriverEarning")}
            </TableHead>
            <TableHead className="font-semibold text-foreground text-sm">
              {t("admin.transactions.colAmount")}
            </TableHead>
            <TableHead className="font-semibold text-foreground text-sm">
              {t("admin.transactions.colStatus")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isPending && (
            <TableRow>
              <TableCell
                colSpan={9}
                className="text-center text-muted-foreground py-12"
              >
                {t("admin.common.loading")}
              </TableCell>
            </TableRow>
          )}
          {!isPending && payments.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={9}
                className="text-center text-muted-foreground py-12"
              >
                {isError
                  ? t("admin.transactions.loadFailed")
                  : t("admin.transactions.noFound")}
              </TableCell>
            </TableRow>
          )}
          {!isPending &&
            payments.map((tx) => (
              <TableRow
                key={tx._id}
                className="border-b border-border/40 hover:bg-muted/30 transition-colors"
                data-state={selected.has(tx._id) ? "selected" : undefined}
              >
                <TableCell>
                  <Checkbox
                    checked={selected.has(tx._id)}
                    onCheckedChange={() => toggleRow(tx._id)}
                    aria-label={t("admin.common.selectRow", {
                      name: tx.transactionId,
                    })}
                  />
                </TableCell>
                <TableCell className="font-medium text-sm font-mono">
                  {tx.transactionId}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {new Date(tx.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9">
                      <AvatarImage
                        src={tx.user.profileImage ?? undefined}
                        alt={tx.user.name}
                      />
                      <AvatarFallback>
                        {tx.user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-sm">
                      {tx.user.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm capitalize text-muted-foreground">
                  {tx.method}
                </TableCell>
                <TableCell className="text-sm font-medium">
                  €{tx.platformCommission.toFixed(2)}
                </TableCell>
                <TableCell className="text-sm font-medium">
                  €{tx.providerEarning.toFixed(2)}
                </TableCell>
                <TableCell className="font-semibold text-sm">
                  €{tx.amount.toFixed(2)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={tx.status} />
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between pt-4 border-t border-border/40">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{t("admin.common.showResult")}</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v));
              setPage(1);
              setSelected(new Set());
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
          {data && (
            <span className="ml-2 text-xs">
              {t("admin.common.resultRange", {
                from: pagination.from,
                to: pagination.to,
                total: pagination.total,
              })}
            </span>
          )}
        </div>
        <Paginator
          page={pagination.page}
          totalPage={pagination.totalPage}
          onPage={(p) => {
            setPage(p);
            setSelected(new Set());
          }}
        />
      </div>
    </div>
  );
}
