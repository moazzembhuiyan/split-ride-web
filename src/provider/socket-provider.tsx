"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { REFRESH_URL } from "@/lib/api";
import { getToken, recoverSession, SESSION_CHANGED } from "@/lib/session";
import { destroySocket, getSocket, type AppSocket } from "@/lib/socket";
import type { SocketEvent } from "@/types/socket.types";
import { useSocketStore } from "@/store/socket-store";
import { useRideSessionStore } from "@/store/ride-session-store";

interface SocketContextValue {
  socket: AppSocket;
  connected: boolean;
}

const SocketContext = createContext<SocketContextValue | null>(null);

const AUTH_ERRORS = /UNAUTHORIZED|INVALID_TOKEN|TOKEN_EXPIRED/;

const ALL_EVENTS: SocketEvent[] = [
  // rider
  "ride:driver-accepted",
  "ride:cancelled",
  "ride:passenger-cancelled",
  "ride:cancelled-by-driver",
  "ride:no-driver-found",
  "ride:no-show-charge",
  "ride:driver-en-route",
  "ride:driver-arrived",
  "ride:trip-started",
  "ride:live-update",
  "ride:waiting-charge",
  "ride:passenger-picked-up",
  "ride:passenger-dropped-off",
  "ride:trip-completed",
  "ride:request-rating",
  "ride:driver-disconnected",
  "ride:co-passenger-cancelled",
  "ride:co-passenger-picked",
  "ride:all-passengers-picked",
  "ride:start-otp",
  "passenger:start-otp",
  "ride:start-otp-verified",
  // driver
  "ride:new-request",
  "ride:request-updated",
  "ride:already-taken",
  "ride:cancelled-by-rider",
  "ride:passenger-no-show",
  "ride:rating-received",
  "ride:passenger-picked",
  "ride:all-passengers-dropped",
  // legacy / generic
  "ride:accepted",
  "ride:started",
  "ride:completed",
  "ride:status",
  "driver:status-changed",
  "new-message",
  "chat-list",
  "chat:seen",
  "booking:request",
  "booking:accepted",
  "booking:rejected",
  "booking:cancelled",
  "notification:new",
  "error",
];

export function SocketProvider({ children }: { children: ReactNode }) {
  const socket = useRef<AppSocket>(getSocket());
  const [connected, setConnected] = useState(false);
  const dispatch = useSocketStore((s) => s.dispatch);

  useEffect(() => {
    const s = socket.current;

    s.connect();

    const onConnect = () => {
      setConnected(true);
      // Reattach to the last known active ride room after every (re)connect —
      // covers page reloads and network reconnects, from persisted storage,
      // not just while the ride-detail page itself is mounted.
      const rideId = useRideSessionStore.getState().activeRideId;
      if (rideId) s.emit("room:join", rideId);
    };
    const onDisconnect = () => setConnected(false);

    // Login and token refresh: reconnect with the new token. The same socket
    // object is kept, so no listener is lost.
    const onSessionChanged = () => {
      s.disconnect();
      s.connect();
    };

    // One recovery per token, so a token the server keeps refusing cannot loop.
    let recoveredToken: string | undefined;
    const onAuthError = (error: {
      message?: string;
      code?: string;
      data?: { code?: string };
    }) => {
      const code = error?.data?.code ?? error?.code ?? error?.message ?? "";
      const token = getToken();
      if (!AUTH_ERRORS.test(code) || !token || token === recoveredToken) return;
      recoveredToken = token;
      void recoverSession(REFRESH_URL, token);
    };

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("connect_error", onAuthError);
    s.on("error", onAuthError);
    window.addEventListener(SESSION_CHANGED, onSessionChanged);

    // biome-ignore lint/suspicious/noExplicitAny: dynamic event binding
    const handlers = new Map<SocketEvent, (data: any) => void>();
    for (const event of ALL_EVENTS) {
      // biome-ignore lint/suspicious/noExplicitAny: dynamic event binding
      const handler = (data: any) => dispatch(event, data);
      handlers.set(event, handler);
      s.on(event as any, handler);
    }

    if (s.connected) setConnected(true);

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("connect_error", onAuthError);
      s.off("error", onAuthError);
      window.removeEventListener(SESSION_CHANGED, onSessionChanged);
      for (const [event, handler] of handlers) {
        s.off(event as any, handler);
      }
      destroySocket();
    };
  }, [dispatch]);

  return (
    <SocketContext.Provider value={{ socket: socket.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocketContext must be inside SocketProvider");
  return ctx;
}
