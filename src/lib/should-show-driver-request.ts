import { isBookingPaid } from "@/lib/is-booking-paid";
import { rideService } from "@/services/ride.service";

export type DriverRequestVisibility = "show" | "hold" | "drop";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function unwrapPassenger(res: unknown): Record<string, unknown> | null {
  const root = asRecord(res);
  if (!root) return null;
  const data = asRecord(root.data) ?? root;
  const nested = asRecord(data.data);
  if (nested && (nested.paymentStatus || nested.status || nested._id)) {
    return nested;
  }
  return data;
}

function paymentStatusOf(passenger: Record<string, unknown>): string | undefined {
  if (typeof passenger.paymentStatus === "string") return passenger.paymentStatus;
  const payment = asRecord(passenger.payment);
  if (typeof payment?.status === "string") return payment.status;
  const booking = asRecord(passenger.booking);
  if (typeof booking?.paymentStatus === "string") return booking.paymentStatus;
  return undefined;
}

/**
 * Inbox visibility for a live ride request.
 * - show: paid / authorized
 * - hold: unpaid (wait for passenger payment; do not drop)
 * - drop: cancelled / declined
 */
export async function getDriverRequestVisibility(
  passengerId: string,
): Promise<DriverRequestVisibility> {
  try {
    const res = await rideService.getRideRequestById(passengerId);
    const passenger = unwrapPassenger(res);
    if (!passenger) return "hold";
    const status = String(passenger.status ?? "").toLowerCase();
    if (status === "cancelled" || status === "canceled" || status === "declined") {
      return "drop";
    }
    if (isBookingPaid(paymentStatusOf(passenger))) {
      return "show";
    }
    return "hold";
  } catch {
    return "hold";
  }
}

export async function shouldShowDriverRequest(passengerId: string): Promise<boolean> {
  return (await getDriverRequestVisibility(passengerId)) === "show";
}
