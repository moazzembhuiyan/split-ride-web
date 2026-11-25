import { settingNumber } from "@/lib/general-settings";
import type { RidePassenger } from "@/types/booking.types";

function money(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Matching surcharge in percent; it depends on how many riders share. */
export function splitSurchargePercent(
  settings: Record<string, string | number>,
  riders = 2,
): number {
  return riders >= 3
    ? settingNumber(settings, "splitRideMatchedSurchargePercent3", 50)
    : settingNumber(settings, "splitRideMatchedSurchargePercent", 30);
}

export interface SplitPartyInput {
  passengerId: string;
  seats: number;
  paidAmount: number;
  estimatedFare: number;
  refundAmount?: number;
  surchargeAmount?: number;
  surchargePercent?: number;
  status?: string;
}

export interface SplitPartyResult {
  passengerId: string;
  seats: number;
  paidAmount: number;
  share: number;
  fee: number;
  due: number;
  refundEstimate: number;
  recordedRefund: number;
  refundToShow: number;
}

export interface SplitSettlement {
  matched: boolean;
  passengerCount: number;
  totalSeats: number;
  rideFare: number;
  feePercent: number;
  parties: SplitPartyResult[];
}

function activeParty(p: SplitPartyInput): boolean {
  const status = (p.status ?? "").toLowerCase();
  return status !== "cancelled" && status !== "canceled" && status !== "declined";
}

/**
 * Split Ride settlement (frontend estimate).
 *
 * First passenger pays the full ride fare F with no matching fee.
 * After two or more paying parties are on the same ride:
 *   share = F * (partySeats / totalSeats)
 *   fee   = share * splitSurchargePercent / 100
 *   due   = share + fee
 *   refund = max(0, paid - due)
 *
 * If the API already stored refundAmount / surchargeAmount, those win for display.
 */
export function settleSplitRide(
  parties: SplitPartyInput[],
  settings: Record<string, string | number>,
): SplitSettlement {
  const live = parties.filter(activeParty);
  const totalSeats = Math.max(
    1,
    live.reduce((sum, p) => sum + Math.max(1, p.seats || 1), 0),
  );
  const rideFare = money(
    Math.max(
      0,
      ...live.map((p) =>
        Math.max(Number(p.estimatedFare) || 0, Number(p.paidAmount) || 0),
      ),
    ),
  );
  const uniqueIds = new Set(live.map((p) => p.passengerId));
  const matched = uniqueIds.size >= 2;
  const feePercent = splitSurchargePercent(settings, uniqueIds.size);

  const results: SplitPartyResult[] = live.map((p) => {
    const seats = Math.max(1, p.seats || 1);
    const paid = money(Number(p.paidAmount) || Number(p.estimatedFare) || 0);
    if (!matched) {
      return {
        passengerId: p.passengerId,
        seats,
        paidAmount: paid,
        share: paid,
        fee: 0,
        due: paid,
        refundEstimate: 0,
        recordedRefund: money(Number(p.refundAmount) || 0),
        refundToShow: money(Number(p.refundAmount) || 0),
      };
    }
    const share = money(rideFare * (seats / totalSeats));
    const recordedFee = money(Number(p.surchargeAmount) || 0);
    const fee =
      recordedFee > 0
        ? recordedFee
        : money(share * (feePercent / 100));
    const due = money(share + fee);
    const refundEstimate = money(Math.max(0, paid - due));
    const recordedRefund = money(Number(p.refundAmount) || 0);
    return {
      passengerId: p.passengerId,
      seats,
      paidAmount: paid,
      share,
      fee,
      due,
      refundEstimate,
      recordedRefund,
      refundToShow: recordedRefund > 0 ? recordedRefund : refundEstimate,
    };
  });

  return {
    matched,
    passengerCount: uniqueIds.size,
    totalSeats,
    rideFare,
    feePercent,
    parties: results,
  };
}

/** Preview if one extra 1-seat passenger joins this first booking. */
export function partiesFromPassengers(
  passengers: RidePassenger[] | undefined | null,
): SplitPartyInput[] {
  return (passengers ?? []).map((p) => ({
    passengerId: p._id,
    seats: Number(p.requestedSeats) || 1,
    paidAmount: Number(p.paidAmount) || 0,
    estimatedFare: Number(p.estimatedFare || p.totalFare) || 0,
    refundAmount: Number(p.refundAmount) || 0,
    surchargeAmount: Number(p.surchargeAmount) || 0,
    surchargePercent: Number(p.surchargePercent) || 0,
    status: p.status,
  }));
}

export function unwrapPassengers(raw: unknown): RidePassenger[] {
  if (Array.isArray(raw)) return raw as RidePassenger[];
  if (raw && typeof raw === "object" && "data" in raw) {
    const nested = (raw as { data: unknown }).data;
    if (Array.isArray(nested)) return nested as RidePassenger[];
  }
  return [];
}

export function previewJoiningExisting(
  existing: SplitPartyInput[],
  quotedFare: number,
  mySeats: number,
  settings: Record<string, string | number>,
): SplitSettlement {
  return settleSplitRide(
    [
      ...existing,
      {
        passengerId: "me",
        seats: Math.max(1, mySeats),
        paidAmount: money(quotedFare),
        estimatedFare: money(quotedFare),
      },
    ],
    settings,
  );
}

export function previewSplitIfJoined(
  quotedFare: number,
  mySeats: number,
  settings: Record<string, string | number>,
  extraSeats = 1,
): SplitPartyResult {
  const seats = Math.max(1, mySeats);
  const fare = money(Math.max(0, quotedFare));
  const dummy = settleSplitRide(
    [
      {
        passengerId: "me",
        seats,
        paidAmount: fare,
        estimatedFare: fare,
      },
      {
        passengerId: "other",
        seats: Math.max(1, extraSeats),
        paidAmount: fare,
        estimatedFare: fare,
      },
    ],
    settings,
  );
  return dummy.parties[0];
}
