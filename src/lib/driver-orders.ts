import type {
  DriverBooking,
  DriverBookingPassenger,
} from "@/types/booking.types";
import type { NewRideRequest, Ride } from "@/types/ride.types";
import { departureMs, toRideClock } from "./ride-time";

export const ORDER_SORTS = [
  "closest",
  "farthest",
  "newest",
  "oldest",
  "priceHigh",
  "priceLow",
] as const;

export type OrderSort = (typeof ORDER_SORTS)[number];

/** Open orders still wait for their pickup; history is already over. */
export type OrderKind = "open" | "ongoing" | "history";

export interface OrderFacts {
  id: string;
  departureAt?: string | null;
  departureDate?: string | null;
  departureTime?: string | null;
  createdAt?: string | null;
  /** Null when the list shows no price. */
  price: number | null;
}

export interface OrderFilter {
  attentionOnly: boolean;
  minPrice: number | null;
  maxPrice: number | null;
}

export function requestFacts(req: NewRideRequest): OrderFacts {
  return {
    id: req.rideId?._id || req._id,
    departureAt: req.departureAt,
    departureDate: req.departureDate,
    departureTime: req.departureTime,
    createdAt: req.createdAt,
    price: Number(req.estimatedFare ?? 0),
  };
}

export function bookingFacts(
  booking: DriverBooking & { passengerId: DriverBookingPassenger },
): OrderFacts {
  return {
    id: booking._id,
    departureAt: booking.passengerId.departureAt,
    departureDate: booking.passengerId.departureDate,
    departureTime: booking.passengerId.departureTime,
    createdAt: booking.createdAt,
    price: booking.totalFare,
  };
}

/** The list of ongoing rides shows no price. */
export function rideFacts(ride: Ride): OrderFacts {
  return {
    id: ride._id,
    departureDate: ride.departureDate,
    departureTime: ride.departureTime,
    createdAt: ride.createdAt,
    price: null,
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The API never closes rides that did not take place. Beyond this age they go
 * to the end of the list, so that they cannot bury tomorrow's orders.
 */
const STALE_AFTER_MS = 7 * DAY_MS;

/** Pickup time; the start of the day when only the date is usable. */
function pickupMs(order: OrderFacts): number | null {
  return (
    departureMs(order) ??
    departureMs({ departureDate: order.departureDate, departureTime: "00:00" })
  );
}

/** Only requests that just came in live lack a creation time. */
function createdMs(order: OrderFacts): number {
  const ms = order.createdAt ? new Date(order.createdAt).getTime() : Number.NaN;
  return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
}

/** Days until pickup on the Cyprus calendar: 0 today, 1 tomorrow. */
export function daysUntilPickup(order: OrderFacts, now: number): number | null {
  const pickup = pickupMs(order);
  if (pickup === null) return null;
  const day = (ms: number) => Date.parse(`${toRideClock(ms).date}T00:00:00Z`);
  return Math.round((day(pickup) - day(now)) / DAY_MS);
}

/** The pickup time passed, but the ride was not started. */
export function isOverdue(order: OrderFacts, now: number): boolean {
  const pickup = departureMs(order);
  return pickup !== null && pickup < now;
}

/** Overdue, or to be picked up within 24 hours. */
export function needsAttention(order: OrderFacts, now: number): boolean {
  const pickup = departureMs(order);
  return (
    pickup !== null && pickup - now <= DAY_MS && now - pickup <= STALE_AFTER_MS
  );
}

function compare(a: number, b: number): number {
  return a === b ? 0 : a < b ? -1 : 1;
}

function closestRank(
  pickup: number | null,
  kind: OrderKind,
  now: number,
): [group: number, distance: number] {
  if (pickup === null) return [2, 0];
  if (kind === "history") {
    return pickup <= now ? [0, -pickup] : [1, pickup];
  }
  // Overdue orders come before the next one; stale ones come last.
  return now - pickup > STALE_AFTER_MS ? [3, -pickup] : [0, pickup];
}

function bySort(
  a: OrderFacts,
  b: OrderFacts,
  sort: OrderSort,
  kind: OrderKind,
  now: number,
): number {
  if (sort === "newest") return compare(createdMs(b), createdMs(a));
  if (sort === "oldest") return compare(createdMs(a), createdMs(b));

  if (sort === "priceHigh" || sort === "priceLow") {
    const last =
      sort === "priceHigh"
        ? Number.NEGATIVE_INFINITY
        : Number.POSITIVE_INFINITY;
    const order = compare(a.price ?? last, b.price ?? last);
    return sort === "priceHigh" ? -order : order;
  }

  const pickupA = pickupMs(a);
  const pickupB = pickupMs(b);
  if (sort === "closest") {
    const [groupA, distanceA] = closestRank(pickupA, kind, now);
    const [groupB, distanceB] = closestRank(pickupB, kind, now);
    return compare(groupA, groupB) || compare(distanceA, distanceB);
  }
  // Farthest: into the past for history, into the future otherwise.
  if (kind === "history") {
    return compare(
      pickupA ?? Number.POSITIVE_INFINITY,
      pickupB ?? Number.POSITIVE_INFINITY,
    );
  }
  return compare(
    pickupB ?? Number.NEGATIVE_INFINITY,
    pickupA ?? Number.NEGATIVE_INFINITY,
  );
}

/** A new sorted list. Ties go to the closest day, then to a fixed order. */
export function sortOrders<T>(
  items: readonly T[],
  read: (item: T) => OrderFacts,
  sort: OrderSort,
  kind: OrderKind,
  now: number,
): T[] {
  return items
    .map((item) => ({ item, facts: read(item) }))
    .sort(
      (a, b) =>
        bySort(a.facts, b.facts, sort, kind, now) ||
        bySort(a.facts, b.facts, "closest", kind, now) ||
        compare(createdMs(b.facts), createdMs(a.facts)) ||
        (a.facts.id < b.facts.id ? -1 : a.facts.id > b.facts.id ? 1 : 0),
    )
    .map(({ item }) => item);
}

export function matchesFilter(
  order: OrderFacts,
  filter: OrderFilter,
  now: number,
): boolean {
  if (filter.attentionOnly && !needsAttention(order, now)) return false;
  const { minPrice, maxPrice } = filter;
  if (minPrice === null && maxPrice === null) return true;
  if (order.price === null) return false;
  if (minPrice !== null && order.price < minPrice) return false;
  return maxPrice === null || order.price <= maxPrice;
}

/** A typed price; null when empty or not a usable amount. */
export function parsePrice(text: string): number | null {
  const value = text.trim().replace(",", ".");
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** "Tomorrow", "In 4 days" in the given language. */
export function dayLabel(days: number, locale: string): string {
  const text = new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
    days,
    "day",
  );
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}
