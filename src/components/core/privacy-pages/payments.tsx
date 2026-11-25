"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyWithdraws, useCreateWithdraw } from "@/hooks/driver/use-withdraw";
import { useT } from "@/i18n";
import type { WithdrawStatus } from "@/types/driver.types";
import { toast } from "sonner";

const STATUS_STYLES: Record<WithdrawStatus, string> = {
  pending: "bg-orange-100 text-orange-600 border-orange-200",
  proceed: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-600 border-red-200",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function Payments({ driver }: { driver?: boolean }) {
  const t = useT();
  const [amount, setAmount] = useState("");

  const { data: withdrawsData, isLoading } = useMyWithdraws();
  const createWithdraw = useCreateWithdraw();

  const walletBalance = withdrawsData?.data?.walletBalance ?? 0;
  const withdrawList = withdrawsData?.data?.withdrawList ?? [];

  function handleWithdraw() {
    const num = Number(amount);
    if (!num || num <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (num > walletBalance) {
      toast.error("Amount exceeds wallet balance");
      return;
    }

    createWithdraw.mutate(
      { amount: num },
      {
        onSuccess: () => {
          toast.success("Withdraw request submitted");
          setAmount("");
        },
        onError: (err) => {
          toast.error(err?.message ?? "Failed to submit withdraw request");
        },
      },
    );
  }

  return (
    <div className="p-6 h-full w-full space-y-6 overflow-y-auto">
      <h1 className="text-2xl font-bold">{t("profile.payments.title")}</h1>

      {/* Balance */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Card className="bg-linear-to-r from-cyan-500 to-violet-500 text-white py-4 w-full">
          <CardContent>
            <CardTitle className="text-sm text-white/80">
              {t("profile.payments.balance")}
            </CardTitle>
            {isLoading ? (
              <Skeleton className="h-10 w-40 mt-1 bg-white/20" />
            ) : (
              <CardDescription className="text-4xl font-semibold text-white mt-1">
                $ {walletBalance.toFixed(2)}
              </CardDescription>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Withdraw form */}
      <Card className="w-full rounded-2xl shadow-none bg-slate-50 border-0">
        <CardContent className="p-6 flex flex-col gap-5">
          <p className="font-bold text-base">Request Withdraw</p>
          <div className="space-y-1.5">
            <Label htmlFor="withdraw-amount">Amount</Label>
            <Input
              id="withdraw-amount"
              type="number"
              min="1"
              max={walletBalance}
              placeholder="$100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-full bg-white border border-muted h-12"
            />
          </div>
          <Button
            onClick={handleWithdraw}
            disabled={!amount.trim() || createWithdraw.isPending}
            className="w-full h-12 rounded-full bg-linear-to-r from-cyan-400 to-violet-500 text-white font-semibold border-0 hover:opacity-90 disabled:opacity-50"
          >
            {createWithdraw.isPending ? "Submitting..." : "Request Withdraw"}
          </Button>
        </CardContent>
      </Card>

      {/* Withdraw history */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Withdraw History</h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : withdrawList.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No withdraw requests yet
          </p>
        ) : (
          <div className="space-y-3">
            {withdrawList.map((w) => (
              <Card key={w._id} className="py-0 shadow-none">
                <CardContent className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight">
                      $ {w.amount.toFixed(2)}
                    </p>
                    <Badge
                      className={`mt-1 text-xs font-medium border ${STATUS_STYLES[w.status]}`}
                      variant="outline"
                    >
                      {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                    <span>{formatDate(w.createdAt)}</span>
                    <span className="opacity-40">|</span>
                    <span>{formatTime(w.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
