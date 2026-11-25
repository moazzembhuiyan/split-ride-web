"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { byNewest, fetchAllRows } from "@/lib/admin-list";
import { byRideDate, isCancelledRide } from "@/lib/admin-ride";
import { parseCancellationQuote } from "@/lib/cancel-ride";
import { bookingService } from "@/services/booking.service";
import type { BookingStatus, ChangeBookingStatusPayload, GetAllBookingsQuery } from "@/types/booking.types";
import { toast } from "sonner";

export function useDriverBookings(bookingStatus?: string) {
  return useQuery({
    queryKey: bookingKeys.driver(bookingStatus),
    queryFn: async () => ({
      data: await fetchAllRows((page, limit) =>
        bookingService.getDriverBookings(bookingStatus, page, limit),
      ),
    }),
  });
}

export const bookingKeys = {
  my: (query?: { page?: number; limit?: number }) => ["booking", "my", query] as const,
  detail: (id: string) => ["booking", id] as const,
  all: ["booking", "all"] as const,
  driver: (status?: string) => ["booking", "driver", status] as const,
};

export function useMyBookings(query?: { page?: number; limit?: number; enabled?: boolean }) {
  const enabled = query?.enabled ?? true;
  return useQuery({
    queryKey: bookingKeys.my(query ? { page: query.page, limit: query.limit } : undefined),
    queryFn: () => bookingService.getMyBookings(query ? { page: query.page, limit: query.limit } : undefined),
    enabled,
  });
}

/** Every booking of the rider, newest first. */
export function useAllMyBookings(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["booking", "my", "all-rows"] as const,
    queryFn: async () =>
      (
        await fetchAllRows((page, limit) =>
          bookingService.getMyBookings({ page, limit }),
        )
      ).sort(byNewest),
    enabled: options?.enabled ?? true,
  });
}

/** Live cancellation terms of a ride. Not offered by every API build. */
export function useCancellationQuote(
  rideId: string,
  options: { enabled: boolean },
) {
  return useQuery({
    queryKey: ["cancellation-quote", rideId] as const,
    queryFn: async () => {
      const res = await bookingService.getCancellationQuote(rideId);
      return parseCancellationQuote(res.data);
    },
    enabled: options.enabled && !!rideId,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
}

export function useBookingById(id: string) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () => bookingService.getBookingById(id),
    enabled: !!id,
  });
}

export function useChangeBookingStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ChangeBookingStatusPayload) => bookingService.changeBookingStatus(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.my() });
      qc.invalidateQueries({ queryKey: bookingKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ["booking", "driver"] });
      qc.invalidateQueries({ queryKey: ["driver-rides"] });
    },
    onError: (error) => {
      toast.error(error?.message || "Something went wrong")
    },
  });
}

/** Every ride matching the filters, latest ride date first. */
export function useAllBookings(
  query: Omit<GetAllBookingsQuery, "page" | "limit"> = {},
) {
  return useQuery({
    queryKey: [...bookingKeys.all, query],
    queryFn: async () => {
      const rides = await fetchAllRows((page, limit) =>
        bookingService.getAllBookings({ ...query, page, limit }),
      );
      return rides
        .filter((ride) => query.status !== "cancelled" || isCancelledRide(ride))
        .sort(byRideDate);
    },
  });
}

export function useRideById(id: string | null) {
  return useQuery({
    queryKey: ["ride", id],
    queryFn: () => bookingService.getRideById(id as string),
    enabled: !!id,
  });
}
