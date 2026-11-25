"use client";

import { FileDown, Filter, Search, UserPlus } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import {
  useAllUsers,
  useChangeUserStatus,
  useDeleteUser,
} from "@/hooks/shared/use-user";

import { toast } from "sonner";
import { useT } from "@/i18n";
import { paginate } from "@/lib/admin-list";
import { statusText } from "@/lib/admin-status";
import type { GetUsersQuery, User } from "@/types/user.types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


const PAGE_SIZE_OPTIONS = [6, 10, 20];

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


function DeleteUserButton({ userId }: { userId: string }) {
  const t = useT();
  const { mutate, isPending } = useDeleteUser(userId);

  function handleDelete() {
    mutate(
      undefined,
      {
        onSuccess() {
          toast.success(t("admin.users.deleted"));
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
            {t("admin.users.deleteConfirm")}
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


function BlockButton({ user }: { user: User }) {
  const t = useT();
  const { mutate, isPending } = useChangeUserStatus(user._id);
  const isBlocked = user.status === "blocked";
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => mutate({ status: isBlocked ? "active" : "blocked" })}
      className={`px-5 py-1.5 rounded-full text-sm font-semibold border transition-colors disabled:opacity-50 ${isBlocked
        ? "text-green-600 bg-green-50 border-green-200 hover:bg-green-100"
        : "text-red-500 bg-red-50 border-red-200 hover:bg-red-100"
        }`}
    >
      {isBlocked ? t("admin.common.unblock") : t("admin.common.block")}
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

export default function UsersPage() {
  const t = useT();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<GetUsersQuery["role"] | "all">(
    "all",
  );
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const { data, isPending, isError } = useAllUsers({
    ...(search.trim() ? { searchTerm: search.trim() } : {}),
    ...(roleFilter !== "all" ? { role: roleFilter } : {}),
  });

  const pagination = paginate(data ?? [], page, pageSize);
  const users = pagination.items;

  const allSelected =
    users.length > 0 && users.every((u) => selected.has(u._id));
  const someSelected = users.some((u) => selected.has(u._id));

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
        for (const u of users) next.delete(u._id);
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const u of users) next.add(u._id);
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

  function handleRoleFilter(v: string) {
    setRoleFilter(v as GetUsersQuery["role"] | "all");
    setPage(1);
  }
  function exportSelectedToCSV() {
    const selectedUsers = users.filter((u) => selected.has(u._id));

    if (selectedUsers.length === 0) {
      toast.error(t("admin.users.selectOne"));
      return;
    }

    const headers = [
      "Name",
      "Email",
      "Role",
      "Status",
      "Phone",
      "KYC",
      "Online",
      "Joined At",
    ];

    const rows = selectedUsers.map((user) => [
      user.name,
      user.email ?? "",
      user.role,
      user.status,
      user.phone ?? "",
      user.isKycVerified ? "Verified" : "Unverified",
      user.isOnline ? "Yes" : "No",
      new Date(user.createdAt).toISOString(),
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
    link.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <main className="h-full w-full p-4">
      <div className="flex items-center justify-between mb-6">
        <Select value={roleFilter} onValueChange={handleRoleFilter}>
          <SelectTrigger className="w-auto gap-2 bg-white border border-border rounded-full px-4 h-10 font-medium text-sm shadow-sm">
            <span className="text-muted-foreground">
              {t("admin.common.show")}
            </span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.users.allUsers")}</SelectItem>
            <SelectItem value="user">{t("admin.common.users")}</SelectItem>
            <SelectItem value="provider">{t("admin.common.drivers")}</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={exportSelectedToCSV}
            disabled={selected.size === 0}
            className="gap-2 rounded-full h-10 px-5 bg-white border border-border text-sm font-medium shadow-sm"
          >
            <FileDown className="size-4 text-primary" />
            {t("admin.common.import")}
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-full h-10 px-5 text-sm font-semibold bg-linear-to-r from-cyan-500 to-violet-500 text-white hover:opacity-90 border-0 shadow-sm">
                <UserPlus className="size-4" />
                {t("admin.users.addNew")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-center text-lg">
                  {t("admin.users.addNewTitle")}
                </DialogTitle>
                <DialogDescription className="text-center">
                  {t("admin.users.addNewDesc")}
                </DialogDescription>
              </DialogHeader>
              <form>
                <FieldGroup>
                  <Field>
                    <FieldLabel>{t("admin.common.fullName")}</FieldLabel>
                    <Input
                      placeholder={t("admin.common.fullNamePlaceholder")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>{t("admin.common.phone")}</FieldLabel>
                    <Input placeholder={t("admin.common.phonePlaceholder")} />
                  </Field>
                  <Field>
                    <FieldLabel>{t("admin.common.assignPassword")}</FieldLabel>
                    <Input
                      placeholder={t("admin.common.passwordPlaceholder")}
                    />
                  </Field>
                </FieldGroup>
                <Button type="submit" className="mt-6 w-full">
                  {t("admin.common.submit")}
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
              <h4 className="font-medium text-sm">{t("admin.common.role")}</h4>
              <Select value={roleFilter} onValueChange={handleRoleFilter}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.common.all")}</SelectItem>
                  <SelectItem value="user">{t("admin.status.user")}</SelectItem>
                  <SelectItem value="provider">{t("admin.status.provider")}</SelectItem>
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
                {t("admin.common.colCustomer")}
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-sm">
                {t("admin.common.colEmail")}
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-sm">
                {t("admin.common.role")}
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-sm">
                {t("admin.transactions.colStatus")}
              </TableHead>
              <TableHead className="font-semibold text-muted-foreground text-sm">
                {t("admin.common.kyc")}
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
                  colSpan={8}
                  className="text-center text-muted-foreground py-12"
                >
                  {t("admin.common.loading")}
                </TableCell>
              </TableRow>
            )}
            {!isPending && users.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground py-12"
                >
                  {isError
                    ? t("admin.users.loadFailed")
                    : t("admin.users.noFound")}
                </TableCell>
              </TableRow>
            )}
            {!isPending &&
              users.map((user) => (
                <TableRow
                  key={user._id}
                  className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                  data-state={selected.has(user._id) ? "selected" : undefined}
                >
                  <TableCell>
                    <Checkbox
                      checked={selected.has(user._id)}
                      onCheckedChange={() => toggleRow(user._id)}
                      aria-label={t("admin.common.selectRow", {
                        name: user.name,
                      })}
                    />
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarImage
                          src={user.profileImage ?? undefined}
                          alt={user.name}
                        />
                        <AvatarFallback>
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">
                          {user.name}
                        </span>
                        {user.isOnline && (
                          <span className="text-xs text-green-500">
                            {t("admin.common.online")}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-xs">
                      {statusText(t, user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={user.status} />
                  </TableCell>
                  <TableCell>
                    {user.role === "provider" && (
                      <span
                        className={`text-xs font-medium ${user.isKycVerified
                          ? "text-green-600"
                          : "text-destructive"
                          }`}
                      >
                        {user.isKycVerified
                          ? t("admin.common.verified")
                          : t("admin.common.unverified")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="space-x-2">
                    <BlockButton user={user} />
                    <DeleteUserButton userId={user._id} />
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
