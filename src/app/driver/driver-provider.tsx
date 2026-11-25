"use client";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { useMyVehicles } from "@/hooks/driver/use-vehicle";
import { useMe } from "@/hooks/shared/use-user";
import { useSocket } from "@/hooks/shared/use-socket";
import { requestOnline } from "@/lib/driver-online";
import {
  normalizeNewRideRequest,
  parseRequestUpdate,
  parseRideRequestList,
} from "@/lib/normalize-ride-request";
import { rideService } from "@/services/ride.service";
import { useDriverStore, type DriverLocation } from "@/store/driver-store";
import type { NewRideRequest } from "@/types/ride.types";

const MIN_UPDATE_METERS = 1;

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function DriverProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { socket } = useSocket();
  const { data: meData } = useMe();
  const { data: vehiclesData } = useMyVehicles();
  const setLocation = useDriverStore((s) => s.setLocation);
  const setIsOnline = useDriverStore((s) => s.setIsOnline);
  const addRequest = useDriverStore((s) => s.addRequest);
  const setRequests = useDriverStore((s) => s.setRequests);
  const patchRequest = useDriverStore((s) => s.patchRequest);
  const removeRequestsByRideId = useDriverStore((s) => s.removeRequestsByRideId);
  const setAcceptingRideId = useDriverStore((s) => s.setAcceptingRideId);

  const locationRef = useRef<DriverLocation | null>(null);
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);

  const meDataRef = useRef(meData);
  const vehiclesDataRef = useRef(vehiclesData);
  meDataRef.current = meData;
  vehiclesDataRef.current = vehiclesData;

  // Restores the online state once per socket connection (reload, reconnect).
  const announceOnline = useCallback(async () => {
    const vehicleId = vehiclesDataRef.current?.data?.[0]?._id;
    const loc = locationRef.current;
    const { wantsOnline, announcedOn, setAnnouncedOn } =
      useDriverStore.getState();
    const shouldBeOnline =
      wantsOnline ?? meDataRef.current?.data?.isOnline === true;
    const connection = socket.connected ? socket.id : undefined;
    if (!shouldBeOnline || !vehicleId || !loc || !connection) return;
    if (announcedOn === connection) return;
    setAnnouncedOn(connection);

    const result = await requestOnline(socket, {
      online: true,
      lat: loc.lat,
      lng: loc.lng,
      vehicleId,
    });
    // The driver may have switched off while waiting for the answer.
    if (useDriverStore.getState().wantsOnline === false) return;
    setIsOnline(result.ok);
  }, [socket, setIsOnline]);

  useEffect(() => {
    void announceOnline();
  }, [meData, vehiclesData, announceOnline]);

  useEffect(() => {
    const onConnect = () => void announceOnline();
    socket.on("connect", onConnect);
    if (socket.connected) void announceOnline();
    return () => {
      socket.off("connect", onConnect);
    };
  }, [socket, announceOnline]);

  useEffect(() => {
    const onStatus = (data: { isOnline: boolean }) => {
      if (typeof data?.isOnline === "boolean") setIsOnline(data.isOnline);
    };
    socket.on("driver:status-changed", onStatus);
    return () => {
      socket.off("driver:status-changed", onStatus);
    };
  }, [socket, setIsOnline]);

  // GPS: getCurrentPosition for immediate first fix, then watchPosition.
  // Positions are shared with the server only while it has the driver online.
  useEffect(() => {
    if (!navigator.geolocation) return;

    function handlePosition(pos: GeolocationPosition) {
      const { latitude: lat, longitude: lng, heading } = pos.coords;
      const loc: DriverLocation = { lat, lng, heading };
      locationRef.current = loc;
      setLocation(loc);
      void announceOnline();

      if (!useDriverStore.getState().isOnline || !socket.connected) return;
      if (lastPositionRef.current) {
        const d = haversineMeters(
          lastPositionRef.current.lat,
          lastPositionRef.current.lng,
          lat,
          lng,
        );
        if (d < MIN_UPDATE_METERS) return;
      }
      lastPositionRef.current = { lat, lng };
      socket.emit("driver:location-update", {
        lat,
        lng,
        encodedRoute: useDriverStore.getState().encodedRoute || undefined,
      });
    }

    function readPosition() {
      navigator.geolocation.getCurrentPosition(handlePosition, undefined, {
        enableHighAccuracy: false,
        maximumAge: 30000,
      });
    }

    // Browsers slow down background tabs: catch up as soon as it is visible.
    function onVisible() {
      if (document.visibilityState === "visible") readPosition();
    }

    readPosition();
    document.addEventListener("visibilitychange", onVisible);
    const watchId = navigator.geolocation.watchPosition(
      handlePosition,
      undefined,
      { enableHighAccuracy: true, maximumAge: 0 },
    );

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      navigator.geolocation.clearWatch(watchId);
    };
  }, [socket, setLocation, announceOnline]);

  const fetchRideRequests = useCallback(async () => {
    try {
      const res = await rideService.getMyRideRequests();
      setRequests(parseRideRequestList(res));
    } catch {
      // Keep the socket inbox if REST is down.
    }
  }, [setRequests]);

  // Also when the driver comes back to the home page after a ride.
  useEffect(() => {
    if (pathname === "/driver") setAcceptingRideId(null);
    void fetchRideRequests();
  }, [pathname, fetchRideRequests, setAcceptingRideId]);

  useEffect(() => {
    function handleNewRequest(raw: NewRideRequest) {
      const req = normalizeNewRideRequest(raw);
      if (!req?._id) return;
      addRequest(req);
      window.setTimeout(() => {
        void fetchRideRequests();
      }, 10000);
    }
    function handleUpdated(raw: unknown) {
      const update = parseRequestUpdate(raw);
      if (update) patchRequest(update.rideId, update.patch);
      void fetchRideRequests();
    }
    function handleAccepted(data: { rideId: string }) {
      if (data?.rideId) removeRequestsByRideId(data.rideId);
    }
    // One rider leaving does not withdraw the ride of the others.
    function handleCancelled() {
      void fetchRideRequests();
    }
    function handleAlreadyTaken(data: { rideId: string }) {
      if (data?.rideId) removeRequestsByRideId(data.rideId);
      void fetchRideRequests();
    }
    function handleNotification() {
      void fetchRideRequests();
    }
    socket.on("ride:new-request", handleNewRequest);
    socket.on("ride:request-updated", handleUpdated);
    socket.on("ride:accepted", handleAccepted);
    socket.on("ride:cancelled-by-rider", handleCancelled);
    socket.on("ride:already-taken", handleAlreadyTaken);
    socket.on("notification:new", handleNotification);
    socket.on("connect", handleNotification);
    return () => {
      socket.off("ride:new-request", handleNewRequest);
      socket.off("ride:request-updated", handleUpdated);
      socket.off("ride:accepted", handleAccepted);
      socket.off("ride:cancelled-by-rider", handleCancelled);
      socket.off("ride:already-taken", handleAlreadyTaken);
      socket.off("notification:new", handleNotification);
      socket.off("connect", handleNotification);
    };
  }, [
    socket,
    addRequest,
    patchRequest,
    removeRequestsByRideId,
    fetchRideRequests,
  ]);

  return <>{children}</>;
}
