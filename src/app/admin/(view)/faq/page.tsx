"use client";

import {
  Delete01Icon,
  EyeIcon,
  PencilEdit01Icon,
  PlusSignIcon,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  useCreateFaq,
  useDeleteFaq,
  useFaqs,
  useUpdateFaq,
} from "@/hooks/shared/use-faq";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import type { Faq, FaqAudience } from "@/types/faq.types";

const PAGE_SIZE_OPTIONS = [6, 12, 24];

// ─── Dialogs ─────────────────────────────────────────────────────────────────

interface ViewDialogProps {
  faq: Faq;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onEdit: () => void;
}

function ViewDialog({ faq, open, onOpenChange, onEdit }: ViewDialogProps) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {t("admin.faq.detailsTitle")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground font-normal">
              {t("admin.faq.audience")}
            </Label>
            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary capitalize">
              {faq.audience === "provider"
                ? t("admin.status.provider")
                : t("admin.status.user")}
            </span>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground font-normal">
              {t("admin.faq.question")}
            </Label>
            <div className="border rounded-xl p-3 bg-muted/20">
              <p className="text-sm">{faq.question}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground font-normal">
              {t("admin.faq.answer")}
            </Label>
            <div className="border rounded-xl p-3 bg-muted/20 min-h-24">
              <p className="text-sm leading-relaxed">{faq.answer}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onEdit}
            className="w-full h-12 rounded-full text-white font-semibold text-sm bg-linear-to-r from-cyan-500 to-violet-500 hover:opacity-90 transition-opacity"
          >
            {t("admin.common.edit")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface EditDialogProps {
  faq: Faq;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function EditDialog({ faq, open, onOpenChange }: EditDialogProps) {
  const t = useT();
  const [question, setQuestion] = useState(faq.question);
  const [answer, setAnswer] = useState(faq.answer);
  const { mutate, isPending } = useUpdateFaq(faq._id);

  function handleSubmit() {
    if (!question.trim() || !answer.trim()) return;
    mutate(
      { question: question.trim(), answer: answer.trim() },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {t("admin.faq.editTitle")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground font-normal">
              {t("admin.faq.question")}
            </Label>
            <div className="border rounded-xl p-3 bg-muted/20">
              <Input
                className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto text-sm bg-transparent"
                placeholder={t("admin.faq.questionPlaceholder")}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground font-normal">
              {t("admin.faq.answer")}
            </Label>
            <div className="border rounded-xl p-3 bg-muted/20 min-h-32">
              <Textarea
                className="border-0 shadow-none focus-visible:ring-0 p-0 resize-none text-sm bg-transparent min-h-24"
                placeholder={t("admin.faq.answerPlaceholder")}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !question.trim() || !answer.trim()}
            className="w-full h-12 rounded-full text-white font-semibold text-sm bg-linear-to-r from-cyan-500 to-violet-500 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isPending
              ? t("admin.common.saving")
              : t("admin.common.saveChanges")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface AddDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultAudience: FaqAudience;
}

function AddDialog({ open, onOpenChange, defaultAudience }: AddDialogProps) {
  const t = useT();
  const [audience, setAudience] = useState<FaqAudience>(defaultAudience);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const { mutate, isPending } = useCreateFaq();

  function handleSubmit() {
    if (!question.trim() || !answer.trim()) return;
    mutate(
      { audience, question: question.trim(), answer: answer.trim() },
      {
        onSuccess: () => {
          setQuestion("");
          setAnswer("");
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {t("admin.faq.addTitle")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground font-normal">
              {t("admin.faq.audience")}
            </Label>
            <Select
              value={audience}
              onValueChange={(v) => setAudience(v as FaqAudience)}
            >
              <SelectTrigger className="h-10 text-sm rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">{t("admin.status.user")}</SelectItem>
                <SelectItem value="provider">
                  {t("admin.status.provider")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground font-normal">
              {t("admin.faq.question")}
            </Label>
            <div className="border rounded-xl p-3 bg-muted/20">
              <Input
                className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto text-sm bg-transparent"
                placeholder={t("admin.faq.questionPlaceholder")}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground font-normal">
              {t("admin.faq.answer")}
            </Label>
            <div className="border rounded-xl p-3 bg-muted/20 min-h-32">
              <Textarea
                className="border-0 shadow-none focus-visible:ring-0 p-0 resize-none text-sm bg-transparent min-h-24"
                placeholder={t("admin.faq.answerPlaceholder")}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !question.trim() || !answer.trim()}
            className="w-full h-12 rounded-full text-white font-semibold text-sm bg-linear-to-r from-cyan-500 to-violet-500 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isPending ? t("admin.faq.adding") : t("admin.faq.addTitle")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type DialogState =
  | { mode: "view"; faq: Faq }
  | { mode: "edit"; faq: Faq }
  | { mode: "add" }
  | null;

export default function Page() {
  const t = useT();
  const [audience, setAudience] = useState<FaqAudience>("user");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<Faq | null>(null);

  const { data, isPending } = useFaqs(audience);
  const { mutate: deleteFaq, isPending: isDeleting } = useDeleteFaq();

  const allFaqs = data?.data ?? [];
  const filtered = search.trim()
    ? allFaqs.filter(
        (f) =>
          f.question.toLowerCase().includes(search.toLowerCase()) ||
          f.answer.toLowerCase().includes(search.toLowerCase()),
      )
    : allFaqs;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  function handleAudienceChange(v: FaqAudience) {
    setAudience(v);
    setPage(1);
    setSearch("");
  }

  function handleSearch(v: string) {
    setSearch(v);
    setPage(1);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteFaq(deleteTarget._id, { onSuccess: () => setDeleteTarget(null) });
  }

  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    )
      pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <div className="w-full mt-4 p-4">
      <div className="bg-white rounded-xl p-6 flex flex-col gap-4">
        {/* Audience tabs */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-xl w-fit">
          {(
            [
              { value: "user", label: t("admin.common.users") },
              { value: "provider", label: t("admin.common.drivers") },
            ] as { value: FaqAudience; label: string }[]
          ).map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleAudienceChange(tab.value)}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-medium transition-colors",
                audience === tab.value
                  ? "bg-white shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + Add */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={t("admin.faq.searchPlaceholder")}
              className="pl-10 bg-muted/30 border-0 rounded-xl h-11 text-sm"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => setDialog({ mode: "add" })}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold bg-linear-to-r from-cyan-500 to-violet-500 hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
            {t("admin.faq.addNew")}
          </button>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-primary font-semibold rounded-l-lg w-16">
                #
              </TableHead>
              <TableHead className="text-primary font-semibold">
                {t("admin.faq.colQuestion")}
              </TableHead>
              <TableHead className="text-primary font-semibold">
                {t("admin.faq.colAnswer")}
              </TableHead>
              <TableHead className="text-primary font-semibold text-right rounded-r-lg w-24">
                {t("admin.faq.colAction")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-12 text-sm"
                >
                  {t("admin.common.loading")}
                </TableCell>
              </TableRow>
            )}
            {!isPending && paged.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-12 text-sm"
                >
                  {t("admin.faq.empty")}
                </TableCell>
              </TableRow>
            )}
            {!isPending &&
              paged.map((faq, idx) => (
                <TableRow
                  key={faq._id}
                  className="hover:bg-muted/20 transition-colors border-b border-border/30"
                >
                  <TableCell className="text-center text-sm font-medium text-muted-foreground">
                    {String((page - 1) * pageSize + idx + 1).padStart(2, "0")}
                  </TableCell>
                  <TableCell className="text-sm max-w-xs">
                    <p className="line-clamp-2">{faq.question}</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-sm">
                    <p className="line-clamp-2">{faq.answer}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        className="text-amber-500 hover:text-amber-600 transition-colors"
                        aria-label={t("admin.common.view")}
                        onClick={() => setDialog({ mode: "view", faq })}
                      >
                        <HugeiconsIcon icon={EyeIcon} className="size-5" />
                      </button>
                      <button
                        type="button"
                        className="text-primary hover:opacity-70 transition-opacity"
                        aria-label={t("admin.common.edit")}
                        onClick={() => setDialog({ mode: "edit", faq })}
                      >
                        <HugeiconsIcon
                          icon={PencilEdit01Icon}
                          className="size-5"
                        />
                      </button>
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-600 transition-colors"
                        aria-label={t("admin.common.delete")}
                        onClick={() => setDeleteTarget(faq)}
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
            {filtered.length > 0 && (
              <span className="ml-1 text-xs">
                {t("admin.common.resultRange", {
                  from: (page - 1) * pageSize + 1,
                  to: Math.min(page * pageSize, filtered.length),
                  total: filtered.length,
                })}
              </span>
            )}
          </div>

          {totalPages > 1 && (
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
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {dialog?.mode === "view" && (
        <ViewDialog
          faq={dialog.faq}
          open
          onOpenChange={(v) => !v && setDialog(null)}
          onEdit={() => setDialog({ mode: "edit", faq: dialog.faq })}
        />
      )}
      {dialog?.mode === "edit" && (
        <EditDialog
          faq={dialog.faq}
          open
          onOpenChange={(v) => !v && setDialog(null)}
        />
      )}
      {dialog?.mode === "add" && (
        <AddDialog
          open
          onOpenChange={(v) => !v && setDialog(null)}
          defaultAudience={audience}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.faq.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.faq.deleteDesc")}
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
