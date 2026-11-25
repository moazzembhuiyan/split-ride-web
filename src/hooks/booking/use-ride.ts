"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rideService } from "@/services/ride.service";
import type { CreateRidePayload, GetAllRidesQuery, GetRiderRidesQuery } from "@/types/ride.types";

export const rideKeys = {
  my: (query?: GetRiderRidesQuery) => ["ride", "my", query] as const,
  all: (query?: GetAllRidesQuery) => ["ride", "all", query] as const,
  detail: (id: string) => ["ride", id] as const,
  requests: ["ride", "requests"] as const,
  requestDetail: (id: string) => ["ride", "request", id] as const,
  passengersByRide: (rideId: string) => ["ride", "passengers", rideId] as const,
};

export function useCreateRide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRidePayload) => rideService.createRide(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ride", "my"] }),
  });
}

export function useMyRides(query?: GetRiderRidesQuery & { enabled?: boolean }) {
  const { enabled, ...rest } = query ?? {};
  return useQuery({
    queryKey: rideKeys.my(rest),
    queryFn: () => rideService.getMyRides(rest),
    enabled: enabled ?? true,
  });
}

export function useAllRides(query?: GetAllRidesQuery) {
  return useQuery({
    queryKey: rideKeys.all(query),
    queryFn: () => rideService.getAllRides(query),
  });
}

export function useRideById(id: string) {
  return useQuery({
    queryKey: rideKeys.detail(id),
    queryFn: () => rideService.getRideById(id),
    enabled: !!id,
  });
}

export function useMyRideRequests() {
  return useQuery({
    queryKey: rideKeys.requests,
    queryFn: () => rideService.getMyRideRequests(),
  });
}

export function useRideRequestById(id: string) {
  return useQuery({
    queryKey: rideKeys.requestDetail(id),
    queryFn: () => rideService.getRideRequestById(id),
    enabled: !!id,
  });
}

export function usePassengersByRide(rideId: string, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: rideKeys.passengersByRide(rideId),
    queryFn: () => rideService.getPassengersByRideId(rideId),
    enabled: !!rideId,
    refetchInterval: options?.refetchInterval,
  });
}
