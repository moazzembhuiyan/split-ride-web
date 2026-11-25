"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  DownloadIcon,
  Location01Icon,
  Navigation03Icon,
  TickIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Map as RideMap,
  MapMarker,
  MapRoute,
  MarkerContent,
  MarkerLabel,
} from "@/components/ui/map";
import { LiveMarker } from "@/components/core/live-marker";
import {
  useDriverRideById,
  usePassengersByRide,
} from "@/hooks/driver/use-driver-ride";
import { useSocket } from "@/hooks/shared/use-socket";
import { useMe } from "@/hooks/shared/use-user";
import { useDriverStore } from "@/store/driver-store";
import { useRideSessionStore } from "@/store/ride-session-store";
import { useT } from "@/i18n";
import { encodeLngLatPath } from "@/lib/polyline";
import { refreshRideLists } from "@/lib/refresh-rides";
import {
  furthest,
  hasReached,
  isActivePassenger,
  passengerStage,
  type RideStage,
} from "@/lib/ride-progress";
import { departureLabel } from "@/lib/ride-time";
import { type AckResult, emitAck } from "@/lib/socket-ack";
import { fillText } from "@/i18n/translate";
import type { RidePassenger } from "@/types/booking.types";
import Chat from "./chat";
import InvoicePDF from "./invoice";
import StartOtpDialog from "./start-otp-dialog";
import { PDFViewer } from "@react-pdf/renderer";
import RiderInvoicePDF from "./rider-invoice";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
interface RouteData {
  coordinates: [number, number][];
  duration: number;
  distance: number;
}

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const t = useT();
  const queryClient = useQueryClient();
  const rideId = String(params.id);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [tripStarted, setTripStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  // Confirmed steps, until the reloaded passengers show them too.
  const [confirmed, setConfirmed] = useState<Record<string, RideStage>>({});
  const [confirmDropoff, setConfirmDropoff] = useState<RidePassenger | null>(
    null,
  );
  const [arriving, setArriving] = useState<string | null>(null);
  const [pickingUp, setPickingUp] = useState<string | null>(null);
  const pickupBusy = useRef(false);
  const [otpFor, setOtpFor] = useState<string | null>(null);
  const [droppingOff, setDroppingOff] = useState<string | null>(null);
  const [tripCompleted, setTripCompleted] = useState(false);
  const [completingTrip, setCompletingTrip] = useState(false);

  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const {
    data: rideData,
    isPending: ridePending,
    isError: rideError,
    refetch: refetchRide,
  } = useDriverRideById(rideId);
  const {
    data: passengersData,
    isPending: passengersPending,
    refetch: refetchPassengers,
  } = usePassengersByRide(rideId);
  const { socket } = useSocket();
  const driverLocation = useDriverStore((s) => s.location);
  const setEncodedRoute = useDriverStore((s) => s.setEncodedRoute);
  const { data: meData } = useMe();
  const me = meData?.data;
  const setActiveRideId = useRideSessionStore((s) => s.setActiveRideId);

  const ride: any = rideData?.data;
  const passengers = (passengersData?.data ?? []).filter(isActivePassenger);

  function stageOf(p: RidePassenger): RideStage {
    return furthest(passengerStage(p), confirmed[p._id] ?? "waiting");
  }
  const reached = (p: RidePassenger, stage: RideStage) =>
    hasReached(stageOf(p), stage);

  const pickup = ride?.pickup;
  const destination = ride?.destination;

  const start = {
    lat: pickup?.coordinates[1] ?? 0,
    lng: pickup?.coordinates[0] ?? 0,
  };
  const end = {
    lat: destination?.coordinates[1] ?? 0,
    lng: destination?.coordinates[0] ?? 0,
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetch on ride load
  useEffect(() => {
    if (!ride || !start.lat || !end.lat) return;
    async function fetchRoutes() {
      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&alternatives=true`,
        );
        const data = await res.json();
        if (data.routes?.length > 0) {
          setRoutes(
            data.routes.map(
              (r: {
                geometry: { coordinates: [number, number][] };
                duration: number;
                distance: number;
              }) => ({
                coordinates: r.geometry.coordinates,
                duration: r.duration,
                distance: r.distance,
              }),
            ),
          );
        }
      } catch {
        // silent
      }
    }
    fetchRoutes();
  }, [ridePending]);

  useEffect(() => {
    const selected = routes[selectedIndex];
    if (!selected?.coordinates?.length) return;
    setEncodedRoute(encodeLngLatPath(selected.coordinates));
    return () => setEncodedRoute("");
  }, [routes, selectedIndex, setEncodedRoute]);

  const tripOngoing = tripStarted || ride?.status === "started";
  const remainingToArrive = passengers.filter((p) => !reached(p, "arrived"));
  const remainingPassengers = passengers.filter(
    (p) => reached(p, "arrived") && !reached(p, "pickedUp"),
  );
  // Gone once this passenger is picked up or has left the ride.
  const otpPassenger = remainingPassengers.find((p) => p._id === otpFor);
  const remainingDropoffs = passengers.filter(
    (p) => reached(p, "pickedUp") && !reached(p, "droppedOff"),
  );
  const canCancel =
    ride?.canDriverCancel !== false &&
    remainingDropoffs.length === 0 &&
    !["completed", "cancelled", "paid"].includes(ride?.status);

  // While the trip is ongoing, persist it as the active ride and join its room —
  // covers reconnects (reload, network drop) via SocketProvider's "connect" handler.
  useEffect(() => {
    if (!rideId || !tripOngoing) return;
    setActiveRideId(rideId);
    socket.emit("room:join", rideId);
    return () => {
      socket.emit("room:leave", rideId);
    };
  }, [rideId, tripOngoing, socket, setActiveRideId]);

  const sortedRoutes = routes
    .map((route, index) => ({ route, index }))
    .sort((a, b) => {
      if (a.index === selectedIndex) return 1;
      if (b.index === selectedIndex) return -1;
      return 0;
    });

  async function handleStartTrip() {
    if (starting || tripStarted) return;
    setStarting(true);
    const result = await emitAck(
      socket,
      "driver:start-trip",
      { rideId },
      { timeoutMs: 10000 },
    );
    setStarting(false);
    if (result.ok) {
      setTripStarted(true);
      toast.success(result.message || "Trip started!");
    } else {
      toast.error(result.message);
    }
    refreshRideLists(queryClient);
  }

  /**
   * Success is what the server confirms. Without an answer the passenger is
   * read again instead of assuming anything.
   */
  async function settle(
    result: AckResult,
    passengerId: string,
    stage: RideStage,
    doneText: string,
  ) {
    let done = result.ok;
    if (!result.ok && result.reason === "timeout") {
      const fresh = await refetchPassengers();
      const passenger = fresh.data?.data?.find((p) => p._id === passengerId);
      done = hasReached(passengerStage(passenger), stage);
    }
    if (done) {
      setConfirmed((c) => ({
        ...c,
        [passengerId]: furthest(c[passengerId] ?? "waiting", stage),
      }));
      toast.success((result.ok && result.message) || doneText);
    } else if (!result.ok) {
      toast.error(result.message);
    }
    refreshRideLists(queryClient);
  }

  async function handleArrived(passengerId: string) {
    if (arriving) return;
    const lat = driverLocation?.lat ?? start.lat;
    const lng = driverLocation?.lng ?? start.lng;
    setArriving(passengerId);
    const result = await emitAck(
      socket,
      "driver:arrived-pickup",
      { rideId, passengerId, lat, lng },
      { timeoutMs: 15000 },
    );
    await settle(result, passengerId, "arrived", "Arrived at pickup");
    setArriving(null);
  }

  /** The server asks for the passenger's code unless it was verified before. */
  async function handlePickup(passengerId: string, otp?: string) {
    if (pickupBusy.current) return;
    pickupBusy.current = true;
    setPickingUp(passengerId);
    const result = await emitAck(
      socket,
      "driver:pickup-ride",
      { rideId, passengerId, ...(otp ? { otp } : {}) },
      { timeoutMs: 25000 },
    );
    if (!otp && !result.ok && result.code === "OTP_REQUIRED") {
      setOtpFor(passengerId);
    } else {
      await settle(result, passengerId, "pickedUp", "Passenger picked up");
    }
    pickupBusy.current = false;
    setPickingUp(null);
  }

  async function handleDropoff(passengerId: string) {
    if (droppingOff) return;
    setDroppingOff(passengerId);
    const result = await emitAck(
      socket,
      "driver:drop-off-passenger",
      { rideId, passengerId },
      { timeoutMs: 20000 },
    );
    await settle(result, passengerId, "droppedOff", "Passenger dropped off");
    setDroppingOff(null);
  }

  async function handleCompleteTrip() {
    if (completingTrip || tripCompleted) return;
    setCompletingTrip(true);
    const passengerId = passengers.at(-1)?._id;
    const result = await emitAck(
      socket,
      "driver:complete-trip",
      { rideId, passengerId },
      { timeoutMs: 20000 },
    );
    let done = result.ok;
    if (!result.ok && result.reason === "timeout") {
      const fresh = await refetchRide();
      done = (fresh.data?.data as { status?: string })?.status === "completed";
    }
    setCompletingTrip(false);
    if (done) {
      setTripCompleted(true);
      setActiveRideId(null);
      toast.success((result.ok && result.message) || "Trip completed!");
    } else if (!result.ok) {
      toast.error(result.message);
    }
    refreshRideLists(queryClient);
  }

  async function handleCancelRide() {
    if (cancelling) return;
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation.");
      return;
    }
    setCancelling(true);
    const result = await emitAck(
      socket,
      "driver:cancel-ride",
      { rideId, reason: cancelReason },
      { timeoutMs: 15000 },
    );
    setCancelling(false);
    // Also after a refusal: a rider may have been picked up meanwhile.
    refreshRideLists(queryClient);
    if (result.ok) {
      setActiveRideId(null);
      toast.success(result.message || "Ride cancelled");
      router.replace("/driver/my-rides");
    } else {
      toast.error(result.message);
    }
  }

  if (ridePending) {
    return (
      <main className="flex-1 h-full w-full z-20 bg-purple-300 flex justify-center items-center">
        <div className="text-lg font-semibold text-primary animate-pulse">
          Loading…
        </div>
      </main>
    );
  }

  if (rideError || !ride) {
    return (
      <main className="flex-1 h-full w-full z-20 flex flex-col gap-3 justify-center items-center">
        <p className="text-muted-foreground">{t("error.loadFailed")}</p>
        <Button variant="outline" onClick={() => void refetchRide()}>
          {t("common.tryAgain")}
        </Button>
      </main>
    );
  }

  const departure = departureLabel(ride);

  return (
    <main className="flex-1 h-full min-h-[calc(100dvh-64px)] w-full z-20 bg-purple-300">
      <RideMap
        center={[start.lng || 4.9041, start.lat || 52.3676]}
        theme="light"
        zoom={13.5}
      >
        {sortedRoutes.map(({ route, index }) => {
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

        <MapMarker longitude={start.lng} latitude={start.lat}>
          <MarkerContent>
            <div className="relative flex items-center justify-center size-5">
              <span className="absolute inline-flex size-5 rounded-full bg-green-400 opacity-60 animate-ping" />
              <div className="relative size-5 rounded-full bg-green-500 border-2 border-white shadow-lg" />
            </div>
            <MarkerLabel position="top">Pickup</MarkerLabel>
          </MarkerContent>
        </MapMarker>

        <MapMarker longitude={end.lng} latitude={end.lat}>
          <MarkerContent>
            <div className="size-5 rounded-full bg-red-500 border-2 border-white shadow-lg" />
            <MarkerLabel position="bottom">Destination</MarkerLabel>
          </MarkerContent>
        </MapMarker>

        {driverLocation && (
          <MapMarker
            longitude={driverLocation.lng}
            latitude={driverLocation.lat}
          >
            <MarkerContent>
              <LiveMarker src={me?.profileImage} />
              <MarkerLabel position="top">You</MarkerLabel>
            </MarkerContent>
          </MapMarker>
        )}
      </RideMap>

      <Card className="fixed z-20 bottom-2 inset-x-2 max-h-[45dvh] overflow-y-auto lg:max-h-none lg:inset-x-auto lg:bottom-12 lg:start-12 lg:w-[70dvw] bg-white shadow-xl border-0 ring-0">
        <CardContent className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
          {/* Left: ride info + start button */}
          <div className="h-full flex flex-col justify-between items-stretch gap-3">
            <div>
              <h2 className="text-base font-semibold">
                {departure.time}
              </h2>
              <p className="text-sm text-muted-foreground">
                {departure.date}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className="capitalize text-xs">
                  {ride?.rideType ?? "—"}
                </Badge>
                <Badge
                  className={
                    ride?.status === "started"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }
                >
                  {ride?.status ?? "—"}
                </Badge>
              </div>
            </div>

            <div className="p-0.5 rounded-full bg-linear-to-r from-cyan-400/80 to-violet-500/80 w-full mt-auto">
              {ride?.status === "completed" ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <HugeiconsIcon icon={DownloadIcon} />
                      Download Invoice
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="min-w-[90dvw]! h-[90dvh] p-0 overflow-hidden">
                    <DialogHeader className="hidden">
                      <DialogTitle>
                        Invoice for Ride {ride?.rideNumber}
                      </DialogTitle>
                    </DialogHeader>
                    <PDFViewer width="100%" height="100%" showToolbar>
                      {me?.role === "provider" ? (
                        <InvoicePDF data={ride} />
                      ) : (
                        <RiderInvoicePDF ride={ride} />
                      )}
                    </PDFViewer>
                  </DialogContent>
                </Dialog>
              ) : !tripOngoing ? (
                <Button
                  variant="outline"
                  className="w-full bg-secondary rounded-full"
                  onClick={() => void handleStartTrip()}
                  disabled={starting}
                >
                  <HugeiconsIcon icon={TickIcon} className="size-4" />
                  Start Driving
                </Button>
              ) : remainingToArrive.length === 1 ? (
                <Button
                  variant="outline"
                  className="w-full bg-secondary rounded-full"
                  onClick={() => handleArrived(remainingToArrive[0]._id)}
                  disabled={arriving !== null}
                >
                  <HugeiconsIcon icon={Location01Icon} className="size-4" />
                  {arriving
                    ? "Marking arrival…"
                    : `Arrived at ${remainingToArrive[0].userId?.name ?? "Passenger"}`}
                </Button>
              ) : remainingToArrive.length > 1 ? (
                <>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full bg-secondary rounded-full"
                      >
                        <HugeiconsIcon icon={Location01Icon} className="size-4" />
                        Arrived at Pickup ({remainingToArrive.length} left)
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm">
                      <DialogHeader>
                        <DialogTitle>
                          Select passenger you arrived for
                        </DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col gap-2">
                        {remainingToArrive.map((p) => (
                          <Button
                            key={p._id}
                            variant="outline"
                            className="w-full justify-between rounded-xl"
                            onClick={() => handleArrived(p._id)}
                            disabled={arriving !== null}
                          >
                            <span>{p.userId?.name ?? "Passenger"}</span>
                            <span className="text-xs text-muted-foreground">
                              {arriving === p._id ? "Marking…" : "Arrived"}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              ) : remainingPassengers.length === 1 ? (
                <Button
                  variant="outline"
                  className="w-full bg-secondary rounded-full"
                  onClick={() => handlePickup(remainingPassengers[0]._id)}
                  disabled={pickingUp !== null}
                >
                  <HugeiconsIcon icon={TickIcon} className="size-4" />
                  {pickingUp
                    ? "Picking up…"
                    : `Pick Up ${remainingPassengers[0].userId?.name ?? "Passenger"}`}
                </Button>
              ) : remainingPassengers.length > 1 ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full bg-secondary rounded-full"
                    >
                      <HugeiconsIcon icon={TickIcon} className="size-4" />
                      Pick Up Passenger ({remainingPassengers.length} left)
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Select passenger to pick up</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-2">
                      {remainingPassengers.map((p) => (
                        <Button
                          key={p._id}
                          variant="outline"
                          className="w-full justify-between rounded-xl"
                          onClick={() => handlePickup(p._id)}
                          disabled={pickingUp !== null}
                        >
                          <span>{p.userId?.name ?? "Passenger"}</span>
                          <span className="text-xs text-muted-foreground">
                            {pickingUp === p._id
                              ? "Picking up…"
                              : `${p.requestedSeats} seat${p.requestedSeats !== 1 ? "s" : ""}`}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              ) : remainingDropoffs.length === 1 ? (
                <Button
                  variant="outline"
                  className="w-full bg-secondary rounded-full"
                  onClick={() => setConfirmDropoff(remainingDropoffs[0])}
                  disabled={droppingOff !== null}
                >
                  <HugeiconsIcon icon={TickIcon} className="size-4" />
                  {droppingOff
                    ? "Dropping off…"
                    : `${t("driver.dropOff")} ${remainingDropoffs[0].userId?.name ?? "Passenger"}`}
                </Button>
              ) : remainingDropoffs.length > 1 ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full bg-secondary rounded-full"
                    >
                      <HugeiconsIcon icon={TickIcon} className="size-4" />
                      Drop Off Passenger ({remainingDropoffs.length} left)
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Select passenger to drop off</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-2">
                      {remainingDropoffs.map((p) => (
                        <Button
                          key={p._id}
                          variant="outline"
                          className="w-full justify-between rounded-xl"
                          onClick={() => setConfirmDropoff(p)}
                          disabled={droppingOff !== null}
                        >
                          <span>{p.userId?.name ?? "Passenger"}</span>
                          <span className="text-xs text-muted-foreground">
                            {droppingOff === p._id
                              ? "Dropping off…"
                              : `${p.requestedSeats} seat${p.requestedSeats !== 1 ? "s" : ""}`}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full bg-secondary rounded-full"
                      disabled={completingTrip}
                    >
                      <HugeiconsIcon icon={TickIcon} className="size-4" />
                      {completingTrip ? "Completing…" : "Complete Trip"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Complete this trip?</AlertDialogTitle>
                      <AlertDialogDescription>
                        All passengers have been dropped off. This marks the
                        ride as finished and cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => void handleCompleteTrip()}
                      >
                        Complete Trip
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            {
              canCancel && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive">Cancel Ride</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Are you sure you want to cancel this ride?</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Label>Reason for cancellation:</Label>
                      <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
                    </div>
                    <DialogFooter>
                      <Button
                        variant="destructive"
                        disabled={cancelling}
                        onClick={() => void handleCancelRide()}
                      >
                        {cancelling ? "Cancelling…" : "Confirm"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )
            }
          </div>
          {/* Center: passengers */}
          <div className="lg:col-span-2">
            <div className="p-4 bg-secondary h-full rounded-lg flex flex-col gap-3">
              <p className="text-xs text-muted-foreground font-medium">
                Passengers ({passengers.length})
              </p>
              {passengersPending ? (
                <div className="text-xs text-muted-foreground animate-pulse">
                  Loading…
                </div>
              ) : passengers.length === 0 ? (
                <div className="text-xs text-muted-foreground">
                  No passengers
                </div>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {passengers.map((p) => {
                    const initials = p.userId?.name
                      ? p.userId.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                      : "P";
                    const picked = reached(p, "pickedUp");
                    const dropped = reached(p, "droppedOff");
                    return (
                      <div
                        key={p._id}
                        className="flex flex-col items-center gap-1"
                      >
                        <div
                          className={`relative p-0.5 rounded-full ${dropped ? "bg-blue-500" : picked ? "bg-green-500" : "bg-linear-to-r from-cyan-400/80 to-violet-500/80"}`}
                        >
                          <Avatar className="size-14 bg-background rounded-full">
                            <AvatarImage
                              src={p.userId?.profileImage ?? "/user.png"}
                            />
                            <AvatarFallback className="text-xs">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          {(picked || dropped) && (
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 size-5 rounded-full border-2 border-white flex items-center justify-center ${dropped ? "bg-blue-500" : "bg-green-500"}`}
                            >
                              <HugeiconsIcon
                                icon={TickIcon}
                                className="size-3 text-white"
                              />
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-medium text-center leading-tight max-w-16 truncate">
                          {p.userId?.name ?? "—"}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {dropped
                            ? "Dropped off"
                            : picked
                              ? "Picked up"
                              : `${p.requestedSeats} seat${p.requestedSeats !== 1 ? "s" : ""}`}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: addresses + fare */}
          <div className="lg:col-span-2 divide-y p-4 h-full flex flex-col justify-center items-stretch">
            <h3 className="text-base font-semibold flex items-center gap-2 pb-2">
              <HugeiconsIcon
                className="size-5 text-primary"
                icon={Navigation03Icon}
              />
              {pickup?.address ?? "—"}
            </h3>
            <h3 className="text-base font-semibold flex items-center gap-2 pt-2 pb-2">
              <HugeiconsIcon
                className="size-5 text-primary"
                icon={Location01Icon}
              />
              {destination?.address ?? "—"}
            </h3>
            <div className="pt-2 flex justify-between text-sm text-muted-foreground">
              <span>Est. fare</span>
              <span className="font-semibold text-foreground">
                €{ride?.passengers?.[0]?.estimatedFare ?? "—"}
              </span>
            </div>
            <div className="py-1 flex justify-between text-sm text-muted-foreground">
              <span>Distance</span>
              <span className="font-semibold text-foreground">
                {Number(
                  ride?.passengers?.[0]?.estimatedDistanceKm ?? 0,
                ).toFixed(1)}{" "}
                km
              </span>
            </div>
            <div className="py-1 flex justify-between text-sm text-muted-foreground">
              <span>Duration</span>
              <span className="font-semibold text-foreground">
                {ride?.passengers?.[0]?.estimatedDurationMinutes ?? "—"} min
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {otpPassenger && (
        <StartOtpDialog
          key={otpPassenger._id}
          rideId={rideId}
          passengerId={otpPassenger._id}
          passengerName={otpPassenger.userId?.name ?? t("common.passenger")}
          verifying={pickingUp !== null}
          onSubmit={(otp) => void handlePickup(otpPassenger._id, otp)}
          onClose={() => setOtpFor(null)}
        />
      )}

      <AlertDialog
        open={!!confirmDropoff}
        onOpenChange={(open) => !open && setConfirmDropoff(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {fillText(t("driver.dropOffConfirm"), {
                name: confirmDropoff?.userId?.name ?? "Passenger",
              })}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDropoff) void handleDropoff(confirmDropoff._id);
              }}
            >
              {t("driver.dropOff")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="hidden lg:block p-2 bg-background fixed bottom-32 end-12 shadow-xl rounded-lg px-4 text-sm animate-pulse">
        Chat with your Passengers
      </div>
      <Chat passengers={passengers} />
    </main>
  );
}
