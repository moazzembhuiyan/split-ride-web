"use client";

import Rings from "@/components/core/rings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useCreateWithdraw } from "@/hooks/driver/use-withdraw";
import { useMyWithdraws } from "@/hooks/driver/use-withdraw";

export default function Page() {
  const [amount, setAmount] = useState("");
  const { data, isPending: balancePending } = useMyWithdraws();
  const createWithdraw = useCreateWithdraw();
  const balance = Number(data?.data?.walletBalance ?? 0);
  const requestedAmount = Number(amount);
  const canSubmit =
    Number.isFinite(requestedAmount) &&
    requestedAmount > 0 &&
    requestedAmount <= balance;

  function handleWithdraw() {
    if (!canSubmit) return;
    createWithdraw.mutate(
      { amount: requestedAmount },
      {
        onSuccess: () => {
          setAmount("");
          toast.success("Withdrawal request submitted");
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "Withdrawal failed",
          );
        },
      },
    );
  }

  return (
    <div className="relative h-full flex flex-col items-center w-full p-8 md:p-12 max-h-[90dvh] overflow-y-auto gap-6">
      <h1 className="text-2xl font-bold">Withdraw</h1>

      <Card className="w-full max-w-lg rounded-2xl shadow-none bg-slate-50 border-0">
        <CardContent className="p-6 flex flex-col gap-5">
          {/* Balance */}
          <div className="w-full rounded-2xl bg-linear-to-r from-cyan-400 to-violet-500 p-6 text-white text-center">
            <p className="text-sm font-medium text-white/80 mb-1">My Balance</p>
            <p className="text-4xl font-bold">
              € {balancePending ? "—" : balance.toFixed(2)}
            </p>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Input
              id="withdraw-amount"
              type="number"
              min="1"
              max={balance}
              step="0.01"
              placeholder="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-full bg-white border border-muted h-12"
            />
          </div>

          <Button
            onClick={handleWithdraw}
            disabled={!canSubmit || createWithdraw.isPending || balancePending}
            className="w-full h-14 rounded-full bg-linear-to-r from-cyan-400 to-violet-500 text-white font-semibold text-base border-0 hover:opacity-90 disabled:opacity-50"
          >
            {createWithdraw.isPending ? "Submitting..." : "Withdraw"}
          </Button>
        </CardContent>
      </Card>

      <Link
        href="/driver/my-payments"
        className="text-sm text-violet-500 underline underline-offset-2"
      >
        Go back
      </Link>

      <Rings />
    </div>
  );
}
