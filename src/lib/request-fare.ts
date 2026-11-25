import { getDrivingRoute } from "@/lib/driving-route";
import { estimateRideFare } from "@/lib/estimate-fare";
import { pickupAt } from "@/lib/general-settings";
import { unwrapSocketAck } from "@/lib/ride-socket";
import type { AppSocket } from "@/lib/socket";
import type { RideRequestPayload } from "@/types/ride.types";
import type { FareBreakdownPayload } from "@/types/socket.types";
import type { FareBreakdownResponse } from "@/types/ride.types";

export function farePayloadFromRequest(
  request: Partial<RideRequestPayload>,
): FareBreakdownPayload | null {
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
    request.passengers ??
      request.seats ??
      (request.malePassengers ?? 1) + (request.femalePassengers ?? 0),
  );
  return {
    pickup: {
      lat: request.pickup.lat,
      lng: request.pickup.lng,
      address: request.pickup.address,
    },
    destination: {
      lat: request.destination.lat,
      lng: request.destination.lng,
      address: request.destination.address,
    },
    type: request.type === "private" ? "private" : "split",
    passengers: Math.max(1, seats),
    malePassengers: request.malePassengers ?? 0,
    femalePassengers: request.femalePassengers ?? 0,
    departureDate: request.departureDate,
    departureTime: request.departureTime,
    luggageCounts: request.luggageCounts ?? 0,
    note: request.note,
  };
}

export async function requestServerFare(
  socket: AppSocket,
  payload: FareBreakdownPayload,
): Promise<FareBreakdownResponse> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Fare request timed out"));
    }, 8000);
    socket.emit("ride:fare-breakdown", payload, (res) => {
      clearTimeout(timer);
      const ack = unwrapSocketAck<FareBreakdownResponse>(res);
      const data = ack.data;
      if (data && (data.estimatedFare != null || data.fareBreakdown)) {
        resolve(data);
        return;
      }
      reject(new Error(ack.message || "Failed to get fare"));
    });
  });
}

export async function quoteRideFare(opts: {
  socket: AppSocket;
  payload: FareBreakdownPayload;
  settings: Record<string, string | number>;
}): Promise<FareBreakdownResponse> {
  const { socket, payload, settings } = opts;
  if (socket.connected) {
    try {
      return await requestServerFare(socket, payload);
    } catch {
      // Fall through to the local estimate so booking can continue.
    }
  }

  const route = await getDrivingRoute(payload.pickup, payload.destination);
  const local = estimateRideFare({
    distanceKm: route.distanceKm,
    seats: payload.passengers,
    luggageCounts: payload.luggageCounts,
    departure: pickupAt(payload.departureDate, payload.departureTime),
    settings,
  });
  return {
    estimatedFare: local.estimatedFare,
    estimatedDistance: route.distanceKm,
    estimatedDuration: route.durationMinutes,
    fareBreakdown: local.fareBreakdown,
    rideDetails: {
      bookingDate: payload.departureDate,
      bookingTime: payload.departureTime,
      pickup: payload.pickup,
      destination: payload.destination,
      rideType: payload.type,
      requestedSeats: payload.passengers,
      malePassengers: payload.malePassengers,
      femalePassengers: payload.femalePassengers,
      luggageCounts: payload.luggageCounts,
    },
  };
}
