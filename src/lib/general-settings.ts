import { translate } from "@/i18n/translate";
import { fromRideClock, toRideClock } from "@/lib/ride-time";
import type { GeneralSettingEntry } from "@/types/settings.types";

export function settingsMap(
  entries: GeneralSettingEntry[] | undefined | null,
): Record<string, string | number> {
  return (entries ?? []).reduce<Record<string, string | number>>((acc, entry) => {
    acc[entry.key] = entry.value;
    return acc;
  }, {});
}

export function settingNumber(
  map: Record<string, string | number>,
  key: string,
  fallback: number,
): number {
  const raw = map[key];
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function settingFlag(
  map: Record<string, string | number>,
  key: string,
  fallback = false,
): boolean {
  const raw = map[key];
  if (raw === undefined || raw === null || raw === "") return fallback;
  if (typeof raw === "number") return raw !== 0;
  const s = String(raw).trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}

/** Pickup instant from a Cyprus booking date (YYYY-MM-DD) + time (HH:mm). */
export function pickupAt(date: string, time: string): Date {
  return fromRideClock(date, time);
}

/** First of the named settings that the API returned. */
function firstSetting(
  map: Record<string, string | number>,
  keys: string[],
): number | undefined {
  for (const key of keys) {
    const n = settingNumber(map, key, Number.NaN);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

/**
 * Min advance before pickup, in ms.
 * Admin settings: privateRideMinBookingHours / splitRideMinBookingHours.
 */
export function minAdvanceMs(
  type: "private" | "split",
  map: Record<string, string | number>,
): number {
  if (type === "private") {
    const hours =
      firstSetting(map, [
        "privateRideMinBookingHours",
        "privateBookingMinHours",
      ]) ?? 1;
    return Math.max(hours, 0) * 60 * 60 * 1000;
  }
  const hours = firstSetting(map, [
    "splitRideMinBookingHours",
    "splitBookingMinHours",
  ]);
  if (hours !== undefined) return Math.max(hours, 0) * 60 * 60 * 1000;
  const minDays = settingNumber(map, "bookingMinDaysAhead", 1);
  return Math.max(minDays, 1) * 24 * 60 * 60 * 1000;
}

export function maxAdvanceMs(map: Record<string, string | number>): number {
  const maxDays = settingNumber(map, "bookingMaxDaysAhead", 30);
  return Math.max(maxDays, 1) * 24 * 60 * 60 * 1000;
}

export function refundRestrictionMs(
  type: "private" | "split",
  map: Record<string, string | number>,
): number {
  if (type === "private") {
    const hours =
      firstSetting(map, [
        "privateRideRefundRestrictionHours",
        "privateRefundRestrictionHours",
      ]) ?? 1;
    return Math.max(hours, 0) * 60 * 60 * 1000;
  }
  const hours = firstSetting(map, [
    "splitRideRefundRestrictionHours",
    "splitRefundRestrictionHours",
  ]);
  if (hours !== undefined) return Math.max(hours, 0) * 60 * 60 * 1000;
  const freeWindow = settingNumber(map, "cancellationFreeWindowHours", 24);
  return Math.max(freeWindow, 0) * 60 * 60 * 1000;
}

const SLOT_MS = 15 * 60 * 1000;

/** Earliest pickup a rider may still choose, with time left to press Continue. */
export function earliestPickup(
  type: "private" | "split",
  map: Record<string, string | number>,
  now = Date.now(),
): { date: string; time: string } {
  const earliest = now + minAdvanceMs(type, map) + 5 * 60 * 1000;
  return toRideClock(Math.ceil(earliest / SLOT_MS) * SLOT_MS);
}

export function isRefundAllowed(
  type: "private" | "split",
  date: string,
  time: string,
  map: Record<string, string | number>,
): { ok: boolean; message?: string } {
  const at = pickupAt(date, time);
  if (Number.isNaN(at.getTime())) {
    return { ok: false, message: "Pickup time is missing." };
  }
  const restrictMs = refundRestrictionMs(type, map);
  if (at.getTime() - Date.now() < restrictMs) {
    const hours = Math.max(1, Math.round(restrictMs / (60 * 60 * 1000)));
    return {
      ok: false,
      message: `Refunds and cancellations are not allowed within ${hours} hour(s) of pickup.`,
    };
  }
  return { ok: true };
}

export function bookingFrequencyMs(
  map: Record<string, string | number>,
): number {
  const hours = settingNumber(map, "bookingFrequencyHours", 0);
  return Math.max(hours, 0) * 60 * 60 * 1000;
}

export function isBookingFrequencyOk(
  lastBookingAt: string | undefined,
  map: Record<string, string | number>,
): { ok: boolean; message?: string } {
  const windowMs = bookingFrequencyMs(map);
  if (windowMs <= 0 || !lastBookingAt) return { ok: true };
  const last = new Date(lastBookingAt).getTime();
  if (!Number.isFinite(last)) return { ok: true };
  const remaining = last + windowMs - Date.now();
  if (remaining > 0) {
    const hours = Math.max(1, Math.ceil(remaining / (60 * 60 * 1000)));
    return {
      ok: false,
      message: `You can create another booking in about ${hours} hour(s).`,
    };
  }
  return { ok: true };
}

export function isPickupInBookingWindow(
  type: "private" | "split",
  date: string,
  time: string,
  map: Record<string, string | number>,
): { ok: boolean; message?: string } {
  const at = pickupAt(date, time);
  if (Number.isNaN(at.getTime())) {
    return { ok: false, message: translate("book.error.selectTime") };
  }
  const now = Date.now();
  if (at.getTime() <= now) {
    return { ok: false, message: translate("book.error.timePast") };
  }
  const minMs = minAdvanceMs(type, map);
  const maxMs = maxAdvanceMs(map);
  if (at.getTime() < now + minMs) {
    const hours = Math.round(minMs / (60 * 60 * 1000));
    return {
      ok: false,
      message: translate("book.error.tooSoon", { n: Math.max(hours, 1) }),
    };
  }
  if (at.getTime() > now + maxMs) {
    return {
      ok: false,
      message: translate("book.error.tooFar", {
        n: Math.round(maxMs / (24 * 60 * 60 * 1000)),
      }),
    };
  }
  return { ok: true };
}
