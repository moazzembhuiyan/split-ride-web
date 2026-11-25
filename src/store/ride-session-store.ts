import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface RideSessionState {
  activeRideId: string | null;
  /** The rider's own place on the ride being tracked. */
  tracked: { rideId: string; passengerId: string; alone: boolean } | null;
  setActiveRideId: (rideId: string | null) => void;
  setTracked: (tracked: RideSessionState["tracked"]) => void;
}

export const useRideSessionStore = create<RideSessionState>()(
  persist(
    (set) => ({
      activeRideId: null,
      tracked: null,
      setActiveRideId: (rideId) => set({ activeRideId: rideId }),
      setTracked: (tracked) => set({ tracked }),
    }),
    {
      name: "ride-session-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ activeRideId: s.activeRideId }),
    },
  ),
);
