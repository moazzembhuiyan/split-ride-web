"use client";
import { useState } from "react";
import {
  AlertTriangle,
  Clock01Icon,
  Coins01Icon,
  Location01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useDriverRides } from "@/hooks/driver/use-driver-ride";
import { useNow, useOrderList } from "@/hooks/driver/use-order-list";
import { useMyVehicles } from "@/hooks/driver/use-vehicle";
import { useSocket } from "@/hooks/shared/use-socket";
import { useT } from "@/i18n";
import { requestOnline } from "@/lib/driver-online";
import { requestFacts } from "@/lib/driver-orders";
import { departureLabel, isRequestExpired } from "@/lib/ride-time";
import { requestRideId, useDriverStore } from "@/store/driver-store";
import {
  NoMatchingOrders,
  OrderToolbar,
  PickupBadge,
} from "./_components/order-toolbar";
import UserAccept from "./user-accept";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function OnlineSwitch() {
  const t = useT();
  const { socket } = useSocket();
  const { data: ongoing } = useDriverRides("started");
  const { data: vehiclesData } = useMyVehicles();
  const vehicleId = vehiclesData?.data?.[0]?._id;
  const isOnline = useDriverStore((s) => s.isOnline);
  const setIsOnline = useDriverStore((s) => s.setIsOnline);
  const setWantsOnline = useDriverStore((s) => s.setWantsOnline);
  const setAnnouncedOn = useDriverStore((s) => s.setAnnouncedOn);
  const location = useDriverStore((s) => s.location);
  const [loading, setLoading] = useState(false);
  // The switch's own checkbox flips on click; a refused change must reset it,
  // or the next click would be ignored.
  const [refusals, setRefusals] = useState(0);

  async function toggle() {
    if (loading) return;
    const next = !isOnline;
    if (!next && (ongoing?.data?.length ?? 0) > 0) {
      toast.error(t("driver.finishRideFirst"));
      setRefusals((n) => n + 1);
      return;
    }
    setLoading(true);
    const result = await requestOnline(socket, {
      online: next,
      lat: location?.lat ?? 0,
      lng: location?.lng ?? 0,
      vehicleId: vehicleId ?? "",
    });
    if (result.ok) {
      setAnnouncedOn(socket.id ?? null);
      setWantsOnline(next);
      setIsOnline(next);
    } else {
      toast.error(result.message);
      setRefusals((n) => n + 1);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1 py-2">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">
            {isOnline ? "Online" : "Offline"}
          </span>
          <span className="text-xs text-muted-foreground">
            {isOnline ? "Receiving ride requests" : "Not visible to passengers"}
          </span>
        </div>
        <Switch
          key={refusals}
          checked={isOnline}
          onCheckedChange={() => void toggle()}
          disabled={loading || !vehicleId || !location}
          className="data-[state=checked]:bg-green-500"
        />
      </div>
      {!vehicleId && (
        <Alert variant="warning">
          <HugeiconsIcon icon={AlertTriangle} />
          <AlertTitle>No Vehicle Assigned</AlertTitle>
          <AlertDescription>
            You need to add a vehicle in your profile before you can go online.
          </AlertDescription>
        </Alert>
      )}
      {!location && (
        <Alert variant="destructive">
          <HugeiconsIcon icon={AlertTriangle} />
          <AlertTitle>No Location Permission </AlertTitle>
          <AlertDescription>
            Please enable location permission in your browser settings to go
            online.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default function Find() {
  const { socket } = useSocket();
  const requests = useDriverStore((s) => s.requests);
  const isOnline = useDriverStore((s) => s.isOnline);
  const declineRide = useDriverStore((s) => s.declineRide);
  const acceptingRideId = useDriverStore((s) => s.acceptingRideId);

  // Re-checks the expiry of open requests.
  const now = useNow();
  const inbox = requests.filter((req) => !isRequestExpired(req, now));
  const { visible, controls } = useOrderList(inbox, requestFacts, "open", now);

  // Hides the ride for this driver only; the riders keep waiting.
  function decline(rideId: string) {
    if (socket.connected) {
      socket.emit("driver:reject-ride", { rideId, reason: "" }, () => {});
    }
    declineRide(rideId);
  }

  if (!isOnline && inbox.length === 0) {
    return (
      <div className="w-full space-y-4">
        <OnlineSwitch />
        <div className="flex flex-col items-center justify-center h-[45dvh] lg:h-[60dvh] gap-3 text-muted-foreground text-sm">
          <div className="size-12 rounded-full bg-muted/40 flex items-center justify-center">
            <HugeiconsIcon
              icon={Clock01Icon}
              className="size-5 text-muted-foreground/60"
            />
          </div>
          <p>Go online to receive ride requests</p>
        </div>
      </div>
    );
  }

  if (inbox.length === 0) {
    return (
      <div className="w-full space-y-4">
        <OnlineSwitch />
        <div className="flex flex-col items-center justify-center h-[45dvh] lg:h-[60dvh] gap-3 text-muted-foreground text-sm">
          <div className="size-12 rounded-full bg-muted/40 flex items-center justify-center">
            <HugeiconsIcon
              icon={Clock01Icon}
              className="size-5 text-muted-foreground/60"
            />
          </div>
          <p>Waiting for ride requests…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <OnlineSwitch />
      <OrderToolbar controls={controls} />
      <ScrollArea className="h-[45dvh] lg:h-[60dvh] w-full pr-2">
        <div className="space-y-3 pb-2">
          {visible.length === 0 && <NoMatchingOrders />}
          {visible.map((req) => {
            const departure = departureLabel(req);
            const name = req.userId?.name ?? "Passenger";
            const fare = Number(req.estimatedFare ?? 0);
            const km = Number(req.estimatedDistanceKm ?? 0);
            const others = (req.riderCount ?? 1) - 1;
            return (
            <div
              key={requestRideId(req)}
              className="rounded-2xl border border-border bg-background shadow-sm"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center gap-3 px-4 pt-4 pb-3">
                <Avatar size="lg" className="size-10 shrink-0">
                  <AvatarImage src={req.userId?.profileImage ?? ""} />
                  <AvatarFallback>
                    {name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight">
                    {name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {others > 0 && `+${others} · `}
                    {req.requestedSeats ?? 0} seat
                    {(req.requestedSeats ?? 0) !== 1 ? "s" : ""} · {req.rideId?.type}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-medium flex-wrap">
                  <PickupBadge order={requestFacts(req)} now={now} />
                  <span className="flex items-center gap-1.5">
                    <span className="size-5 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                      <HugeiconsIcon
                        icon={Clock01Icon}
                        className="size-3 text-violet-600"
                      />
                    </span>
                    {departure.date} · {departure.time}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <HugeiconsIcon
                        icon={Coins01Icon}
                        className="size-3 text-blue-600"
                      />
                    </span>
                    €{fare.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Booking ID */}
              <div className="flex items-center justify-between border-t border-border px-4 py-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Booking ID:
                </span>
                <span className="text-sm font-semibold text-violet-600">
                  {req.rideId?.id ?? req._id}
                </span>
              </div>

              {/* Route + actions */}
              <div className="flex flex-wrap items-center gap-3 px-4 pb-4 pt-2">
                <div className="text-center shrink-0 w-8">
                  <p className="text-sm font-bold leading-tight">
                    {km.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">Km</p>
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <HugeiconsIcon
                      icon={Location01Icon}
                      className="size-3 text-violet-500"
                    />
                    <span className="truncate">{req.pickup?.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <HugeiconsIcon
                      icon={Location01Icon}
                      className="size-3 text-red-400"
                    />
                    <span className="truncate">{req.destination?.address}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end">
                  <Button
                    variant="accent"
                    size="sm"
                    className="rounded-full px-5"
                    onClick={() => decline(requestRideId(req))}
                  >
                    Decline
                  </Button>
                    <UserAccept request={req}>
                      <Button
                        size="sm"
                        className="rounded-full px-5"
                        disabled={
                          !!acceptingRideId &&
                          acceptingRideId !== (req.rideId?._id ?? "")
                        }
                      >
                        Accept
                      </Button>
                    </UserAccept>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
