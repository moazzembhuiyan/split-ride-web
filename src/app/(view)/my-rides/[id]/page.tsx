"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  CallingIcon,
  Location01Icon,
  MailIcon,
  Navigation03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LiveMarker } from "@/components/core/live-marker";
import {
  Map as RideMap,
  MapMarker,
  MapRoute,
  MarkerContent,
  MarkerLabel,
} from "@/components/ui/map";
import { useRideRequestById, usePassengersByRide } from "@/hooks/booking/use-ride";
import { useSocket, useSocketEvent } from "@/hooks/shared/use-socket";
import { useMe } from "@/hooks/shared/use-user";
import { useGeneralSettings } from "@/hooks/shared/use-settings";
import { settingsMap } from "@/lib/general-settings";
import { decodePolyline } from "@/lib/polyline";
import { useT } from "@/i18n";
import { refreshRideLists } from "@/lib/refresh-rides";
import {
  furthest,
  hasReached,
  isActivePassenger,
  isEventForPassenger,
  passengerStage,
  type RideStage,
} from "@/lib/ride-progress";
import { departureLabel } from "@/lib/ride-time";
import { emitAck } from "@/lib/socket-ack";
import {
  partiesFromPassengers,
  settleSplitRide,
  unwrapPassengers,
} from "@/lib/split-settlement";
import { SplitSettlementCard } from "@/components/booking/split-share-card";
import { useRideSessionStore } from "@/store/ride-session-store";
import type { StartOtpPayload } from "@/types/socket.types";
import Chat from "./chat";
import DriverProfile from "./driver-profile";
import RatingDialog from "./rating-dialog";
import { AskCodeButton, StartCodeCard } from "./start-code-card";

interface RouteData {
  coordinates: [number, number][];
  duration: number;
  distance: number;
}

interface DriverPosition {
  lat: number;
  lng: number;
  heading?: number;
}

interface MyPosition {
  lat: number;
  lng: number;
}

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const t = useT();
  const queryClient = useQueryClient();
  const [stage, setStage] = useState<RideStage>("waiting");
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [driverPosition, setDriverPosition] = useState<DriverPosition | null>(
    null,
  );
  const [myPosition, setMyPosition] = useState<MyPosition | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [liveRoute, setLiveRoute] = useState<[number, number][] | null>(null);
  const [startCode, setStartCode] = useState<{
    otp: string;
    expiresAt: number | null;
  } | null>(null);
  const [codeVerified, setCodeVerified] = useState(false);
  const [askingCode, setAskingCode] = useState(false);
  const askBusy = useRef(false);
  const { data: rideData, isPending } = useRideRequestById(String(params.id));
  const { data: meData } = useMe();
  const me = meData?.data;
  const { emit, socket } = useSocket();
  const setActiveRideId = useRideSessionStore((s) => s.setActiveRideId);
  const setTracked = useRideSessionStore((s) => s.setTracked);

  const passenger = rideData?.data;
  const ride = passenger?.rideId;
  const driver = ride?.driverId;
  const rideId = ride?._id;
  const { data: settingsData } = useGeneralSettings();
  const generals = settingsMap(settingsData?.data);
  const { data: passengersResp } = usePassengersByRide(rideId ?? "", {
    refetchInterval: rideId ? 15000 : undefined,
  });
  const parties = partiesFromPassengers(
    unwrapPassengers(passengersResp?.data),
  );
  const isSplit =
    (passenger?.fareType ?? "").toLowerCase().includes("split") ||
    (ride as { type?: string } | undefined)?.type === "split" ||
    parties.length > 1;
  const settlement = isSplit
    ? settleSplitRide(parties, generals)
    : null;

  const riders = unwrapPassengers(passengersResp?.data).filter((p) =>
    isActivePassenger(p as { status?: string }),
  );
  const alone = isSplit ? riders.length <= 1 && !!passengersResp : true;
  const mine = { passengerId: passenger?._id, userId: me?._id, alone };

  // A late refresh can only move the status forward.
  useEffect(() => {
    if (passenger) setStage((s) => furthest(s, passengerStage(passenger)));
  }, [passenger]);

  // Lets the global notifications tell my pickup from another rider's.
  useEffect(() => {
    if (!rideId || !passenger?._id) return;
    setTracked({ rideId, passengerId: passenger._id, alone });
    return () => setTracked(null);
  }, [rideId, passenger?._id, alone, setTracked]);

  function advance(
    event: { rideId?: string; passengerId?: string; userId?: string },
    target: RideStage,
    wholeRide = false,
  ) {
    if (event?.rideId && event.rideId !== rideId) return;
    if (wholeRide || isEventForPassenger(event, mine)) {
      setStage((s) => furthest(s, target));
    }
  }

  function leave(event: { rideId?: string; passengerId?: string }) {
    if (event?.rideId && event.rideId !== rideId) return;
    if (event?.passengerId && event.passengerId !== passenger?._id) return;
    setActiveRideId(null);
    refreshRideLists(queryClient);
    router.replace("/my-rides");
  }

  /** The same code arrives as ride:start-otp, passenger:start-otp and in the answer to a request. */
  function showStartCode(data: Partial<StartOtpPayload> | undefined) {
    if (!data || (data.rideId && data.rideId !== rideId)) return;
    if (!isEventForPassenger(data, mine)) return;
    // A used code is not shown again by a late event or answer.
    if (codeVerified) return;
    const otp = String(data.otp ?? "");
    if (!/^\d{6}$/.test(otp)) return;
    const seconds = Number(data.expiresInSeconds);
    const hasExpiry =
      data.expiresInSeconds != null && Number.isFinite(seconds);
    // A code with no time left is not shown.
    if (hasExpiry && seconds <= 0) return;
    setStartCode({
      otp,
      expiresAt: hasExpiry ? Date.now() + seconds * 1000 : null,
    });
  }

  async function askStartCode() {
    if (!rideId || !passenger?._id || askBusy.current) return;
    askBusy.current = true;
    setAskingCode(true);
    const result = await emitAck(
      socket,
      "passenger:send-start-otp",
      { rideId, passengerId: passenger._id },
      { timeoutMs: 10000 },
    );
    askBusy.current = false;
    setAskingCode(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    // The answer may carry the code; otherwise the event does.
    const data = result.data as Partial<StartOtpPayload> | undefined;
    showStartCode({ rideId, passengerId: passenger._id, ...data });
  }

  // The code is only valid for a short time.
  useEffect(() => {
    if (!startCode?.expiresAt) return;
    const wait = startCode.expiresAt - Date.now();
    if (wait <= 0) {
      setStartCode(null);
      return;
    }
    const timer = setTimeout(() => setStartCode(null), wait);
    return () => clearTimeout(timer);
  }, [startCode]);

  const pickedUp = hasReached(stage, "pickedUp");
  const visibleCode = startCode && !pickedUp && !codeVerified ? startCode : null;
  const canAskCode =
    hasReached(stage, "arrived") && !pickedUp && !codeVerified && !visibleCode;

  const start = {
    lat: passenger?.pickup.coordinates[1] ?? 0,
    lng: passenger?.pickup.coordinates[0] ?? 0,
  };
  const end = {
    lat: passenger?.destination.coordinates[1] ?? 0,
    lng: passenger?.destination.coordinates[0] ?? 0,
  };

  // Join ride room to receive live updates, and persist the active ride so a
  // reconnect on ANY page (reload, network drop) can rejoin automatically —
  // see the "connect" handler in SocketProvider.
  useEffect(() => {
    if (!rideId) return;
    setActiveRideId(rideId);
    emit("room:join", rideId);
    return () => {
      emit("room:leave", rideId);
    };
  }, [rideId, emit, setActiveRideId]);

  // Listen for driver location updates — broadcast payload carries driverId, not rideId
  useSocketEvent("ride:live-update", (data) => {
    if (!driver?._id || data.driverId === driver._id) {
      setDriverPosition({
        lat: data.lat,
        lng: data.lng,
        heading: data.heading,
      });
    }
    if (data.encodedRoute) {
      const decoded = decodePolyline(data.encodedRoute);
      if (decoded.length > 1) setLiveRoute(decoded);
    }
  });

  useSocketEvent("ride:driver-en-route", (d) => advance(d, "enRoute", true));
  useSocketEvent("ride:trip-started", (d) => advance(d, "enRoute", true));
  useSocketEvent("ride:driver-arrived", (d) => advance(d, "arrived"));
  useSocketEvent("ride:passenger-picked-up", (d) => advance(d, "pickedUp"));
  useSocketEvent("ride:passenger-picked", (d) => advance(d, "pickedUp"));
  useSocketEvent("ride:all-passengers-picked", (d) =>
    advance(d, "pickedUp", true),
  );
  useSocketEvent("ride:passenger-dropped-off", (d) => advance(d, "droppedOff"));
  useSocketEvent("ride:cancelled-by-driver", leave);
  useSocketEvent("ride:cancelled", leave);
  useSocketEvent("ride:start-otp", showStartCode);
  useSocketEvent("passenger:start-otp", showStartCode);
  useSocketEvent("ride:start-otp-verified", (d) => {
    if (d?.rideId && d.rideId !== rideId) return;
    if (!isEventForPassenger(d, mine) || d?.isStartOtpVerified === false) {
      return;
    }
    setStartCode(null);
    setCodeVerified(true);
  });
  useSocketEvent("ride:waiting-charge", (data) => {
    if (data.amount != null) {
      toast.message(`Waiting charge: €${Number(data.amount).toFixed(2)}`);
    }
  });
  useSocketEvent("ride:request-rating", () => {
    setShowRating(true);
    setActiveRideId(null);
  });
  useSocketEvent("ride:trip-completed", (d) => {
    advance(d, "completed", true);
    setShowRating(true);
    setActiveRideId(null);
  });

  // Watch passenger's own GPS position
  useEffect(() => {
    if (!navigator.geolocation) return;
    let lastLat = 0;
    let lastLng = 0;
    const MIN_DELTA = 0.00005; // ~5 m — skip tiny jitter updates

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (
          Math.abs(latitude - lastLat) > MIN_DELTA ||
          Math.abs(longitude - lastLng) > MIN_DELTA
        ) {
          lastLat = latitude;
          lastLng = longitude;
          setMyPosition({ lat: latitude, lng: longitude });
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  async function fetchRoutes() {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&alternatives=true`,
      );
      const data = await response.json();
      if (data.routes?.length > 0) {
        const routeData: RouteData[] = data.routes.map(
          (route: {
            geometry: { coordinates: [number, number][] };
            duration: number;
            distance: number;
          }) => ({
            coordinates: route.geometry.coordinates,
            duration: route.duration,
            distance: route.distance,
          }),
        );
        setRoutes(routeData);
      }
    } catch (error) {
      console.error("Failed to fetch routes:", error);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetch on data load
  useEffect(() => {
    if (rideData) {
      fetchRoutes();
    }
  }, [isPending]);

  const sortedRoutes = routes
    .map((route, index) => ({ route, index }))
    .sort((a, b) => {
      if (a.index === selectedIndex) return 1;
      if (b.index === selectedIndex) return -1;
      return 0;
    });

  const driverInitials = driver?.name
    ? driver.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "DR";

  if (isPending) {
    return (
      <main className="flex-1 h-full w-full z-20 bg-purple-300 flex justify-center items-center">
        <div className="text-lg font-semibold text-primary animate-pulse">
          Loading...
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 h-full min-h-[calc(100dvh-64px)] w-full z-20 bg-purple-300">
      <RideMap center={[start.lng, start.lat]} theme={"light"} zoom={13.5}>
        {sortedRoutes.map(({ route, index }) => {
          if (liveRoute && liveRoute.length > 1) return null;
          const isSelected = index === selectedIndex;
          return (
            <MapRoute
              key={index}
              coordinates={route.coordinates}
              color={isSelected ? "#6366f1" : "#94a3b8"}
              width={isSelected ? 6 : 5}
              opacity={isSelected ? 1 : 0.6}
              onClick={() => setSelectedIndex(index)}
            />
          );
        })}
        {liveRoute && liveRoute.length > 1 && (
          <MapRoute
            coordinates={liveRoute}
            color="#6366f1"
            width={6}
            opacity={1}
          />
        )}

        <MapMarker longitude={start.lng} latitude={start.lat}>
          <MarkerContent>
            <div className="size-5 rounded-full bg-green-500 border-2 border-white shadow-lg" />
            <MarkerLabel position="top">Pickup</MarkerLabel>
          </MarkerContent>
        </MapMarker>

        <MapMarker longitude={end.lng} latitude={end.lat}>
          <MarkerContent>
            <div className="size-5 rounded-full bg-red-500 border-2 border-white shadow-lg" />
            <MarkerLabel position="bottom">Destination</MarkerLabel>
          </MarkerContent>
        </MapMarker>

        {driverPosition &&
          !hasReached(stage, "droppedOff") &&
          passenger?.status !== "completed" &&
          passenger?.status !== "cancelled" && (
          <MapMarker
            longitude={driverPosition.lng}
            latitude={driverPosition.lat}
          >
            <MarkerContent>
              <LiveMarker src={driver?.profileImage} />
              <MarkerLabel position="top">Driver</MarkerLabel>
            </MarkerContent>
          </MapMarker>
        )}

        {myPosition && (
          <MapMarker longitude={myPosition.lng} latitude={myPosition.lat}>
            <MarkerContent>
              <div className="p-0.5 bg-linear-to-r from-blue-400/80 to-cyan-500/80 rounded-full shadow-lg">
                <Avatar className="size-8 bg-background rounded-full">
                  <AvatarImage src={me?.profileImage ?? "/user.png"} />
                  <AvatarFallback className="text-[10px]">
                    {me?.name
                      ? me.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : "ME"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <MarkerLabel position="bottom">You</MarkerLabel>
            </MarkerContent>
          </MapMarker>
        )}
      </RideMap>

      <Card className="fixed z-20 bottom-2 inset-x-2 max-h-[45dvh] overflow-y-auto lg:max-h-none lg:inset-x-auto lg:bottom-12 lg:start-12 lg:w-[70dvw] bg-white shadow-xl border-0 ring-0">
        <CardContent className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
          {/* Left: departure info + driver contact */}
          <div className="h-full flex flex-col justify-between items-stretch">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                Departure at{" "}
                <span className="font-semibold text-primary">
                  {departureLabel(passenger).time}
                </span>
              </h2>
              <p className="text-sm text-muted-foreground">
                {departureLabel(passenger).date}
              </p>
              {stage !== "waiting" && (
                <Badge className="mt-2" aria-live="polite">
                  {t(`ride.stage.${stage}`)}
                </Badge>
              )}
              {visibleCode && (
                <StartCodeCard
                  otp={visibleCode.otp}
                  expiresAt={visibleCode.expiresAt}
                />
              )}
              {codeVerified && !pickedUp && (
                <p className="mt-2 text-sm text-green-700" aria-live="polite">
                  {t("ride.otp.verified")}
                </p>
              )}
              {canAskCode && (
                <AskCodeButton asking={askingCode} onAsk={askStartCode} />
              )}
            </div>
            {driver && (
              <div className="p-4 bg-secondary mt-auto rounded-lg space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <HugeiconsIcon
                    className="text-primary size-5"
                    icon={MailIcon}
                  />
                  {driver.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <HugeiconsIcon
                    className="text-primary size-5"
                    icon={CallingIcon}
                  />
                  <a href={`tel:${driver.phone}`}>{driver.phone}</a>
                </div>
              </div>
            )}
          </div>

          {/* Center: driver avatar + profile */}
          <div className="lg:col-span-2">
            <div className="p-4 bg-secondary h-full rounded-lg flex flex-col justify-center items-center gap-2">
              <div className="p-0.5 bg-linear-to-r from-cyan-400/80 to-violet-500/80 rounded-full">
                <Avatar className="size-24 bg-background rounded-full">
                  <AvatarImage
                    src={driver?.profileImage ?? "/user.png"}
                    alt={driver?.name ?? "Driver"}
                  />
                  <AvatarFallback>{driverInitials}</AvatarFallback>
                </Avatar>
              </div>
              <h2 className="text-lg font-bold">{driver?.name ?? "Driver"}</h2>
              {driver && <DriverProfile driverId={driver._id} />}
            </div>
          </div>

          {/* Right: route addresses + fare */}
          <div className="lg:col-span-2 divide-y p-4 h-full flex flex-col justify-center items-stretch">
            <h3 className="text-base font-semibold flex items-center gap-2 pb-2">
              <HugeiconsIcon
                className="size-5 text-primary"
                icon={Navigation03Icon}
              />
              {passenger?.pickup.address ?? "—"}
            </h3>
            <h3 className="text-base font-semibold flex items-center gap-2 pt-2">
              <HugeiconsIcon
                className="size-5 text-primary"
                icon={Location01Icon}
              />
              {passenger?.destination.address ?? "—"}
            </h3>
            <div className="pt-3 flex justify-between text-sm text-muted-foreground">
              <span>Est. fare</span>
              <span className="font-semibold text-foreground">
                €{passenger?.estimatedFare?.toFixed(2) ?? "—"}
              </span>
            </div>
            <div className="py-1 flex justify-between text-sm text-muted-foreground">
              <span>Distance</span>
              <span className="font-semibold text-foreground">
                {passenger?.estimatedDistanceKm?.toFixed(1) ?? "—"} km
              </span>
            </div>
            <div className="py-1 flex justify-between text-sm text-muted-foreground">
              <span>Duration</span>
              <span className="font-semibold text-foreground">
                {passenger?.estimatedDurationMinutes ?? "—"} min
              </span>
            </div>
            {settlement && (
              <div className="pt-3">
                <SplitSettlementCard
                  settlement={settlement}
                  myPassengerId={passenger?._id}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="hidden lg:block p-2 bg-background fixed bottom-32 end-12 shadow-xl rounded-lg px-4 text-sm animate-pulse">
        Chat with your Driver
      </div>
      {driver?._id && passenger?.bookingId && (
        <Chat
          bookingId={passenger.bookingId}
          otherUserId={driver._id}
          otherUserName={driver.name}
          otherUserAvatar={driver.profileImage}
        />
      )}

      {rideId && driver?._id && (
        <RatingDialog
          open={showRating}
          onOpenChange={setShowRating}
          rideId={rideId}
          driverId={driver._id}
          driverName={driver.name}
        />
      )}
    </main>
  );
}
