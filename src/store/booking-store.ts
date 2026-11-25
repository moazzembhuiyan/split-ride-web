import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  RideLocationPoint,
  RideRequestPayload,
  RideRequestResponse,
} from "@/types/ride.types";

type BookingStatus = "idle" | "waiting" | "accepted" | "cancelled";

export type BookingIntent = "find" | "start" | "private";

interface BookingState {
  request: Partial<RideRequestPayload>;
  response: RideRequestResponse | null;
  status: BookingStatus;
  bookingId: string | null;
  passengerId: string | null;
  paid: boolean;
  intent: BookingIntent | null;
  joinRideId: string | null;
  /** False while the pickup time is only the suggested default. */
  timeChosen: boolean;
  hasHydrated: boolean;
  setRequest: (data: Partial<RideRequestPayload>) => void;
  patchLocation: (
    field: "pickup" | "destination",
    patch: Partial<RideLocationPoint>,
  ) => void;
  setResponse: (data: RideRequestResponse) => void;
  setStatus: (s: BookingStatus) => void;
  setBookingId: (id: string | null) => void;
  setPassengerId: (id: string | null) => void;
  setPaid: (paid: boolean) => void;
  setIntent: (intent: BookingIntent | null) => void;
  setJoinRideId: (id: string | null) => void;
  setTimeChosen: (chosen: boolean) => void;
  setHasHydrated: (v: boolean) => void;
  resetInFlight: () => void;
  reset: () => void;
}

const emptyRuntime = {
  response: null as RideRequestResponse | null,
  status: "idle" as BookingStatus,
  bookingId: null as string | null,
  passengerId: null as string | null,
  paid: false,
};

const emptyDraft = {
  request: {} as Partial<RideRequestPayload>,
  intent: null as BookingIntent | null,
  joinRideId: null as string | null,
  timeChosen: false,
};

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      ...emptyDraft,
      ...emptyRuntime,
      hasHydrated: false,
      setRequest: (data) =>
        set((s) => ({ request: { ...s.request, ...data } })),
      patchLocation: (field, patch) =>
        set((s) => {
          const current = s.request[field];
          return {
            request: {
              ...s.request,
              [field]: {
                lat: patch.lat ?? current?.lat ?? 0,
                lng: patch.lng ?? current?.lng ?? 0,
                address: patch.address ?? current?.address ?? "",
              },
            },
          };
        }),
      setResponse: (data) => set({ response: data }),
      setStatus: (status) => set({ status }),
      setBookingId: (bookingId) => set({ bookingId }),
      setPassengerId: (passengerId) => set({ passengerId }),
      setPaid: (paid) => set({ paid }),
      setIntent: (intent) => set({ intent }),
      setJoinRideId: (joinRideId) => set({ joinRideId }),
      setTimeChosen: (timeChosen) => set({ timeChosen }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      resetInFlight: () => set(emptyRuntime),
      reset: () => set({ ...emptyDraft, ...emptyRuntime, hasHydrated: true }),
    }),
    {
      name: "booking-draft",
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: true,
      partialize: (s) =>
        s.paid
          ? emptyDraft
          : {
              request: s.request,
              intent: s.intent,
              joinRideId: s.joinRideId,
              timeChosen: s.timeChosen,
            },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export function useHydrateBookingStore() {
  useEffect(() => {
    void useBookingStore.persist.rehydrate();
  }, []);
  return useBookingStore((s) => s.hasHydrated);
}
