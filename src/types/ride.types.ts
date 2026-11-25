export type RideType = "split" | "private";
export type RideStatus = "accepted" | "started" | "completed" | "cancelled";

export interface RideLocation {
  address: string;
  coordinates: [number, number]; // [lng, lat]
}

export interface LuggagePolicy {
  backpackCounts: number;
  note?: string;
}

export interface Ride {
  _id: string;
  id: string;
  driver: string;
  driverId?: string;
  rideType: RideType;
  pickup: RideLocation;
  destination: RideLocation;
  departureDate: string;
  departureTime: string;
  totalSeats: number;
  availableSeats?: number;
  estimatedFare: number;
  estimatedDistanceKm: number;
  estimatedDurationMinutes: number;
  luggagePolicy?: LuggagePolicy;
  status: RideStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRidePayload {
  driverId?: string;
  rideType: RideType;
  pickup: RideLocation;
  destination: RideLocation;
  departureTime: string;
  totalSeats: number;
  requestedSeats: number;
  estimatedFare: number;
  estimatedDistanceKm: number;
  estimatedDurationMinutes: number;
  luggagePolicy?: LuggagePolicy;
}

export interface GetDriverRidesQuery {
  status?: RideStatus;
}

export interface GetRiderRidesQuery {
  status?: RideStatus;
  page?: number;
  limit?: number;
}

export interface GetAllRidesQuery {
  status?: "scheduled" | "completed";
  type?: RideType;
  departureDate?: string;
  departureTime?: string;
}

export interface RideLocationPoint {
  lat: number;
  lng: number;
  address: string;
}

export interface RideRequestPayload {
  pickup: RideLocationPoint;
  destination: RideLocationPoint;
  type: RideType;
  /** Flutter / socket field. Same value as seats. */
  passengers: number;
  /** Client-only; Flutter emit does not send seats. */
  seats?: number;
  malePassengers: number;
  femalePassengers: number;
  departureDate: string;
  departureTime: string;
  luggageCounts: number;
  note?: string;
  vehicleType?: any;
}

export interface FareBreakdown {
  initialCharge: number;
  perKmCharge: number;
  totalKmCharge: number;
  luggageCharge: number;
  passengerCountExtra: number;
  holidaySurcharge: number;
  waitingCharge: number;
  fivePassengerExtraCharge: number;
  sixPassengerExtraChargePercentage: number;
  baseFare?: number;
  actualFare?: number;
  fareBeforeFees?: number;
  bracketRoundedFare?: number;
  vat: number;
  vatIncluded?: boolean;
  vatAmount?: number;
  netBeforeVat?: number;
  minimumFareApplied?: boolean;
  minimumFareAdjustment?: number;
  splitSurchargePercent?: number;
  splitSurchargeAmount?: number;
  splitRideMatchedSurchargePercent?: number;
  splitRideMatchedSurchargeAmount?: number;
  platformCommissionAmount?: number;
  totalFare: number;
}

export interface NewRideRequest {
  _id: string;
  userId: {
    _id: string;
    name: string;
    profileImage: string | null;
  };
  rideId: {
    _id: string;
    type: RideType;
    id: string;
  };
  pickup: {
    address: string;
    coordinates: [number, number];
  };
  destination: {
    address: string;
    coordinates: [number, number];
  };
  departureAt?: string;
  departureDate: string;
  departureTime: string;
  requestedSeats: number;
  estimatedFare: number;
  estimatedDistanceKm: number;
  /** Riders on this ride; seats and fare are their totals. */
  riderCount: number;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

export interface FareBreakdownResponse {
  estimatedFare: number;
  estimatedDistance: number;
  estimatedDuration: number;
  fareBreakdown: FareBreakdown;
  rideDetails: {
    bookingDate: string;
    bookingTime: string;
    pickup: { lat: number; lng: number; address: string };
    destination: { lat: number; lng: number; address: string };
    rideType: string;
    requestedSeats: number;
    malePassengers: number;
    femalePassengers: number;
    luggageCounts: number;
  };
}

export interface RideRequestResponse {
  rideId: string;
  passengerId: string;
  bookingId?: string;
  notifiedDrivers: number;
  estimatedFare: number;
  estimatedDistance: number;
  estimatedDuration: number;
  fareBreakdown: FareBreakdown;
  rideDetails: {
    bookingDate: string;
    bookingTime: string;
    pickup: { address: string; coordinates: [number, number] };
    destination: { address: string; coordinates: [number, number] };
    rideType: string;
    totalSeats: number;
  };
}
