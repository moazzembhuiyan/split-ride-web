"use client";

import { useQueryClient } from "@tanstack/react-query";
import { FileDown, Filter, Search, UserPlus } from "lucide-react";
import { useState } from "react";
import type { Value as PhoneValue } from "react-phone-number-input";
import { parsePhoneNumber } from "react-phone-number-input";
import { toast } from "sonner";
import { PhoneInput } from "@/components/core/phone-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
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
import { useRegister } from "@/hooks/auth/use-auth";
import { useAllUsers, useChangeUserStatus } from "@/hooks/shared/use-user";
import { useT } from "@/i18n";
import { paginate } from "@/lib/admin-list";
import { statusText } from "@/lib/admin-status";
import type { User } from "@/types/user.types";
import Review from "./review";

const PAGE_SIZE_OPTIONS = [6, 10, 20];

/** The API sends the total under either name. */
function driverEarnings(driver: User): number {
  const total = Number(driver.lifetimeEarnings ?? driver.totalEarning);
  return Number.isFinite(total) ? total : 0;
}

function StatusBadge({ status }: { status: string }) {
  const t = useT();
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-700 border-green-200",
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    inactive: "bg-gray-100 text-gray-600 border-gray-200",
    blocked: "bg-red-100 text-red-700 border-red-200",
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${map[status] ?? map.inactive}`}
    >
      {statusText(t, status)}
    </span>
  );
}

function BlockButton({ user }: { user: User }) {
  const t = useT();
  const { mutate, isPending } = useChangeUserStatus(user._id);
  const isBlocked = user.status === "blocked";
  return (
    <Button
      type="button"
      disabled={isPending}
      onClick={() => mutate({ status: isBlocked ? "active" : "blocked" })}
      variant="destructive"
      className={`px-6 h-10 ${isBlocked ? "bg-green-100 text-green-600 hover:bg-green-200 border-0" : ""}`}
    >
      {isBlocked ? t("admin.common.unblock") : t("admin.common.block")}
    </Button>
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
              className={`size-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                page === p
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

export default function DriversPage() {
  const t = useT();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  // Form states for creating a new driver
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState<PhoneValue | undefined>(undefined);
  const [newPassword, setNewPassword] = useState("");

  const qc = useQueryClient();
  const register = useRegister();

  const { data, isPending, isError } = useAllUsers({
    role: "provider",
    ...(search.trim() ? { searchTerm: search.trim() } : {}),
  });

  const drivers = data ?? [];
  const pagination = paginate(
    statusFilter === "all"
      ? drivers
      : drivers.filter((d) => d.status === statusFilter),
    page,
    pageSize,
  );
  const displayed = pagination.items;

  const allSelected =
    displayed.length > 0 && displayed.every((d) => selected.has(d._id));
  const someSelected = displayed.some((d) => selected.has(d._id));

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
        for (const d of displayed) next.delete(d._id);
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const d of displayed) next.add(d._id);
        return next;
      });
    }
  }

  function handlePageChange(p: number) {
    setPage(p);
    setSelected(new Set());
  }

  function handleSearch(v: string) {
    setSearch(v);
    setPage(1);
  }

  function handleStatusFilter(v: string) {
    setStatusFilter(v);
    setPage(1);
    setSelected(new Set());
  }

  const handleCreateDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPhone) {
      toast.error(t("admin.drivers.fillRequired"));
      return;
    }
    const parsed = parsePhoneNumber(newPhone);
    if (!parsed) {
      toast.error(t("admin.drivers.invalidPhone"));
      return;
    }
    const countryCode = parsed.country ?? `+${parsed.countryCallingCode}`;
    register.mutate(
      {
        name: newName.trim(),
        email: newEmail.trim(),
        countryCode,
        phone: parsed.number,
        role: "provider",
      },
      {
        onSuccess: () => {
          toast.success(t("admin.drivers.created"));
          setIsAddOpen(false);
          setNewName("");
          setNewEmail("");
          setNewPhone(undefined);
          setNewPassword("");
          qc.invalidateQueries({ queryKey: ["user"] });
        },
        onError: (err) => {
          toast.error(err.message || t("admin.drivers.createFailed"));
        },
      },
    );
  };

  return (
    <main className="h-full w-full p-4">
      <div className="flex items-center justify-between mb-6">
        <Select value={statusFilter} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-auto gap-2 bg-white border border-border rounded-full px-4 h-10 font-medium text-sm shadow-sm">
            <span className="text-muted-foreground">
              {t("admin.common.show")}
            </span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.drivers.allDrivers")}</SelectItem>
            <SelectItem value="active">{t("admin.status.active")}</SelectItem>
            <SelectItem value="pending">{t("admin.status.pending")}</SelectItem>
            <SelectItem value="blocked">{t("admin.status.blocked")}</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-3">
          {/* <Button
            variant="outline"
            className="gap-2 rounded-full h-10 px-5 bg-white border border-border text-sm font-medium shadow-sm"
          >
            <FileDown className="size-4 text-primary" />
            {t("admin.common.import")}
          </Button> */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-full h-10 px-5 text-sm font-semibold bg-linear-to-r from-cyan-500 to-violet-500 text-white hover:opacity-90 border-0 shadow-sm">
                <UserPlus className="size-4" />
                {t("admin.drivers.addNew")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-center text-lg">
                  {t("admin.drivers.addNewTitle")}
                </DialogTitle>
                <DialogDescription className="text-center">
                  {t("admin.drivers.addNewDesc")}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateDriver}>
                <FieldGroup>
                  <Field>
                    <FieldLabel>{t("admin.common.fullName")}</FieldLabel>
                    <Input
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder={t("admin.common.fullNamePlaceholder")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>{t("common.email")}</FieldLabel>
                    <Input
                      required
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder={t("auth.register.emailPlaceholder")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>{t("admin.common.phone")}</FieldLabel>
                    <PhoneInput
                      value={newPhone}
                      onChange={setNewPhone}
                      placeholder={t("admin.common.phonePlaceholder")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>{t("admin.common.assignPassword")}</FieldLabel>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t("admin.common.passwordPlaceholder")}
                    />
                  </Field>
                </FieldGroup>
                <Button
                  type="submit"
                  className="mt-6 w-full"
                  disabled={register.isPending}
                >
                  {register.isPending
                    ? t("admin.drivers.creating")
                    : t("admin.common.submit")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={t("admin.common.searchByName")}
              className="pl-11 h-11 rounded-xl border-border bg-muted/40 text-sm"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 h-11 px-5 rounded-xl border-border text-sm font-medium"
              >
                <Filter className="size-4" />
                {t("admin.common.filters")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="gap-4 flex flex-col">
              <h4 className="font-medium text-sm">
                {t("admin.transactions.colStatus")}
              </h4>
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.common.all")}</SelectItem>
                  <SelectItem value="active">{t("admin.status.active")}</SelectItem>
                  <SelectItem value="pending">{t("admin.status.pending")}</SelectItem>
                  <SelectItem value="blocked">{t("admin.status.blocked")}</SelectItem>
                </SelectContent>
              </Select>
            </PopoverContent>
          </Popover>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/60">
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label={t("admin.common.selectAll")}
                  {...(someSelected && !allSelected
                    ? { "data-state": "indeterminate" }
                    : {})}
                />
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-sm">
                {t("admin.bookings.colDriver")}
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-sm">
                {t("admin.common.colEmail")}
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-sm">
                {t("admin.transactions.colStatus")}
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-sm">
                {t("admin.common.kyc")}
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-sm">
                {t("admin.drivers.colRides")}
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-sm">
                {t("admin.drivers.colEarnings")}
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-sm">
                {t("admin.common.joined")}
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-sm">
                {t("admin.common.actions")}
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
            {!isPending && displayed.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center text-muted-foreground py-12"
                >
                  {isError
                    ? t("admin.drivers.loadFailed")
                    : t("admin.drivers.noFound")}
                </TableCell>
              </TableRow>
            )}
            {!isPending &&
              displayed.map((driver) => (
                <TableRow
                  key={driver._id}
                  className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                  data-state={selected.has(driver._id) ? "selected" : undefined}
                >
                  <TableCell>
                    <Checkbox
                      checked={selected.has(driver._id)}
                      onCheckedChange={() => toggleRow(driver._id)}
                      aria-label={t("admin.common.selectRow", {
                        name: driver.name,
                      })}
                    />
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarImage
                          src={driver.profileImage ?? undefined}
                          alt={driver.name}
                        />
                        <AvatarFallback>
                          {driver.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">
                          {driver.name}
                        </span>
                        {driver.isOnline && (
                          <span className="text-xs text-green-500">
                            {t("admin.common.online")}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {driver.email}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={driver.status} />
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs font-medium ${
                        driver.isKycVerified
                          ? "text-green-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      {driver.isKycVerified
                        ? t("admin.common.verified")
                        : t("admin.common.unverified")}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {driver.completedRides ?? 0}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    €{driverEarnings(driver).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(driver.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Review id={driver._id} verified={driver.isKycVerified} />
                      <BlockButton user={driver} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/40">
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
            onPage={handlePageChange}
          />
        </div>
      </div>
    </main>
  );
}
