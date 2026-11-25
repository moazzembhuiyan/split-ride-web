"use client";

import { Delete01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
  useAllAccountDeletions,
  useDeleteAccountDeletion,
} from "@/hooks/admin/use-admin";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import type { AccountDeletion } from "@/types/admin.types";

type UserType = "all" | "user" | "provider";

interface DeletedAccount {
  id: string;
  name: string;
  avatar: string;
  deleteReason: string;
  type: "user" | "provider";
}

const mapApiToDeletedAccount = (
  item: AccountDeletion,
  t: (key: string) => string,
): DeletedAccount => {
  const user = item.user;

  return {
    id: item._id || item.id || "",
    name: user?.name ?? user?.email ?? t("admin.delete.unknown"),
    avatar: user?.profileImage ?? `/user.png`,
    deleteReason: item.reason || t("admin.delete.noReason"),
    type: user?.role === "provider" ? "provider" : "user",
  };
};

export default function Page() {
  const t = useT();
  const [search, setSearch] = useState("");
  const [userType, setUserType] = useState<UserType>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showResultCount, setShowResultCount] = useState("6");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<DeletedAccount | null>(null);

  const pageSize = Number(showResultCount) || 6;
  const query = {
    ...(userType !== "all" ? { role: userType } : {}),
    ...(search.trim() ? { searchTerm: search.trim() } : {}),
  };
  const { data, isPending, isError, refetch } = useAllAccountDeletions(
    page,
    pageSize,
    query,
  );
  const { mutate: deleteAccountDeletion, isPending: isDeleting } =
    useDeleteAccountDeletion();

  const paginator = data;
  const accounts = useMemo<DeletedAccount[]>(
    () =>
      (paginator?.data ?? []).map((item) => mapApiToDeletedAccount(item, t)),
    [paginator?.data, t],
  );
  const totalPages = Math.max(1, paginator?.pagination?.totalPage ?? 1);
  const totalItems = paginator?.pagination?.total ?? 0;

  const allSelected =
    accounts.length > 0 &&
    accounts.every((r: DeletedAccount) => selected.has(r.id));
  const someSelected = accounts.some((r: DeletedAccount) => selected.has(r.id));

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
        for (const record of accounts) {
          next.delete(record.id);
        }
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const record of accounts) {
          next.add(record.id);
        }
        return next;
      });
    }
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;

    deleteAccountDeletion(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(deleteTarget.id);
          return next;
        });
        refetch();
        toast.success(t("admin.delete.removed"));
      },
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : t("admin.delete.removeFailed"),
        );
      },
    });
  }

  function handlePageChange(nextPage: number) {
    setPage(Math.min(Math.max(1, nextPage), totalPages));
    setSelected(new Set());
  }

  function handleShowResultCountChange(nextValue: string) {
    setShowResultCount(nextValue);
    setPage(1);
    setSelected(new Set());
  }

  function handleUserTypeChange(nextValue: string) {
    setUserType(nextValue as UserType);
    setPage(1);
    setSelected(new Set());
  }

  function handleSearchChange(nextValue: string) {
    setSearch(nextValue);
    setPage(1);
    setSelected(new Set());
  }

  return (
    <div className="w-full mt-4 p-4">
      <div className="bg-white rounded-xl p-6">
        {/* User type filter */}
        <div className="mb-6">
          <Select
            value={userType}
            onValueChange={handleUserTypeChange}
          >
            <SelectTrigger className="w-fit gap-2 border-0 shadow-none text-sm font-semibold px-0 focus:ring-0">
              <span className="text-muted-foreground font-normal">
                {t("admin.common.show")}
              </span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.delete.allUser")}</SelectItem>
              <SelectItem value="user">
                {t("admin.delete.customer")}
              </SelectItem>
              <SelectItem value="provider">{t("admin.delete.driver")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={t("admin.common.searchByName")}
            className="pl-10 bg-muted/30 border-0 rounded-xl h-12 text-sm"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Table */}
        {isPending ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            {t("admin.delete.loading")}
          </div>
        ) : isError ? (
          <div className="py-10 text-center text-sm text-red-500">
            {t("admin.delete.loadFailed")}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-10 rounded-l-lg">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    aria-label={t("admin.common.selectAll")}
                    {...(someSelected && !allSelected
                      ? { "data-state": "indeterminate" }
                      : {})}
                  />
                </TableHead>
                <TableHead className="text-primary font-semibold">
                  {t("admin.delete.colUsername")}
                </TableHead>
                <TableHead className="text-primary font-semibold">
                  {t("admin.delete.colReason")}
                </TableHead>
                <TableHead className="text-primary font-semibold text-right rounded-r-lg">
                  {t("admin.common.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    {t("admin.delete.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account) => (
                  <TableRow
                    key={account.id}
                    className="hover:bg-muted/20 transition-colors border-b border-border/30"
                    data-state={
                      selected.has(account.id) ? "selected" : undefined
                    }
                  >
                    <TableCell>
                      <Checkbox
                        checked={selected.has(account.id)}
                        onCheckedChange={() => toggleRow(account.id)}
                        aria-label={t("admin.common.selectRow", {
                          name: account.name,
                        })}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10">
                          <AvatarImage
                            src={account.avatar ?? "/user.png"}
                            alt={account.name}
                          />
                          <AvatarFallback>UI</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {account.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {account.deleteReason}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-600 transition-colors"
                        aria-label={t("admin.common.delete")}
                        onClick={() => setDeleteTarget(account)}
                      >
                        <HugeiconsIcon icon={Delete01Icon} className="size-5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 px-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {t("admin.common.showResult")}
            <Select
              value={showResultCount}
              onValueChange={handleShowResultCountChange}
            >
              <SelectTrigger className="w-16 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6</SelectItem>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="24">24</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {totalItems > 0
                ? t("admin.delete.total", { count: totalItems })
                : t("admin.delete.noItems")}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full text-muted-foreground"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                &lsaquo;
              </Button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (pageNumber) => (
                  <Button
                    key={pageNumber}
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "size-8 rounded-full text-sm",
                      pageNumber === page &&
                      "bg-linear-to-r from-cyan-500 to-violet-500 text-white hover:text-white",
                    )}
                    onClick={() => handlePageChange(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                ),
              )}
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full text-muted-foreground"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
              >
                &rsaquo;
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("admin.delete.confirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.delete.confirmDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.help.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting
                ? t("admin.delete.removing")
                : t("admin.common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
