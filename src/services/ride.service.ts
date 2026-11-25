import { howl } from "@/lib/api";
import type { ApiResponse, PagedResponse, Paginator } from "@/types/base";
import type {
  CreateRidePayload,
  GetAllRidesQuery,
  GetDriverRidesQuery,
  GetRiderRidesQuery,
  Ride,
} from "@/types/ride.types";
import type { RidePassenger } from "@/types/booking.types";
import type { Passenger } from "@/types/driver.types";

export const rideService = {
  // User
  createRide: (payload: CreateRidePayload) =>
    howl<ApiResponse<Ride>>("/ride", { method: "POST", body: payload }),

  getMyRides: (query?: GetRiderRidesQuery) => {
    const params = new URLSearchParams();
    if (query?.status) params.set("status", query.status);
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));
    const qs = params.toString();
    return howl<PagedResponse<Ride>>(`/ride/rider-rides${qs ? `?${qs}` : ""}`);
  },

  getRideById: (id: string) =>
    howl<ApiResponse<Ride>>(`/ride/${id}`),

  // Driver
  getDriverRides: (query?: GetDriverRidesQuery) => {
    const qs = query?.status ? `?status=${query.status}` : "";
    return howl<ApiResponse<Ride[]>>(`/ride/driver-rides${qs}`);
  },

  // Passenger
  getMyRideRequests: () =>
    howl<ApiResponse<Passenger[]>>("/passenger/ride-requests"),

  getRideRequestById: (id: string) =>
    howl<ApiResponse<{
      _id: string
      userId: {
        _id: string
        name: string
        profileImage: any
        phone: string
      }
      rideId: {
        _id: string
        pickup: {
          address: string
          coordinates: Array<number>
        }
        destination: {
          address: string
          coordinates: Array<number>
        }
        departureDate: string
        departureTime: string
        driverId: {
          _id: string
          name: string
          email: string
          profileImage: string
          phone: string
        }
      }
      pickup: {
        address: string
        coordinates: Array<number>
      }
      destination: {
        address: string
        coordinates: Array<number>
      }
      departureDate: string
      departureTime: string
      requestedSeats: number
      malePassengers: number
      femalePassengers: number
      fareType: string
      initialCharge: number
      perKmCharge: number
      totalKmCharge: number
      luggageCharge: number
      holidayTripCharge: number
      vat: number
      estimatedFare: number
      waitingCharge: number
      fivePassengerCharge: number
      sixPassengerCharge: number
      totalFare: number
      surchargePercent: number
      surchargeAmount: number
      paidAmount: number
      refundAmount: number
      paymentStatus: string
      refundedToWallet: boolean
      isNoShow: boolean
      estimatedDistanceKm: number
      estimatedDurationMinutes: number
      luggageCounts: number
      note: string
      status: string
      arrivedNotified: boolean
      waitingStartedAt: any
      waitingChargePaid: boolean
      createdAt: string
      updatedAt: string
      cancellationReason: string
      cancelledBy: string
      bookingId: string
      bookingShortId: string
    }>>(`/passenger/${id}`),

  getPassengersByRideId: (rideId: string) =>
    howl<ApiResponse<RidePassenger[]>>(`/passenger/ride/${rideId}`),

  // Admin
  getAllRides: (query?: GetAllRidesQuery) => {
    const params = new URLSearchParams();
    if (query?.status) params.set("status", query.status);
    if (query?.type) params.set("type", query.type);
    if (query?.departureDate) params.set("departureDate", query.departureDate);
    if (query?.departureTime) params.set("departureTime", query.departureTime);
    const qs = params.toString();
    return howl<ApiResponse<Paginator<Ride[]>>>(`/ride${qs ? `?${qs}` : ""}`);
  },
};
