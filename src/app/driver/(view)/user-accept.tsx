"use client";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Coins01Icon,
  Location01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import React from "react";
import { toast } from "sonner";
import { useSocket } from "@/hooks/shared/use-socket";
import { refreshRideLists } from "@/lib/refresh-rides";
import { departureLabel } from "@/lib/ride-time";
import { emitAck } from "@/lib/socket-ack";
import { requestRideId, useDriverStore } from "@/store/driver-store";
import type { NewRideRequest } from "@/types/ride.types";

export default function UserAccept({
  children,
  request,
}: {
  children: React.ReactNode;
  request: NewRideRequest;
}) {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const [loading, setLoading] = React.useState(false);
  const acceptingRideId = useDriverStore((s) => s.acceptingRideId);
  const setAcceptingRideId = useDriverStore((s) => s.setAcceptingRideId);
  const removeRequestsByRideId = useDriverStore((s) => s.removeRequestsByRideId);

  const name = request.userId?.name ?? "Passenger";
  const fare = Number(request.estimatedFare ?? 0);
  const km = Number(request.estimatedDistanceKm ?? 0);
  const bookingLabel = request.rideId?.id ?? request._id;

  const rows = [
    {
      label: "Ride Price",
      icon: Coins01Icon,
      content: (
        <span className="font-semibold text-primary">
          €{fare.toFixed(2)}
        </span>
      ),
    },
    {
      label: "Booking ID",
      icon: null,
      content: (
        <span className="font-semibold text-sm">{bookingLabel}</span>
      ),
    },
    {
      label: "Passenger",
      icon: UserIcon,
      content: (
        <div className="flex items-center gap-2">
          <Avatar className="size-8">
            <AvatarImage src={request.userId?.profileImage ?? ""} />
            <AvatarFallback className="text-xs">
              {name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm font-semibold leading-tight">{name}</p>
        </div>
      ),
    },
    {
      label: "Pickup",
      icon: Location01Icon,
      content: (
        <span className="font-semibold text-sm text-right">
          {request.pickup?.address}
        </span>
      ),
    },
    {
      label: "Drop Off",
      icon: Location01Icon,
      content: (
        <span className="font-semibold text-sm text-right">
          {request.destination?.address}
        </span>
      ),
    },
    {
      label: "Seats",
      icon: null,
      content: (
        <span className="font-semibold text-sm">
          {request.requestedSeats ?? 0}
        </span>
      ),
    },
    {
      label: "Date",
      icon: null,
      content: (
        <span className="font-semibold text-sm">{departureLabel(request).date}</span>
      ),
    },
    {
      label: "Time",
      icon: null,
      content: (
        <span className="font-semibold text-sm">{departureLabel(request).time}</span>
      ),
    },
    {
      label: "Distance",
      icon: null,
      content: (
        <span className="font-semibold text-sm">{km.toFixed(1)} km</span>
      ),
    },
  ];

  // Accepting a ride confirms all of its waiting riders at once.
  async function handleAccept() {
    const rideId = requestRideId(request);
    if (loading) return;
    if (acceptingRideId && acceptingRideId !== rideId) {
      toast.error("Another booking is already being accepted.");
      return;
    }
    setLoading(true);
    setAcceptingRideId(rideId);
    const result = await emitAck(
      socket,
      "driver:accept-ride",
      { rideId },
      { timeoutMs: 20000 },
    );
    setLoading(false);
    setAcceptingRideId(null);
    if (result.ok) {
      toast.success(result.message || "Ride accepted");
      removeRequestsByRideId(rideId);
    } else {
      toast.error(result.message);
    }
    refreshRideLists(queryClient);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Passenger Information</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-2 pt-1">
            <div className="p-0.5 bg-linear-to-r from-cyan-400/80 to-violet-500/80 rounded-full">
              <Avatar className="size-20 bg-background rounded-full overflow-hidden">
                <AvatarImage src={request.userId?.profileImage ?? ""} />
                <AvatarFallback>
                  {name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <h2 className="text-base font-bold">{name}</h2>
          </div>

          <div className="rounded-xl bg-secondary/60 border border-border divide-y divide-border">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between px-4 py-3 gap-4"
              >
                <span className="text-sm text-muted-foreground shrink-0">
                  {row.label}
                </span>
                <div className="flex items-center justify-end gap-1 flex-1 min-w-0">
                  {row.content}
                </div>
              </div>
            ))}
          </div>

          <div className="p-0.5 rounded-full bg-linear-to-r from-cyan-400 to-violet-500">
            <Button
              className="w-full rounded-full bg-background text-foreground hover:bg-background/90 font-semibold"
              onClick={handleAccept}
              disabled={loading || (!!acceptingRideId && acceptingRideId !== (request.rideId?._id ?? ""))}
            >
              {loading ? "Accepting…" : "Accept Ride"}
            </Button>
          </div>
        </DialogContent>
    </Dialog>
  );
}
