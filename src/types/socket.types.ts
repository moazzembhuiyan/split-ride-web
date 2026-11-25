import type { Message } from "./chat.types";
import type {
  FareBreakdownResponse,
  NewRideRequest,
  RideRequestPayload,
  RideRequestResponse,
  RideStatus,
} from "./ride.types";

export interface FareBreakdownPayload {
  pickup: { lat: number; lng: number; address: string };
  destination: { lat: number; lng: number; address: string };
  type: "split" | "private";
  passengers: number;
  malePassengers: number;
  femalePassengers: number;
  departureDate: string;
  departureTime: string;
  luggageCounts: number;
  note?: string;
  vehicleType?: any;
}

export interface NearbyDriversPayload {
  pickup: { lat: number; lng: number; address: string };
  destination: { lat: number; lng: number; address: string };
  rideType: "split" | "private";
  passengers?: number;
  departureDate: string;
  departureTime: string;
}

export interface NearbyDriver {
  driverId: string;
  driverName: string;
  driverEmail?: string;
  driverPhone?: string;
  driverPhoto?: string;
  driverRating?: number;
  vehicle?: {
    model?: string;
    number?: string;
    seats?: number;
    availableSeats?: number;
  };
  location?: { lat: number; lng: number };
  distance?: number;
  eta?: number;
  rideId?: string;
  pickup?: { address?: string; lat?: number; lng?: number };
  destination?: { address?: string; lat?: number; lng?: number };
}

export interface AckResponse {
  success: boolean;
  message: string;
}

// ─── Server → Client (listen) ───────────────────────────────────────────────

/** The rider's start code; sent as ride:start-otp and passenger:start-otp. */
export interface StartOtpPayload {
  rideId: string;
  passengerId: string;
  otp: string;
  expiresInSeconds?: number;
  message?: string;
}

export interface ServerToClientEvents {
  // ── rider events ──────────────────────────────────────────────────────────
  "ride:driver-accepted": (data: { rideId: string; driverId: string }) => void;
  "ride:cancelled": (data: { rideId: string; reason?: string }) => void;
  "ride:passenger-cancelled": (data: {
    rideId: string;
    passengerId: string;
  }) => void;
  "ride:cancelled-by-driver": (data: {
    rideId: string;
    reason?: string;
  }) => void;
  "ride:no-driver-found": (data: {
    rideId: string;
    message?: string;
    reason?: string;
  }) => void;
  "ride:driver-en-route": (data: {
    rideId: string;
    passengerId?: string;
  }) => void;
  "ride:no-show-charge": (data: { rideId: string; amount: number }) => void;
  "ride:driver-arrived": (data: {
    rideId: string;
    passengerId?: string;
    userId?: string;
  }) => void;
  "ride:trip-started": (data: {
    rideId: string;
    passengerId?: string;
    driverId?: string;
    startTime?: string;
  }) => void;
  // driver's live position, broadcast to the ride room while a trip is active
  "ride:live-update": (data: {
    driverId: string;
    lat: number;
    lng: number;
    speed?: number;
    heading?: number;
    eta?: number;
    distance?: number;
    timestamp?: number;
    encodedRoute?: string;
  }) => void;
  "ride:waiting-charge": (data: { rideId: string; amount: number }) => void;
  "ride:passenger-picked-up": (data: {
    rideId: string;
    passengerId: string;
  }) => void;
  "ride:passenger-dropped-off": (data: {
    rideId: string;
    passengerId: string;
  }) => void;
  "ride:trip-completed": (data: { rideId: string }) => void;
  "ride:request-rating": (data: { rideId: string }) => void;
  "ride:driver-disconnected": (data: { rideId: string }) => void;
  "ride:co-passenger-cancelled": (data: {
    rideId: string;
    passengerId: string;
  }) => void;
  "ride:co-passenger-picked": (data: {
    rideId: string;
    passengerId: string;
  }) => void;
  "ride:all-passengers-picked": (data: { rideId: string }) => void;
  "ride:start-otp": (data: StartOtpPayload) => void;
  "passenger:start-otp": (data: StartOtpPayload) => void;
  "ride:start-otp-verified": (data: {
    rideId: string;
    passengerId: string;
    isStartOtpVerified: boolean;
  }) => void;

  // ── driver events ─────────────────────────────────────────────────────────
  "ride:new-request": (data: NewRideRequest) => void;
  "ride:request-updated": (data: {
    rideId: string;
    reason?: "passenger_joined" | "passenger_paid" | "passenger_left";
    bookedSeats?: number;
    /** Capacity of the ride, not the seats taken. */
    totalSeats?: number;
    totalFare?: number;
    passengers?: {
      passengerId: string;
      requestedSeats: number;
      estimatedFare: number;
    }[];
    [key: string]: unknown;
  }) => void;
  "ride:already-taken": (data: { rideId: string; message?: string }) => void;
  "ride:cancelled-by-rider": (data: {
    rideId: string;
    passengerId: string;
    reason?: string;
  }) => void;
  "ride:passenger-no-show": (data: {
    rideId: string;
    passengerId: string;
  }) => void;
  "ride:rating-received": (data: {
    rideId: string;
    rating: number;
    review?: string;
  }) => void;
  "ride:passenger-picked": (data: {
    rideId: string;
    passengerId: string;
  }) => void;
  "ride:all-passengers-dropped": (data: { rideId: string }) => void;
  "driver:status-changed": (data: { isOnline: boolean }) => void;

  // ── legacy / generic ──────────────────────────────────────────────────────
  "ride:accepted": (data: { rideId: string }) => void;
  "ride:started": (data: { rideId: string }) => void;
  "ride:completed": (data: { rideId: string }) => void;
  "ride:status": (data: { rideId: string; status: RideStatus }) => void;

  // chat
  "new-message": (data: {
    _id: string;
    chatId?: string;
    text: string;
    imageUrl?: string[];
    seen: boolean;
    isEdited: boolean;
    sender: string;
    createdAt: string;
  }) => void;
  "chat-list": (
    data: Array<{
      chat: {
        _id: string;
        booking?: { _id: string; id?: string };
        participants: Array<{
          _id: string;
          name: string;
          profileImage?: string;
        }>;
        status: string;
      };
      lastMessage: {
        _id: string;
        text: string;
        imageUrl?: string[];
        seen: boolean;
        isEdited: boolean;
        sender: { _id: string; name: string; profileImage?: string | null };
        createdAt: string;
      };
      unreadMessageCount: number;
    }>,
  ) => void;
  "chat:seen": (data: { messageId: string; chatId: string }) => void;

  // booking
  "booking:request": (data: { bookingId: string; riderId: string }) => void;
  "booking:accepted": (data: { bookingId: string }) => void;
  "booking:rejected": (data: { bookingId: string; reason?: string }) => void;
  "booking:cancelled": (data: { bookingId: string }) => void;

  // generic notification
  "notification:new": (data: {
    type: string;
    title: string;
    body: string;
    payload?: Record<string, unknown>;
  }) => void;

  // connection
  error: (data: { message: string; code?: string }) => void;
}

// ─── Client → Server (emit) ─────────────────────────────────────────────────

export interface ClientToServerEvents {
  // handshake (Flutter emits this on every connect)
  "user-connected": (data: { token: string }) => void;

  // rooms
  "room:join": (roomId: string) => void;
  "room:leave": (roomId: string) => void;

  // chat
  "send-message": (data: {
    chatId: string;
    text: string;
    imageUrl?: string[];
  }) => void;
  "chat:seen": (data: { messageId: string }) => void;

  // location (driver only)
  "location:update": (data: {
    rideId: string;
    lat: number;
    lng: number;
    heading?: number;
  }) => void;

  // booking (driver only)
  "booking:accept": (data: { bookingId: string }) => void;
  "booking:reject": (data: { bookingId: string; reason?: string }) => void;

  // driver trip control
  "driver:start-trip": (
    data: { rideId: string },
    callback?: (res: {
      success: boolean;
      message: string;
      data?: { rideId: string; passengerCount: number };
    }) => void,
  ) => void;
  "driver:arrived-pickup": (
    data: { rideId: string; passengerId: string; lat: number; lng: number },
    callback?: (res: AckResponse) => void,
  ) => void;
  "driver:send-start-otp": (
    data: { rideId: string; passengerId: string; resend?: boolean },
    callback?: (res: AckResponse) => void,
  ) => void;
  "driver:pickup-ride": (
    data: { rideId: string; passengerId: string; otp?: string },
    callback?: (res: AckResponse) => void,
  ) => void;
  "passenger:send-start-otp": (
    data: { rideId: string; passengerId: string },
    callback?: (res: AckResponse & { data?: Partial<StartOtpPayload> }) => void,
  ) => void;
  "driver:drop-off-passenger": (
    data: { rideId: string; passengerId: string },
    callback?: (res: AckResponse) => void,
  ) => void;
  "driver:complete-trip": (
    data: { rideId: string; passengerId?: string },
    callback?: (res: AckResponse) => void,
  ) => void;
  "driver:cancel-ride": (
    data: { rideId: string; reason?: string },
    callback?: (res: AckResponse) => void,
  ) => void;
  "driver:ride-passenger": (
    data: { rideId: string; lat: number; lng: number },
    callback?: (res: AckResponse) => void,
  ) => void;

  // driver availability
  "driver:go-online": (
    data: { lat: number; lng: number; vehicleId: string },
    callback?: (res: AckResponse) => void,
  ) => void;
  "driver:go-offline": (
    data: { lat: number; lng: number },
    callback?: (res: AckResponse) => void,
  ) => void;

  // driver ride acceptance / rejection
  "driver:accept-ride": (
    data: { rideId: string },
    callback: (res: {
      success: boolean;
      message: string;
      data?: {
        bookingId: string;
        estimatedArrival: number;
        rideFullyAccepted?: boolean;
      };
    }) => void,
  ) => void;
  "driver:reject-ride": (
    data: { rideId: string; reason?: string },
    callback?: (res: AckResponse) => void,
  ) => void;

  // driver location
  "driver:location-update": (
    data: {
      lat: number;
      lng: number;
      encodedRoute?: string;
      speed?: number;
      heading?: number;
    },
    callback?: (res: {
      success: boolean;
      hasRide: boolean;
      rideId?: string;
      lat: number;
      lng: number;
      speed?: number;
      heading?: number;
      timestamp: number;
      encodedRoute?: string;
    }) => void,
  ) => void;

  // ride request (rider)
  "ride:request": (
    data: RideRequestPayload,
    callback: (res: {
      success: boolean;
      message: string;
      data: RideRequestResponse;
    }) => void,
  ) => void;
  "ride:join-split-ride": (
    data: RideRequestPayload,
    callback: (res: {
      success: boolean;
      message: string;
      data: RideRequestResponse;
    }) => void,
  ) => void;
  "ride:find-nearby-split-ride": (
    data: NearbyDriversPayload,
    callback: (res: {
      success: boolean;
      message?: string;
      data?:
        | { drivers?: NearbyDriver[]; driverCount?: number }
        | NearbyDriver[];
    }) => void,
  ) => void;
  "ride:get-nearby-drivers": (
    data: NearbyDriversPayload,
    callback: (res: {
      success: boolean;
      message?: string;
      data?:
        | { drivers?: NearbyDriver[]; driverCount?: number }
        | NearbyDriver[];
    }) => void,
  ) => void;
  "ride:fare-breakdown": (
    data: FareBreakdownPayload,
    callback: (res: {
      success: boolean;
      message: string;
      data: FareBreakdownResponse;
    }) => void,
  ) => void;
  "ride:cancel-before-accept": (
    data: { rideId: string; reason?: string },
    callback?: (res: AckResponse) => void,
  ) => void;
  "ride:cancel-after-accept": (
    data: { rideId: string; passengerId: string; reason?: string },
    callback?: (res: AckResponse) => void,
  ) => void;
  "ride:submit-rating": (
    data: {
      rideId: string;
      driverId: string;
      rating: number;
      feedback?: string;
    },
    callback?: (res: AckResponse) => void,
  ) => void;
}

// ─── Internal socket types ───────────────────────────────────────────────────

export type SocketEvent = keyof ServerToClientEvents;
export type SocketEventData<E extends SocketEvent> = Parameters<
  ServerToClientEvents[E]
>[0];
