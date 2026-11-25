import type { AdminBooking } from "@/types/booking.types";
import { byNewest } from "./admin-list";
import { fromRideClock } from "./ride-time";

/** Same limit after which the API moves a ride to its overdue list. */
const OVERDUE_AFTER_MS = 2 * 60 * 60 * 1000;

/** Statuses in which a ride is still waiting for its pickup. */
const WAITING_STATUSES = new Set(["pending", "scheduled", "accepted"]);

/** Pickup time in ms, or null when the API sent no usable date. */
export function rideTime(
  ride: Pick<AdminBooking, "departureDate" | "departureTime">,
): number | null {
  const exact = fromRideClock(ride.departureDate, ride.departureTime).getTime();
  if (Number.isFinite(exact)) return exact;
  const dayStart = fromRideClock(ride.departureDate, "00:00").getTime();
  return Number.isFinite(dayStart) ? dayStart : null;
}

/** Ride date as entered by the rider, e.g. "24 Nov 2026, 10:00". */
export function rideDateLabel(
  ride: Pick<AdminBooking, "departureDate" | "departureTime">,
): string {
  const time = rideTime(ride);
  const date =
    time === null
      ? ride.departureDate
      : new Date(time).toLocaleDateString("en-GB", {
          timeZone: "Asia/Nicosia",
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  return [date, ride.departureTime].filter(Boolean).join(", ") || "—";
}

/** Latest pickup first; rides without a usable date go last. */
export function byRideDate(a: AdminBooking, b: AdminBooking): number {
  return (
    (rideTime(b) ?? Number.NEGATIVE_INFINITY) -
      (rideTime(a) ?? Number.NEGATIVE_INFINITY) || byNewest(a, b)
  );
}

/** Pickup long past, but the ride was never started, completed or cancelled. */
export function isOverdueRide(ride: AdminBooking, now = Date.now()): boolean {
  if (!WAITING_STATUSES.has(ride.status)) return false;
  const time = rideTime(ride);
  return time !== null && now - time > OVERDUE_AFTER_MS;
}

export function isCancelledRide(ride: Pick<AdminBooking, "status">): boolean {
  return /cancel/i.test(ride.status ?? "");
}

interface WithReference {
  bookingShortId?: string | null;
  bookingShortIds?: string[];
  bookingReference?: string;
  bookingId?: string | { id?: string };
  booking?: string | { id?: string; bookingReference?: string };
  id?: string;
  passengers?: WithReference[];
}

const SR_NUMBER = /^SR-/i;

/**
 * The SR-… number riders know their booking by, if the payload carries one.
 * A trip has an SR number of its own, which is not a booking number.
 */
export function bookingNumber(
  payload: object | null | undefined,
): string | undefined {
  if (!payload) return undefined;
  const source = payload as WithReference;
  if (source.bookingShortId) return source.bookingShortId;
  if (source.bookingShortIds) {
    return source.bookingShortIds.join(", ") || undefined;
  }
  const { booking, bookingId } = source;
  const candidates = [
    source.bookingReference,
    typeof bookingId === "object" ? bookingId?.id : bookingId,
    typeof booking === "object" ? booking?.id : booking,
    typeof booking === "object" ? booking?.bookingReference : undefined,
    source.id,
  ];
  const own = candidates.find(
    (value) => typeof value === "string" && SR_NUMBER.test(value),
  );
  if (own) return own;

  const numbers = (source.passengers ?? [])
    .map(bookingNumber)
    .filter((value): value is string => !!value);
  return numbers.length > 0 ? [...new Set(numbers)].join(", ") : undefined;
}
