/** Rides take place in Cyprus, whatever time zone the browser is in. */
const RIDE_ZONE = "Asia/Nicosia";

const partsFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: RIDE_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function zoneParts(ms: number): Record<string, string> {
  return Object.fromEntries(
    partsFormat.formatToParts(ms).map((p) => [p.type, p.value]),
  );
}

function zoneOffset(ms: number): number {
  const p = zoneParts(ms);
  const asUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
    Number(p.second),
  );
  return asUtc - Math.floor(ms / 1000) * 1000;
}

/** Date (YYYY-MM-DD) and time (HH:mm) of an instant on a Cyprus clock. */
export function toRideClock(ms: number): { date: string; time: string } {
  const p = zoneParts(ms);
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    time: `${p.hour}:${p.minute}`,
  };
}

/** Instant of a Cyprus date and time; Invalid Date when either is unusable. */
export function fromRideClock(
  date: string | undefined | null,
  time: string | undefined | null,
): Date {
  const d = /^(\d{4})-(\d{2})-(\d{2})/.exec(date ?? "");
  const t = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?$/i.exec(
    (time ?? "").trim(),
  );
  if (!d || !t) return new Date(Number.NaN);
  let hours = Number(t[1]);
  const meridiem = t[3]?.toLowerCase();
  if (meridiem) hours = (hours % 12) + (meridiem === "pm" ? 12 : 0);
  const wall = Date.UTC(
    Number(d[1]),
    Number(d[2]) - 1,
    Number(d[3]),
    hours,
    Number(t[2]),
  );
  const first = wall - zoneOffset(wall);
  return new Date(wall - zoneOffset(first));
}

interface Departure {
  /** UTC instant from the server; wins over the separate date and time. */
  departureAt?: string | null;
  departureDate?: string | null;
  departureTime?: string | null;
}

export function departureMs(ride: Departure | null | undefined): number | null {
  if (!ride) return null;
  const exact = ride.departureAt
    ? new Date(ride.departureAt).getTime()
    : Number.NaN;
  if (Number.isFinite(exact)) return exact;
  const ms = fromRideClock(ride.departureDate, ride.departureTime).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/** Departure date and time to display, always on the Cyprus clock. */
export function departureLabel(ride: Departure | null | undefined): {
  date: string;
  time: string;
} {
  if (ride?.departureAt) {
    const ms = new Date(ride.departureAt).getTime();
    if (Number.isFinite(ms)) return toRideClock(ms);
  }
  return {
    date: ride?.departureDate || "—",
    time: ride?.departureTime || "—",
  };
}

const REQUEST_EXPIRY_MS = 30 * 60 * 1000;

/** Requests more than 30 minutes past pickup are no longer offered. */
export function isRequestExpired(
  request: Departure,
  now = Date.now(),
): boolean {
  const ms = departureMs(request);
  return ms !== null && now - ms > REQUEST_EXPIRY_MS;
}
