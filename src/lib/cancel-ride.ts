import { translate } from "@/i18n/translate";
import { userMessage } from "@/lib/error-message";
import { toRideClock } from "@/lib/ride-time";
import type { AppSocket } from "@/lib/socket";
import { emitAck } from "@/lib/socket-ack";
import { bookingService } from "@/services/booking.service";

const CANCEL_TIMEOUT_MS = 10000;

/** Cancellation terms; a missing value was not stated by the server. */
export interface CancellationQuote {
  fee?: number;
  refund?: number;
  holdRelease?: number;
  freeUntil?: string;
  /** The refund goes to the wallet, not back to the card. */
  toWallet?: boolean;
}

function amount(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (value === undefined || value === null || value === "") continue;
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

export function parseCancellationQuote(raw: unknown): CancellationQuote | null {
  if (!raw || typeof raw !== "object") return null;
  const outer = raw as Record<string, unknown>;
  const q = (
    outer.quote && typeof outer.quote === "object" ? outer.quote : outer
  ) as Record<string, unknown>;
  const until = q.freeUntil ?? q.freeUntilAt ?? q.freeCancellationUntil;
  const refund = amount(q.refund, q.refundAmount);
  const destination = q.refundDestination;
  // A held amount was never charged: it is released instead of refunded.
  const released =
    destination === "card_release" || (!destination && !refund)
      ? refund || amount(q.heldAmount)
      : undefined;
  const quote: CancellationQuote = {
    fee: amount(q.fee, q.cancellationFee, q.feeAmount),
    refund: destination === "card_release" ? undefined : refund,
    holdRelease: amount(
      q.holdRelease,
      q.holdReleaseAmount,
      q.releaseAmount,
      q.releasedAmount,
      released,
    ),
    freeUntil: typeof until === "string" ? until : undefined,
    toWallet: destination === "wallet" ? true : undefined,
  };
  return Object.values(quote).some((v) => v !== undefined) ? quote : null;
}

function euro(n: number): string {
  return `€${n % 1 === 0 ? n : n.toFixed(2)}`;
}

function refundLine(quote: CancellationQuote, refund: number): string {
  return translate(quote.toWallet ? "cancel.refundWallet" : "cancel.refund", {
    amount: euro(refund),
  });
}

/** What the quote means for the rider, one sentence per line. */
export function quoteLines(quote: CancellationQuote): string[] {
  const lines: string[] = [];
  if (quote.fee !== undefined) {
    lines.push(
      quote.fee > 0
        ? translate("cancel.fee", { amount: euro(quote.fee) })
        : translate("cancel.free"),
    );
  }
  if (quote.holdRelease) {
    lines.push(
      translate("cancel.holdRelease", { amount: euro(quote.holdRelease) }),
    );
  }
  if (quote.refund) lines.push(refundLine(quote, quote.refund));
  const until = quote.freeUntil ? new Date(quote.freeUntil).getTime() : 0;
  if (until > Date.now()) {
    const { date, time } = toRideClock(until);
    lines.push(translate("cancel.freeUntil", { time: `${date} ${time}` }));
  }
  return lines;
}

function outcomeMessage(quote: CancellationQuote | null): string {
  const lines = [translate("cancel.done")];
  if (quote?.holdRelease) {
    lines.push(
      translate("cancel.holdRelease", { amount: euro(quote.holdRelease) }),
    );
  } else if (quote?.refund) {
    lines.push(refundLine(quote, quote.refund));
  }
  return lines.join(" ");
}

interface CancelOptions {
  bookingId: string;
  rideId?: string;
  passengerId?: string;
  accepted: boolean;
  reason: string;
  quote?: CancellationQuote | null;
  /** REST cancellation, used when there is no ride to cancel by socket. */
  fallback: () => Promise<unknown>;
}

/**
 * Cancels the rider's place. The server does not acknowledge the event, so
 * ride:cancelled also counts; without either, the booking itself is checked.
 */
export async function cancelRide(
  socket: AppSocket,
  options: CancelOptions,
): Promise<{ ok: boolean; message: string }> {
  const { bookingId, rideId, passengerId, accepted, reason } = options;
  const success = {
    ok: true,
    message: outcomeMessage(options.quote ?? null),
  };

  if (!rideId) {
    try {
      await options.fallback();
      return success;
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : userMessage({}),
      };
    }
  }

  const aboutThisRide = (data: { rideId?: string; passengerId?: string }) =>
    (!data?.rideId || data.rideId === rideId) &&
    (!data?.passengerId || data.passengerId === passengerId)
      ? true
      : undefined;

  const result = await emitAck(
    socket,
    accepted && passengerId
      ? "ride:cancel-after-accept"
      : "ride:cancel-before-accept",
    accepted && passengerId
      ? { rideId, passengerId, reason }
      : { rideId, reason },
    {
      timeoutMs: CANCEL_TIMEOUT_MS,
      answers: [
        { event: "ride:cancelled", match: aboutThisRide },
        { event: "error", match: () => false },
      ],
    },
  );
  if (result.ok) return success;
  if (result.reason !== "timeout") {
    return { ok: false, message: result.message };
  }

  try {
    const { data } = await bookingService.getBookingById(bookingId);
    if (/cancel/i.test(data?.bookingStatus ?? "")) return success;
    await options.fallback();
    return success;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : result.message,
    };
  }
}
