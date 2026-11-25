"use client";

import type { SplitPartyResult, SplitSettlement } from "@/lib/split-settlement";

function euro(n: number) {
  return `€${n.toFixed(2)}`;
}

export function SplitSharePreview({
  quotedFare,
  preview,
  feePercent,
}: {
  quotedFare: number;
  preview: SplitPartyResult;
  feePercent: number;
}) {
  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4 flex flex-col gap-2 text-sm">
      <p className="font-bold text-violet-900">Split Ride pricing</p>
      <p className="text-muted-foreground">
        You pay the full ride now ({euro(quotedFare)}). No {feePercent}% matching
        fee is added until another passenger is matched.
      </p>
      <div className="flex justify-between">
        <span className="text-muted-foreground">If another passenger joins</span>
        <span className="font-semibold">{euro(preview.share)} share</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Matching fee ({feePercent}%)</span>
        <span className="font-semibold">{euro(preview.fee)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Estimated refund to you</span>
        <span className="font-bold text-primary">{euro(preview.refundToShow)}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Stripe refunds are issued by the server when matching is recorded. This
        app shows the live share from passengers on the ride.
      </p>
    </div>
  );
}

export function SplitSettlementCard({
  settlement,
  myPassengerId,
}: {
  settlement: SplitSettlement;
  myPassengerId?: string;
}) {
  if (settlement.parties.length === 0) return null;

  const mine =
    (myPassengerId &&
      settlement.parties.find((p) => p.passengerId === myPassengerId)) ||
    settlement.parties[0];

  if (!settlement.matched) {
    return (
      <div className="rounded-2xl border border-border bg-muted/10 p-4 text-sm text-muted-foreground">
        Waiting for another Split Ride passenger. You currently cover the full
        fare ({euro(mine?.paidAmount ?? settlement.rideFare)}), with no matching
        fee.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 flex flex-col gap-2 text-sm">
      <p className="font-bold text-emerald-900">Matched Split Ride</p>
      <p className="text-muted-foreground">
        {settlement.passengerCount} passengers · {settlement.totalSeats} seats ·
        ride fare {euro(settlement.rideFare)}
      </p>
      {mine && (
        <>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Your share</span>
            <span className="font-semibold">{euro(mine.share)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Matching fee ({settlement.feePercent}%)
            </span>
            <span className="font-semibold">{euro(mine.fee)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">You paid</span>
            <span className="font-semibold">{euro(mine.paidAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {mine.recordedRefund > 0 ? "Recorded refund" : "Estimated refund"}
            </span>
            <span className="font-bold text-primary">
              {euro(mine.refundToShow)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
