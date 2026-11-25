import type { NewRideRequest, RideType } from "@/types/ride.types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asId(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  const obj = asRecord(value);
  if (!obj) return null;
  if (typeof obj._id === "string" && obj._id.trim()) return obj._id;
  if (typeof obj.id === "string" && obj.id.trim()) return obj.id;
  if (typeof obj.$oid === "string" && obj.$oid.trim()) return obj.$oid;
  return null;
}

function pickPassengerId(obj: Record<string, unknown>): string | null {
  return (
    asId(obj._id) ??
    asId(obj.passengerId) ??
    asId(obj.passenger) ??
    asId(obj.id)
  );
}

function normalizeRideId(value: unknown): NewRideRequest["rideId"] | undefined {
  const id = asId(value);
  const obj = asRecord(value);
  if (!id && !obj) return undefined;
  const type: RideType = obj?.type === "split" ? "split" : "private";
  const mongoId = asId(obj?._id) ?? id ?? "";
  const shortId = typeof obj?.id === "string" ? obj.id : mongoId;
  if (!mongoId) return undefined;
  return { _id: mongoId, id: shortId, type };
}

function normalizeUser(value: unknown): NewRideRequest["userId"] | undefined {
  const obj = asRecord(value);
  if (!obj) return undefined;
  const id = asId(obj._id) ?? asId(obj.id);
  if (!id) return undefined;
  return {
    _id: id,
    name: typeof obj.name === "string" ? obj.name : "Passenger",
    profileImage:
      typeof obj.profileImage === "string" ? obj.profileImage : null,
  };
}

function normalizePlace(
  value: unknown,
): NewRideRequest["pickup"] | undefined {
  const obj = asRecord(value);
  if (!obj) return undefined;
  const address = typeof obj.address === "string" ? obj.address : "";
  const coordinates: [number, number] = Array.isArray(obj.coordinates)
    ? [Number(obj.coordinates[0] ?? 0), Number(obj.coordinates[1] ?? 0)]
    : [0, 0];
  return { address, coordinates };
}

function unwrap(raw: unknown): Record<string, unknown> | null {
  const obj = asRecord(raw);
  if (!obj) return null;
  for (const key of ["data", "passenger", "request", "payload"]) {
    const nested = asRecord(obj[key]);
    if (nested && (pickPassengerId(nested) || nested.rideId)) return nested;
  }
  return obj;
}

function firstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (value === undefined || value === null || value === "") continue;
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function riderCountOf(obj: Record<string, unknown>): number | undefined {
  const list = [obj.riders, obj.passengers].find(Array.isArray) as
    | unknown[]
    | undefined;
  const riders = Array.isArray(obj.riders) ? undefined : obj.riders;
  return firstNumber(obj.riderCount, obj.ridersCount, riders, list?.length);
}

/** New ride totals carried by ride:request-updated; totalSeats is the capacity. */
export function parseRequestUpdate(raw: unknown): {
  rideId: string;
  patch: Partial<
    Pick<NewRideRequest, "requestedSeats" | "estimatedFare" | "riderCount">
  >;
} | null {
  const root = asRecord(Array.isArray(raw) ? raw[0] : raw);
  const obj = asRecord(root?.data) ?? root;
  const rideId = asId(obj?.rideId) ?? asId(obj?.ride);
  if (!obj || !rideId) return null;
  const seats = firstNumber(obj.bookedSeats, obj.requestedSeats, obj.seats);
  const fare = firstNumber(obj.totalFare, obj.estimatedFare, obj.fare);
  const riders = riderCountOf(obj);
  return {
    rideId,
    patch: {
      ...(seats !== undefined ? { requestedSeats: seats } : {}),
      ...(fare !== undefined ? { estimatedFare: fare } : {}),
      ...(riders !== undefined ? { riderCount: riders } : {}),
    },
  };
}

/** Socket payloads are sometimes wrapped or use `id` / `passengerId` instead of `_id`. */
export function normalizeNewRideRequest(raw: unknown): NewRideRequest | null {
  const obj = unwrap(raw);
  if (!obj) return null;

  const passengerId = pickPassengerId(obj);
  if (!passengerId) return null;

  const rideId =
    normalizeRideId(obj.rideId) ??
    normalizeRideId(obj.ride) ??
    (typeof obj.rideId === "string" ? normalizeRideId(obj.rideId) : undefined);

  const userId =
    normalizeUser(obj.userId) ??
    normalizeUser(obj.user) ??
    normalizeUser(obj.rider);

  return {
    _id: passengerId,
    userId: userId ?? {
      _id: "",
      name: "Passenger",
      profileImage: null,
    },
    rideId: rideId ?? { _id: "", id: "", type: "private" },
    pickup: normalizePlace(obj.pickup) ?? {
      address: "",
      coordinates: [0, 0],
    },
    destination: normalizePlace(obj.destination) ?? {
      address: "",
      coordinates: [0, 0],
    },
    departureAt:
      typeof obj.departureAt === "string" ? obj.departureAt : undefined,
    departureDate:
      typeof obj.departureDate === "string" ? obj.departureDate : "",
    departureTime:
      typeof obj.departureTime === "string" ? obj.departureTime : "",
    requestedSeats: Number(
      obj.requestedSeats ?? obj.totalSeats ?? obj.seats ?? 0,
    ),
    estimatedFare: Number(obj.estimatedFare ?? obj.totalFare ?? 0),
    estimatedDistanceKm: Number(obj.estimatedDistanceKm ?? obj.estimatedDistance ?? 0),
    riderCount: Math.max(1, riderCountOf(obj) ?? 1),
    status:
      obj.status === "accepted" || obj.status === "declined"
        ? obj.status
        : "pending",
    createdAt: typeof obj.createdAt === "string" ? obj.createdAt : "",
  };
}

export function parseRideRequestList(raw: unknown): NewRideRequest[] {
  const root = asRecord(raw);
  const data = root?.data ?? raw;
  const nested = asRecord(data);
  const list = Array.isArray(data)
    ? data
    : Array.isArray(nested?.data)
      ? nested.data
      : [];
  const out: NewRideRequest[] = [];
  for (const item of list) {
    const req = normalizeNewRideRequest(item);
    if (req) out.push(req);
  }
  return out;
}
