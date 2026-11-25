"use client";
import {
  Delete01Icon,
  EyeIcon,
  Mail01Icon,
  PhoneCall,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search } from "lucide-react";
import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import {
  useAllSupports,
  useChangeSupportStatus,
  useDeleteSupport,
  useSendSupportMessage,
} from "@/hooks/shared/use-support";
import { useT } from "@/i18n";
import { statusText } from "@/lib/admin-status";
import { cn } from "@/lib/utils";
import type { Support, SupportStatus } from "@/types/support.types";

const PAGE_SIZE_OPTIONS = [6, 12, 24];

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Detail Dialog ────────────────────────────────────────────────────────────

function DetailDialog({
  ticket,
  open,
  onOpenChange,
}: {
  ticket: Support;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const t = useT();
  const [reply, setReply] = useState("");
  const [contactBy, setContactBy] = useState<"phone" | "email">("email");

  const { mutate: sendMessage, isPending: isSending } = useSendSupportMessage(
    ticket._id,
  );
  const { mutate: changeStatus, isPending: isChanging } =
    useChangeSupportStatus(ticket._id);

  function handleSend() {
    if (!reply.trim()) return;
    sendMessage(
      {
        subject: "Support Reply",
        messages: reply.trim(),
        contractBy: contactBy,
        status: "replied",
      },
      {
        onSuccess: () => {
          setReply("");
          onOpenChange(false);
        },
      },
    );
  }

  function handleResolve() {
    changeStatus(
      { status: "resolved" },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  const statusColor =
    ticket.status === "resolved"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : ticket.status === "replied"
        ? "bg-blue-100 text-blue-700 border-blue-200"
        : "bg-orange-100 text-orange-700 border-orange-200";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {t("admin.help.detailTitle")}
          </DialogTitle>
        </DialogHeader>

        {/* User info */}
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            <AvatarImage
              src={ticket.user?.profileImage ?? undefined}
              alt={ticket.name}
            />
            <AvatarFallback>{initials(ticket.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-sm">{ticket.name}</p>
            <div className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <HugeiconsIcon icon={Mail01Icon} className="size-3" />
                {ticket.email}
              </span>
              <span className="flex items-center gap-1">
                <HugeiconsIcon icon={PhoneCall} className="size-3" />
                {ticket.phone}
              </span>
            </div>
          </div>
          <span
            className={cn(
              "ml-auto shrink-0 text-xs font-semibold px-3 py-1 rounded-full border capitalize",
              statusColor,
            )}
          >
            {statusText(t, ticket.status || "pending")}
          </span>
        </div>

        {/* Ticket meta */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground -mt-1">
          <span className="font-mono text-foreground font-medium">
            {ticket.id}
          </span>
          <span>·</span>
          <span>
            {new Date(ticket.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
          {ticket.booking && (
            <>
              <span>·</span>
              <span>
                {t("admin.help.booking", { id: ticket.booking })}
              </span>
            </>
          )}
        </div>

        {/* Message */}
        <div className="border rounded-xl p-4 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {t("admin.help.userMessage")}
          </p>
          <p className="text-sm leading-relaxed">{ticket.reason}</p>
        </div>

        {/* Reply — only when not resolved */}
        {ticket.status !== "resolved" && (
          <>
            <div className="border rounded-xl p-4 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {t("admin.help.sendReply")}
              </p>
              <Textarea
                placeholder={t("admin.help.replyPlaceholder")}
                className="border-0 shadow-none resize-none focus-visible:ring-0 p-0 text-sm min-h-20"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">
                {t("admin.help.contactHow")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("admin.help.contactSelect")}
              </p>
              <div className="flex gap-6 mt-1">
                {(["phone", "email"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setContactBy(method)}
                    className="flex items-center gap-2.5"
                  >
                    <span
                      className={cn(
                        "size-4 rounded-full border-2 flex items-center justify-center transition-colors",
                        contactBy === method
                          ? "border-primary"
                          : "border-muted-foreground/40",
                      )}
                    >
                      {contactBy === method && (
                        <span className="size-2 rounded-full bg-primary" />
                      )}
                    </span>
                    <span className="text-sm capitalize">
                      {method === "phone"
                        ? t("admin.help.contactPhone")
                        : t("admin.help.contactEmail")}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <Button
                variant="outline"
                className="flex-1 h-11 rounded-xl font-semibold"
                onClick={() => onOpenChange(false)}
              >
                {t("admin.help.cancel")}
              </Button>
              <Button
                className="flex-1 h-11 rounded-xl font-semibold bg-green-700 hover:bg-green-800 text-white"
                onClick={handleResolve}
                disabled={isChanging}
              >
                {isChanging
                  ? t("admin.common.saving")
                  : t("admin.help.markResolved")}
              </Button>
              <Button
                className="flex-1 h-11 rounded-xl font-semibold bg-blue-900 hover:bg-blue-950 text-white"
                onClick={handleSend}
                disabled={isSending || !reply.trim()}
              >
                {isSending
                  ? t("admin.common.sending")
                  : t("admin.help.sendReply")}
              </Button>
            </div>
          </>
        )}

        {ticket.status === "resolved" && (
          <Button
            variant="outline"
            className="w-full h-11 rounded-xl font-semibold"
            onClick={() => onOpenChange(false)}
          >
            {t("admin.common.close")}
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
  const [statusFilter, setStatusFilter] = useState<SupportStatus | "all">(
    "all",
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [selected, setSelected] = useState<Support | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Support | null>(null);

  const { data, isPending } = useAllSupports({
    page,
    limit: pageSize,
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(search.trim() ? { searchTerm: search.trim() } : {}),
  });
  const { mutate: deleteSupport, isPending: isDeleting } = useDeleteSupport();

  const allTickets = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPage = pagination?.totalPage ?? 1;

  function handleDelete() {
    if (!deleteTarget) return;
    deleteSupport(deleteTarget._id, { onSuccess: () => setDeleteTarget(null) });
  }

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

  const statusBadge = (status: SupportStatus) => {
    if (status === "resolved")
      return (
        <span className="text-sm font-semibold text-green-600">
          {t("admin.status.resolved")}
        </span>
      );
    if (status === "replied")
      return (
        <span className="text-sm font-semibold text-blue-600">
          {t("admin.status.replied")}
        </span>
      );
    return (
      <span className="text-sm font-semibold text-transparent bg-linear-to-r from-cyan-500 to-violet-500 bg-clip-text">
        {statusText(t, status || "pending")}
      </span>
    );
  };

  return (
    <div className="w-full mt-4 p-4">
      <div className="bg-white rounded-xl p-6 flex flex-col gap-4">
        {/* Search + filter row */}
        <div className="flex items-center gap-3 flex-wrap justify-between">
          <div className="relative flex-1 min-w-48 max-w-xl ">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={t("admin.common.searchById")}
              className="pl-10 bg-muted/30 border-0 rounded-xl h-11 text-sm"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as SupportStatus | "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="h-11 w-40 rounded-xl text-sm border-border">
              <SelectValue placeholder={t("admin.help.allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.help.allStatuses")}</SelectItem>
              <SelectItem value="pending">{t("admin.status.pending")}</SelectItem>
              <SelectItem value="replied">{t("admin.status.replied")}</SelectItem>
              <SelectItem value="resolved">{t("admin.status.resolved")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-primary font-semibold rounded-l-lg">
                {t("admin.help.colTransId")}
              </TableHead>
              <TableHead className="text-primary font-semibold">
                {t("admin.help.colCustomer")}
              </TableHead>
              <TableHead className="text-primary font-semibold">
                {t("admin.help.colPhone")}
              </TableHead>
              <TableHead className="text-primary font-semibold">
                {t("admin.help.colReason")}
              </TableHead>
              <TableHead className="text-primary font-semibold">
                {t("admin.help.colStatus")}
              </TableHead>
              <TableHead className="text-primary font-semibold text-right rounded-r-lg">
                {t("admin.common.actions")}
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
                  {t("admin.common.loading")}
                </TableCell>
              </TableRow>
            )}
            {!isPending && allTickets.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-12 text-sm"
                >
                  {t("admin.help.empty")}
                </TableCell>
              </TableRow>
            )}
            {!isPending &&
              allTickets.map((ticket) => (
                <TableRow
                  key={ticket._id}
                  className="hover:bg-muted/20 transition-colors border-b border-border/30"
                >
                  <TableCell className="font-medium text-sm font-mono">
                    {ticket.id}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-8 shrink-0">
                        <AvatarImage
                          src={ticket.user?.profileImage ?? undefined}
                          alt={ticket.name}
                        />
                        <AvatarFallback>{initials(ticket.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{ticket.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {ticket.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {ticket.phone}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs">
                    <p className="line-clamp-2">{ticket.reason}</p>
                  </TableCell>
                  <TableCell>{statusBadge(ticket.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        className="text-amber-500 hover:text-amber-600 transition-colors"
                        aria-label={t("admin.common.view")}
                        onClick={() => setSelected(ticket)}
                      >
                        <HugeiconsIcon icon={EyeIcon} className="size-5" />
                      </button>
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-600 transition-colors"
                        aria-label={t("admin.common.delete")}
                        onClick={() => setDeleteTarget(ticket)}
                      >
                        <HugeiconsIcon icon={Delete01Icon} className="size-5" />
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
                {t("admin.common.resultRange", {
                  from: (page - 1) * pageSize + 1,
                  to: Math.min(page * pageSize, pagination.total),
                  total: pagination.total,
                })}
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
          ticket={selected}
          open
          onOpenChange={(v) => !v && setSelected(null)}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.help.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.help.deleteDesc", { id: deleteTarget?.id ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.help.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting
                ? t("admin.common.deleting")
                : t("admin.common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
