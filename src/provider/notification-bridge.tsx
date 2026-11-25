"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { useSocket } from "@/hooks/shared/use-socket";
import { translate } from "@/i18n/translate";
import { userMessage } from "@/lib/error-message";
import { refreshRideLists } from "@/lib/refresh-rides";
import { isEventForPassenger } from "@/lib/ride-progress";
import { useRideSessionStore } from "@/store/ride-session-store";
import type { ServerToClientEvents } from "@/types/socket.types";

type Handlers = {
  [E in keyof ServerToClientEvents]?: (
    data: Parameters<ServerToClientEvents[E]>[0],
  ) => void;
};

/** Events after which the ride lists on screen are out of date. */
const LIST_EVENTS: (keyof ServerToClientEvents)[] = [
  "ride:driver-accepted",
  "ride:cancelled",
  "ride:passenger-cancelled",
  "ride:cancelled-by-driver",
  "ride:cancelled-by-rider",
  "ride:no-driver-found",
  "ride:driver-en-route",
  "ride:driver-arrived",
  "ride:trip-started",
  "ride:passenger-picked-up",
  "ride:passenger-picked",
  "ride:passenger-dropped-off",
  "ride:co-passenger-cancelled",
  "ride:co-passenger-picked",
  "ride:passenger-no-show",
  "ride:trip-completed",
  "ride:accepted",
  "ride:started",
  "ride:completed",
  "booking:accepted",
  "booking:rejected",
  "booking:cancelled",
];

/** Whether the driver arrived for this rider, not for another one. */
function arrivedForMe(event: {
  rideId?: string;
  passengerId?: string;
  userId?: string;
}): boolean {
  const { tracked } = useRideSessionStore.getState();
  if (!tracked || (event.rideId && event.rideId !== tracked.rideId)) {
    return true;
  }
  return isEventForPassenger(event, tracked);
}

export function NotificationBridge() {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    const refresh = () => refreshRideLists(queryClient);
    const onNotification = () => {
      refreshRideLists(queryClient);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      // KYC approval and wallet changes are part of the profile.
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    };
    // biome-ignore lint/suspicious/noExplicitAny: dynamic event binding
    for (const event of LIST_EVENTS) socket.on(event as any, refresh);
    socket.on("notification:new", onNotification);
    return () => {
      // biome-ignore lint/suspicious/noExplicitAny: dynamic event binding
      for (const event of LIST_EVENTS) socket.off(event as any, refresh);
      socket.off("notification:new", onNotification);
    };
  }, [socket, queryClient]);

  useEffect(() => {
    const handlers: Handlers = {
      "ride:driver-accepted": () => toast.success("Driver accepted your ride"),
      "ride:cancelled": (d) =>
        toast.error(d.reason ? `Ride cancelled: ${d.reason}` : "Ride cancelled"),
      "ride:passenger-cancelled": () => toast.info("A passenger cancelled their seat"),
      "ride:cancelled-by-driver": (d) =>
        toast.error(d.reason ? `Driver cancelled: ${d.reason}` : "Driver cancelled the ride"),
      "ride:no-driver-found": (d) =>
        toast.info(d?.message || d?.reason || translate("ride.noDriver")),
      "ride:no-show-charge": (d) => toast.warning(`No-show charge applied: €${d.amount.toFixed(2)}`),
      "ride:driver-en-route": () => toast.info(translate("ride.stage.enRoute")),
      "ride:driver-arrived": (d) => {
        if (arrivedForMe(d ?? {})) toast.info(translate("ride.stage.arrived"));
      },
      "ride:trip-started": () => toast.success("Trip started"),
      "ride:waiting-charge": (d) => toast.warning(`Waiting charge applied: €${d.amount.toFixed(2)}`),
      "ride:passenger-picked-up": () => toast.info("A passenger was picked up"),
      "ride:passenger-dropped-off": () => toast.info("A passenger was dropped off"),
      "ride:trip-completed": () => toast.success("Trip completed"),
      "ride:request-rating": () => toast.info("Please rate your ride"),
      "ride:driver-disconnected": () => toast.warning("Driver disconnected"),
      "ride:co-passenger-cancelled": () => toast.info(translate("ride.coRiderLeft")),
      "ride:co-passenger-picked": () => toast.info("A co-passenger was picked up"),
      "ride:all-passengers-picked": () => toast.success("All passengers picked up"),
      "ride:start-otp": () => toast.info(translate("ride.otp.toast")),
      "ride:new-request": () => toast.info("New ride request received"),
      "ride:cancelled-by-rider": () => toast.error("Rider cancelled the ride"),
      "ride:passenger-no-show": () => toast.warning("Passenger marked as no-show"),
      "ride:rating-received": (d) => toast.success(`You received a ${d.rating}★ rating`),
      "ride:passenger-picked": () => toast.info("Passenger picked up"),
      "ride:all-passengers-dropped": () => toast.success("All passengers dropped off"),
      "driver:status-changed": (d) => toast.info(d.isOnline ? "You are online" : "You are offline"),
      error: (d) => {
        // Session errors are handled (and reported) by the socket provider.
        if (/UNAUTHORIZED|INVALID_TOKEN|TOKEN_EXPIRED/.test(d?.code ?? d?.message ?? "")) {
          return;
        }
        toast.error(userMessage(d ?? {}));
      },
    };

    for (const [event, handler] of Object.entries(handlers)) {
      // biome-ignore lint/suspicious/noExplicitAny: dynamic event binding across a heterogeneous handler map
      socket.on(event as any, handler as any);
    }
    return () => {
      for (const [event, handler] of Object.entries(handlers)) {
        // biome-ignore lint/suspicious/noExplicitAny: dynamic event binding across a heterogeneous handler map
        socket.off(event as any, handler as any);
      }
    };
  }, [socket]);

  return null;
}
