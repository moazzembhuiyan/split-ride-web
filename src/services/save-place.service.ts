import { howl } from "@/lib/api";
import type { ApiResponse } from "@/types/base";
import type {
  CreateSavedPlacePayload,
  SavedPlace,
  UpdateSavedPlacePayload,
} from "@/types/save-place.types";

export const savePlaceService = {
  getSavedPlaces: () =>
    howl<ApiResponse<SavedPlace[]>>("/save-places"),

  createSavedPlace: (payload: CreateSavedPlacePayload) =>
    howl<ApiResponse<SavedPlace>>("/save-places", { method: "POST", body: payload }),

  updateSavedPlace: (id: string, payload: UpdateSavedPlacePayload) =>
    howl<ApiResponse<SavedPlace>>(`/save-places/${id}`, { method: "PUT", body: payload }),

  pinSavedPlace: (id: string) =>
    howl<ApiResponse<SavedPlace>>(`/save-places/pinned/${id}`, { method: "PATCH" }),

  deleteSavedPlace: (id: string) =>
    howl<ApiResponse<null>>(`/save-places/${id}`, { method: "DELETE" }),
};
