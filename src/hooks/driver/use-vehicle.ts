"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userKeys } from "@/hooks/shared/use-user";
import { vehicleService } from "@/services/driver.service";
import type {
  CreateMultipleVehiclesPayload,
  CreateVehiclePayload,
  UpdateVehiclePayload,
} from "@/types/driver.types";

export const vehicleKeys = {
  my: ["vehicles", "my"] as const,
};

export function useMyVehicles() {
  return useQuery({
    queryKey: vehicleKeys.my,
    queryFn: () => vehicleService.getMyVehicles(),
  });
}

export function useAddVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVehiclePayload) => vehicleService.addVehicle(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: vehicleKeys.my });
      qc.invalidateQueries({ queryKey: userKeys.me });
    },
  });
}

export function useAddMultipleVehicles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMultipleVehiclesPayload) => vehicleService.addMultipleVehicles(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: vehicleKeys.my }),
  });
}

export function useUpdateVehicle(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateVehiclePayload) => vehicleService.updateVehicle(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: vehicleKeys.my }),
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehicleService.deleteVehicle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: vehicleKeys.my }),
  });
}
