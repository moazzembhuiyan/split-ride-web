import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { NewRideRequest } from "@/types/ride.types";

export type DriverLocation = { lat: number; lng: number; heading: number | null };

/** A ride is offered once, however many riders it has. */
export function requestRideId(req: NewRideRequest): string {
  return req.rideId?._id || req._id;
}

/** Merges the entries of riders who share a ride into one request. */
export function groupRequestsByRide(list: NewRideRequest[]): NewRideRequest[] {
  const rides = new Map<string, Map<string, NewRideRequest>>();
  for (const req of list) {
    const rideId = requestRideId(req);
    const riders = rides.get(rideId) ?? new Map<string, NewRideRequest>();
    riders.set(req._id, req);
    rides.set(rideId, riders);
  }

  return [...rides.values()].map((riders) => {
    const entries = [...riders.values()];
    // Entries come in any order; the latest rider dates the request.
    const createdAt = entries.reduce(
      (latest, r) => (r.createdAt > latest ? r.createdAt : latest),
      "",
    );
    // The server already sent ride totals.
    const total = entries.find((r) => (r.riderCount ?? 1) > 1);
    if (total || entries.length === 1) {
      return { ...(total ?? entries[0]), createdAt };
    }
    return {
      ...entries[0],
      createdAt,
      riderCount: entries.length,
      requestedSeats: entries.reduce((n, r) => n + (r.requestedSeats ?? 0), 0),
      estimatedFare: entries.reduce((n, r) => n + (r.estimatedFare ?? 0), 0),
    };
  });
}

interface DriverState {
  location: DriverLocation | null;
  encodedRoute: string;
  /** Confirmed by the server. */
  isOnline: boolean;
  /** The driver's own choice in this session; null follows the server. */
  wantsOnline: boolean | null;
  /** Socket connection on which the online state was last sent. */
  announcedOn: string | null;
  requests: NewRideRequest[];
  declinedRideIds: string[];
  acceptingRideId: string | null;
  setLocation: (loc: DriverLocation) => void;
  setEncodedRoute: (route: string) => void;
  setIsOnline: (v: boolean) => void;
  setWantsOnline: (v: boolean) => void;
  setAnnouncedOn: (connection: string | null) => void;
  addRequest: (req: NewRideRequest) => void;
  setRequests: (reqs: NewRideRequest[]) => void;
  patchRequest: (
    rideId: string,
    patch: Partial<
      Pick<NewRideRequest, "requestedSeats" | "estimatedFare" | "riderCount">
    >,
  ) => void;
  removeRequest: (id: string) => void;
  removeRequestsByRideId: (rideId: string) => void;
  declineRide: (rideId: string) => void;
  setAcceptingRideId: (id: string | null) => void;
}

function belongsTo(req: NewRideRequest, rideId: string): boolean {
  return (
    req.rideId?._id === rideId ||
    req.rideId?.id === rideId ||
    req._id === rideId
  );
}

export const useDriverStore = create<DriverState>()(
  persist(
    (set) => ({
      location: null,
      encodedRoute: "",
      isOnline: false,
      wantsOnline: null,
      announcedOn: null,
      requests: [],
      declinedRideIds: [],
      acceptingRideId: null,
      setLocation: (loc) => set({ location: loc }),
      setEncodedRoute: (route) => set({ encodedRoute: route }),
      setIsOnline: (v) => set({ isOnline: v }),
      setWantsOnline: (v) => set({ wantsOnline: v }),
      setAnnouncedOn: (connection) => set({ announcedOn: connection }),
      addRequest: (req) =>
        set((s) => {
          const rideId = requestRideId(req);
          if (s.declinedRideIds.includes(rideId)) return s;
          const known = s.requests.some((r) => requestRideId(r) === rideId);
          return {
            requests: known
              ? s.requests.map((r) => (requestRideId(r) === rideId ? req : r))
              : [req, ...s.requests],
          };
        }),
      setRequests: (reqs) =>
        set((s) => ({
          requests: groupRequestsByRide(reqs).filter(
            (r) => !s.declinedRideIds.includes(requestRideId(r)),
          ),
        })),
      patchRequest: (rideId, patch) =>
        set((s) => ({
          requests: s.requests.map((r) =>
            belongsTo(r, rideId) ? { ...r, ...patch } : r,
          ),
        })),
      removeRequest: (id) =>
        set((s) => ({ requests: s.requests.filter((r) => r._id !== id) })),
      removeRequestsByRideId: (rideId) =>
        set((s) => ({
          requests: s.requests.filter((r) => !belongsTo(r, rideId)),
          acceptingRideId:
            s.acceptingRideId === rideId ? null : s.acceptingRideId,
        })),
      declineRide: (rideId) =>
        set((s) => ({
          requests: s.requests.filter((r) => !belongsTo(r, rideId)),
          declinedRideIds: [...s.declinedRideIds, rideId],
        })),
      setAcceptingRideId: (id) => set({ acceptingRideId: id }),
    }),
    {
      name: "driver-store",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({
        requests: s.requests,
        declinedRideIds: s.declinedRideIds,
        wantsOnline: s.wantsOnline,
      }),
    },
  ),
);
