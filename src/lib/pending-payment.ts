import type { RideRequestResponse } from "@/types/ride.types";

const KEY = "split-ride:pending-payment";

export interface PendingPayment {
  rideId: string;
  passengerId: string;
  bookingId?: string;
  paid?: boolean;
  response?: RideRequestResponse;
}

export function savePendingPayment(data: PendingPayment): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(data));
}

export function loadPendingPayment(): PendingPayment | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingPayment;
  } catch {
    return null;
  }
}

export function clearPendingPayment(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}

const AUTHORIZED_KEY = "split-ride:authorized-payments";
const AUTHORIZED_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface AuthorizedIds {
  paymentIntentId: string;
  paymentId: string;
  clientSecret?: string;
}

interface AuthorizedPayment extends AuthorizedIds {
  at: number;
}

function readAuthorized(): Record<string, AuthorizedPayment> {
  if (typeof window === "undefined") return {};
  try {
    const all = JSON.parse(localStorage.getItem(AUTHORIZED_KEY) ?? "{}");
    return all && typeof all === "object" ? all : {};
  } catch {
    return {};
  }
}

/**
 * A card that was authorised but not yet confirmed by our server. Kept in
 * localStorage so closing the tab cannot lead to a second charge.
 */
export function saveAuthorizedPayment(
  booking: string,
  ids: AuthorizedIds,
): void {
  const all = readAuthorized();
  all[booking] = { ...ids, at: Date.now() };
  localStorage.setItem(AUTHORIZED_KEY, JSON.stringify(all));
}

export function loadAuthorizedPayment(
  booking: string,
): AuthorizedPayment | null {
  const entry = readAuthorized()[booking];
  if (!entry?.paymentIntentId || !entry.paymentId) return null;
  return Date.now() - entry.at < AUTHORIZED_TTL_MS ? entry : null;
}

export function clearAuthorizedPayment(booking: string): void {
  const all = readAuthorized();
  delete all[booking];
  localStorage.setItem(AUTHORIZED_KEY, JSON.stringify(all));
}

export function patchPendingPayment(patch: Partial<PendingPayment>): PendingPayment | null {
  const current = loadPendingPayment();
  if (!current) return null;
  const next = { ...current, ...patch };
  savePendingPayment(next);
  return next;
}
