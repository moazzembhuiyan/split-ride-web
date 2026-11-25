import { ApiError } from "@/lib/api";
import { userMessage } from "@/lib/error-message";
import type { AppSocket } from "@/lib/socket";
import { waitForConnection } from "@/lib/socket-ack";
import type {
  RideRequestPayload,
  RideRequestResponse,
} from "@/types/ride.types";
import type { NearbyDriver, NearbyDriversPayload } from "@/types/socket.types";

export type RideSubmitMode = "find" | "start" | "private";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function unwrapSocketAck<T>(raw: unknown): {
  success: boolean;
  message?: string;
  data: T | null;
} {
  const wrapped = Array.isArray(raw) && raw.length > 0 ? raw[0] : raw;
  const root = asRecord(wrapped);
  if (!root) return { success: false, data: null };
  const nested = asRecord(root.data);
  const data = (nested ??
    (root.data as T | null) ??
    (root as unknown as T)) as T | null;
  return {
    success: root.success !== false,
    message: typeof root.message === "string" ? root.message : undefined,
    data,
  };
}

export function toServerRidePayload(
  request: Partial<RideRequestPayload>,
  extras?: { seats?: number; note?: string },
): RideRequestPayload | null {
  if (
    !request.pickup ||
    !request.destination ||
    !request.departureDate ||
    !request.departureTime
  ) {
    return null;
  }
  const seats = Math.max(
    1,
    extras?.seats ||
      request.passengers ||
      request.seats ||
      (request.malePassengers ?? 0) + (request.femalePassengers ?? 0) ||
      1,
  );
  const type = request.type === "private" ? "private" : "split";
  return {
    pickup: request.pickup,
    destination: request.destination,
    type,
    passengers: seats,
    malePassengers: request.malePassengers ?? 0,
    femalePassengers: request.femalePassengers ?? 0,
    departureDate: request.departureDate,
    departureTime: request.departureTime,
    luggageCounts: request.luggageCounts ?? 0,
    note: extras?.note || request.note,
  };
}

function bookingIdFrom(
  data: RideRequestResponse | Record<string, unknown> | null,
): string | undefined {
  if (!data) return undefined;
  const rec = data as Record<string, unknown>;
  const bid = rec.bookingId ?? rec.booking;
  if (typeof bid === "string" && bid.length > 0) return bid;
  if (bid && typeof bid === "object" && "_id" in bid) {
    return String((bid as { _id: string })._id);
  }
  return undefined;
}

const SUBMIT_TIMEOUT_MS = 15000;
const SUBMIT_REUSE_MS = 60000;

/**
 * Requests already sent in this connection. Pressing the button again after a
 * timeout waits for the first request instead of creating a second booking.
 */
const sentRequests = new Map<string, Promise<RideRequestResponse>>();

function sendOnce(
  socket: AppSocket,
  key: string,
  send: (
    resolve: (value: RideRequestResponse) => void,
    reject: (error: Error) => void,
  ) => void,
): Promise<RideRequestResponse> {
  const existing = sentRequests.get(key);
  if (existing) return existing;

  const request = new Promise<RideRequestResponse>((resolve, reject) => {
    const forget = () => {
      clearTimeout(timer);
      socket.off("disconnect", onDisconnect);
      if (sentRequests.get(key) === request) sentRequests.delete(key);
    };
    const onDisconnect = () => {
      forget();
      reject(new ApiError({ code: "NETWORK" }));
    };
    const timer = setTimeout(() => {
      forget();
      reject(new ApiError({ code: "TIMEOUT" }));
    }, SUBMIT_REUSE_MS);
    socket.on("disconnect", onDisconnect);
    send(
      (value) => {
        clearTimeout(timer);
        socket.off("disconnect", onDisconnect);
        resolve(value);
      },
      (error) => {
        forget();
        reject(error);
      },
    );
  });
  // Without a waiting caller a late rejection is expected.
  request.catch(() => {});
  sentRequests.set(key, request);
  return request;
}

/** Forgets a sent request once its booking is done with. */
export function forgetRideSubmits(): void {
  sentRequests.clear();
}

export async function emitRideSubmit(
  socket: AppSocket,
  mode: RideSubmitMode,
  payload: RideRequestPayload,
): Promise<RideRequestResponse> {
  const event = mode === "find" ? "ride:join-split-ride" : "ride:request";
  const body = {
    pickup: payload.pickup,
    destination: payload.destination,
    type: payload.type,
    passengers: payload.passengers,
    malePassengers: payload.malePassengers,
    femalePassengers: payload.femalePassengers,
    departureDate: payload.departureDate,
    departureTime: payload.departureTime,
    luggageCounts: payload.luggageCounts,
    note: payload.note ?? "",
    vehicleType: payload.seats && payload.seats > 4 ? "6-seater" : "4-seater",
  };
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw new ApiError({ code: "OFFLINE" });
  }
  if (!(await waitForConnection(socket))) {
    throw new ApiError({ code: "NETWORK" });
  }

  const request = sendOnce(
    socket,
    JSON.stringify([event, body]),
    (resolve, reject) => {
      socket.emit(event, body, (res) => {
        const ack = unwrapSocketAck<RideRequestResponse>(res);
        if (!ack.success || !ack.data) {
          const raw = asRecord(Array.isArray(res) ? res[0] : res);
          reject(
            new Error(userMessage({ code: raw?.code, message: ack.message })),
          );
          return;
        }
        const data = ack.data;
        const bookingId = bookingIdFrom(data) ?? bookingIdFrom(asRecord(res));
        resolve({
          ...data,
          bookingId: data.bookingId ?? bookingId,
        });
      });
    },
  );
  return withTimeout(request, SUBMIT_TIMEOUT_MS);
}

/** Rejects after the given time without cancelling the underlying work. */
export function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new ApiError({ code: "TIMEOUT" })),
      ms,
    );
    work.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

export function parseNearbyDrivers(raw: unknown): NearbyDriver[] {
  const ack = unwrapSocketAck<unknown>(raw);
  const data = ack.data;
  if (Array.isArray(data)) return data as NearbyDriver[];
  const rec = asRecord(data);
  const list = rec?.drivers ?? rec?.rides ?? rec?.data;
  if (Array.isArray(list)) return list as NearbyDriver[];
  return [];
}

export async function findNearbySplitRides(
  socket: AppSocket,
  payload: NearbyDriversPayload,
): Promise<NearbyDriver[]> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve([]), 8000);
    socket.emit("ride:find-nearby-split-ride", payload, (res) => {
      clearTimeout(timer);
      resolve(parseNearbyDrivers(res));
    });
  });
}
