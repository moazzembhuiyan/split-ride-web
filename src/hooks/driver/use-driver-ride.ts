"use client";

import { useQuery } from "@tanstack/react-query";
import { rideService } from "@/services/ride.service";
import type { RideStatus } from "@/types/ride.types";

export const driverRideKeys = {
  list: (status?: RideStatus) => ["driver-rides", status] as const,
  detail: (id: string) => ["driver-rides", id] as const,
  passengersByRide: (rideId: string) => ["driver-rides", "passengers", rideId] as const,
};

export function useDriverRides(status?: RideStatus) {
  return useQuery({
    queryKey: driverRideKeys.list(status),
    queryFn: () => rideService.getDriverRides({ status }),
  });
}

export function useDriverRideById(id: string) {
  return useQuery({
    queryKey: driverRideKeys.detail(id),
    queryFn: () => rideService.getRideById(id),
    enabled: !!id,
  });
}

export function usePassengersByRide(rideId: string) {
  return useQuery({
    queryKey: driverRideKeys.passengersByRide(rideId),
    queryFn: () => rideService.getPassengersByRideId(rideId),
    enabled: !!rideId,
  });
}
