"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useT } from "@/i18n";
import type { MetaAmountSort, MetaTransaction } from "@/types/admin.types";

function StatusCell({ status }: { status: MetaTransaction["status"] }) {
  const t = useT();
  if (status === "paid") {
    return (
      <span className="font-bold text-sm tracking-wide text-emerald-500 uppercase">
        {t("admin.status.paid")}
      </span>
    );
  }
  if (status === "unpaid") {
    return (
      <button
        type="button"
        className="px-5 py-2 rounded-full text-white font-semibold text-sm bg-linear-to-r from-violet-500 to-teal-400 whitespace-nowrap cursor-pointer hover:opacity-90 transition-opacity"
      >
        {t("admin.transactions.payNow")}
      </button>
    );
  }
  return (
    <span className="font-bold text-sm tracking-wide text-orange-500 uppercase">
      {t("admin.status.refunded")}
    </span>
  );
}

interface Props {
  transactions: MetaTransaction[];
  amountSort?: MetaAmountSort;
  onAmountSortChange: (sort: MetaAmountSort | undefined) => void;
}

export function TransactionsTable({
  transactions,
  amountSort,
  onAmountSortChange,
}: Props) {
  const t = useT();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const allSelected =
    transactions.length > 0 && transactions.every((r) => selected.has(r.id));
  const someSelected = transactions.some((r) => selected.has(r.id));

  function toggleAll() {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const r of transactions) next.delete(r.id);
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const r of transactions) next.add(r.id);
        return next;
      });
    }
  }

  return (
    <div className="w-full mt-4">
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
            <TableHead>{t("admin.transactions.colTransactionId")}</TableHead>
            <TableHead>{t("admin.transactions.colDate")}</TableHead>
            <TableHead>{t("admin.transactions.colCustomer")}</TableHead>
            <TableHead>
              <button
                type="button"
                className="flex items-center font-semibold text-foreground hover:text-primary transition-colors"
                onClick={() =>
                  onAmountSortChange(amountSort === "asc" ? "desc" : "asc")
                }
              >
                {t("admin.transactions.colAmount")}
                {amountSort === "asc" ? (
                  <ArrowUp className="size-4 ml-1" />
                ) : amountSort === "desc" ? (
                  <ArrowDown className="size-4 ml-1" />
                ) : (
                  <ArrowUpDown className="size-4 ml-1 opacity-50" />
                )}
              </button>
            </TableHead>
            <TableHead>{t("admin.transactions.colStatus")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground py-12"
              >
                {t("admin.transactions.noFound")}
              </TableCell>
            </TableRow>
          )}
          {transactions.map((tx) => (
            <TableRow
              key={tx.id}
              className="border-b border-border/40 hover:bg-muted/30 transition-colors"
              data-state={selected.has(tx.id) ? "selected" : undefined}
            >
              <TableCell>
                <Checkbox
                  checked={selected.has(tx.id)}
                  onCheckedChange={() => toggleRow(tx.id)}
                  aria-label={t("admin.common.selectRow", {
                    name: tx.transactionId,
                  })}
                />
              </TableCell>
              <TableCell className="font-medium text-sm">
                {tx.transactionId}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {new Date(tx.createdAt).toLocaleString()}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarImage src={tx.customerPhoto} alt={tx.customer} />
                    <AvatarFallback>
                      {tx.customer
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-sm">{tx.customer}</span>
                </div>
              </TableCell>
              <TableCell className="font-semibold text-sm">
                €{tx.amount.toFixed(2)}
              </TableCell>
              <TableCell>
                <StatusCell status={tx.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
