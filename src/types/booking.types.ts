export type BookingStatus = "pending" | "accepted" | "running" | "completed" | "cancelled";

export interface Booking {
  _id: string;
  id: string;
  passengerId: DriverBookingPassenger | null;
  rideId: DriverBookingRide | null;
  userId: { _id: string; name: string };
  driverId: { _id: string; name: string };
  totalFare: number;
  amountPaid: number;
  bookingStatus: string;
  paymentStatus: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChangeBookingStatusPayload {
  status: BookingStatus;
  cancellationReason?: string;
}

export interface GetMyBookingsQuery {
  page?: number;
  limit?: number;
}

export type AdminBookingStatus =
  | "scheduled"
  | "overdue"
  | "completed"
  | "cancelled";
export type AdminBookingType = "private" | "split";

export interface GetAllBookingsQuery {
  status?: AdminBookingStatus;
  type?: AdminBookingType;
  departureDate?: string;
  departureTime?: string;
  page?: number;
  limit?: number;
}

export interface AdminBooking {
  _id: string;
  id: string;
  pickup: { address: string; coordinates: number[] };
  destination: { address: string; coordinates: number[] };
  rideCreatedBy: { _id: string; name: string };
  driverId: { _id: string; name: string } | null;
  type: string;
  departureDate: string;
  departureTime: string;
  bookedSeats: number;
  status: string;
  paymentStatus?: string;
  /** SR number of the trip. */
  rideShortId?: string;
  /** SR numbers of the riders' bookings. */
  bookingShortIds?: string[];
  /** The only booking's SR number; null on split rides. */
  bookingShortId?: string | null;
  createdAt: string;
}

// Driver-side booking shape from GET /bookings/my-bookings
export interface DriverBookingPassenger {
  _id: string;
  departureAt?: string;
  pickup: { address: string; coordinates: number[] };
  destination: { address: string; coordinates: number[] };
  departureDate: string;
  departureTime: string;
  requestedSeats: number;
}

export interface DriverBookingRide {
  _id: string;
  type: string;
  vehicleId: {
    _id: string;
    name: string;
    number: string;
    year: number;
    seats: number;
  };
}

export interface DriverBooking {
  _id: string;
  id: string;
  passengerId: DriverBookingPassenger | null;
  rideId: DriverBookingRide;
  userId: { _id: string; name: string };
  driverId: { _id: string; name: string };
  totalFare: number;
  amountPaid: number;
  bookingStatus: string;
  paymentStatus: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RideUser {
  _id: string;
  name: string;
  email: string;
  profileImage?: string | null;
  phone?: string;
}

export interface RideVehicle {
  _id: string;
  name: string;
  number: string;
  year: number;
  seats: number;
}

export interface RidePassenger {
  _id: string;
  userId: RideUser;
  rideId: string;
  pickup: { address: string; coordinates: number[] };
  destination: { address: string; coordinates: number[] };
  departureDate: string;
  departureTime: string;
  requestedSeats: number;
  malePassengers: number;
  femalePassengers: number;
  fareType: string;
  initialCharge: number;
  perKmCharge: number;
  totalKmCharge: number;
  luggageCharge: number;
  holidayTripCharge: number;
  vat: number;
  estimatedFare: number;
  waitingCharge: number;
  fivePassengerCharge: number;
  sixPassengerCharge: number;
  totalFare: number;
  surchargePercent: number;
  surchargeAmount: number;
  paidAmount: number;
  refundAmount: number;
  paymentStatus: string;
  refundedToWallet: boolean;
  isNoShow: boolean;
  estimatedDistanceKm: number;
  estimatedDurationMinutes: number;
  luggageCounts: number;
  note: string;
  status: string;
  arrivedNotified: boolean;
  waitingStartedAt: string | null;
  waitingChargePaid: boolean;
  createdAt: string;
  updatedAt: string;
  arriveAt?: string | null;
  pickedUpAt?: string | null;
  droppedOffAt?: string | null;
}

export interface RideDetail {
  _id: string;
  rideCreatedBy: RideUser;
  type: string;
  pickup: { address: string; coordinates: number[] };
  destination: { address: string; coordinates: number[] };
  departureDate: string;
  departureTime: string;
  bookedSeats: number;
  status: string;
  createdAt: string;
  // Missing when a ride was cancelled before a driver accepted it.
  driverId: RideUser | null;
  vehicleId: RideVehicle | null;
  passengers: RidePassenger[];
}
