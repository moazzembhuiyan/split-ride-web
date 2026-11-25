"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { savePlaceService } from "@/services/save-place.service";
import type { CreateSavedPlacePayload, UpdateSavedPlacePayload } from "@/types/save-place.types";

export const savePlaceKeys = {
  my: ["save-places", "my"] as const,
};

export function useSavedPlaces() {
  return useQuery({
    queryKey: savePlaceKeys.my,
    queryFn: () => savePlaceService.getSavedPlaces(),
  });
}

export function useCreateSavedPlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSavedPlacePayload) => savePlaceService.createSavedPlace(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: savePlaceKeys.my }),
  });
}

export function useUpdateSavedPlace(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateSavedPlacePayload) => savePlaceService.updateSavedPlace(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: savePlaceKeys.my }),
  });
}

export function usePinSavedPlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => savePlaceService.pinSavedPlace(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: savePlaceKeys.my }),
  });
}

export function useDeleteSavedPlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => savePlaceService.deleteSavedPlace(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: savePlaceKeys.my }),
  });
}
