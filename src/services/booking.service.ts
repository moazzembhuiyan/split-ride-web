import { howl } from "@/lib/api";
import type { ApiResponse, PagedResponse } from "@/types/base";
import type {
  AdminBooking,
  Booking,
  ChangeBookingStatusPayload,
  DriverBooking,
  GetAllBookingsQuery,
  GetMyBookingsQuery,
  RideDetail,
} from "@/types/booking.types";

export const bookingService = {
  getMyBookings: (query?: GetMyBookingsQuery) => {
    const params = new URLSearchParams();
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));
    const qs = params.toString();
    return howl<PagedResponse<Booking>>(`/bookings/my-bookings${qs ? `?${qs}` : ""}`);
  },

  getDriverBookings: (
    bookingStatus: string | undefined,
    page: number,
    limit: number,
  ) => {
    const params = new URLSearchParams();
    if (bookingStatus) params.set("bookingStatus", bookingStatus);
    params.set("page", String(page));
    params.set("limit", String(limit));
    return howl<PagedResponse<DriverBooking>>(
      `/bookings/my-bookings?${params.toString()}`,
    );
  },

  getCancellationQuote: (rideId: string) =>
    howl<ApiResponse<Record<string, unknown>>>(
      `/ride/${rideId}/cancellation-quote`,
    ),

  deleteRide: (bookingId: string) =>
    howl<ApiResponse<null>>(`/ride/${bookingId}`, { method: "DELETE" }),

  getBookingById: (id: string) =>
    howl<ApiResponse<{
      _id: string
      passengerId: {
        pickup: {
          address: string
          coordinates: Array<number>
        }
        destination: {
          address: string
          coordinates: Array<number>
        }
        _id: string
        departureDate: string
        departureTime: string
        fareType: string
        initialCharge: number
        perKmCharge: number
        totalKmCharge: number
        luggageCharge: number
        holidayTripCharge: number
        vat: number
        estimatedFare: number
        estimatedDistanceKm: number
        luggageCounts: number
      }
      rideId: {
        _id: string
        type: string
        vehicleId: {
          _id: string
          name: string
          number: string
          year: number
          seats: number
        }
      }
      userId: {
        _id: string
        name: string
        email: string
        profileImage: any
        phone: string
      }
      driverId: {
        _id: string
        name: string
        email: string
        profileImage: string
        phone: string
      }
      totalFare: number
      amountPaid: number
      bookingStatus: string
      paymentStatus: string
      id: string
      createdAt: string
      updatedAt: string
    }>>(`/bookings/${id}`),

  changeBookingStatus: (id: string, payload: ChangeBookingStatusPayload) =>
    howl<ApiResponse<Booking>>(`/bookings/status/${id}`, { method: "PATCH", body: payload }),

  getRideById: (id: string) =>
    howl<ApiResponse<RideDetail>>(`/ride/${id}`),

  // Admin
  getAllBookings: (query: GetAllBookingsQuery) => {
    const params = new URLSearchParams();
    params.set("status", query.status ?? "scheduled");
    params.set("page", String(query.page ?? 1));
    params.set("limit", String(query.limit ?? 10));
    if (query.type) params.set("type", query.type);
    if (query.departureDate) params.set("departureDate", query.departureDate);
    if (query.departureTime) params.set("departureTime", query.departureTime);
    return howl<PagedResponse<AdminBooking>>(`/ride?${params.toString()}`);
  },
};
