import { io, type Socket } from "socket.io-client";
import { getToken } from "@/lib/session";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/types/socket.types";

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ??
  process.env.NEXT_PUBLIC_SERVER_URL ??
  "http://localhost:3000";

let socketInstance: AppSocket | null = null;

export function getSocket(): AppSocket {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
      transports: ["websocket", "polling"],
      auth: (cb) => {
        cb({ token: getToken() });
      },
    });

    socketInstance.on("connect", () => {
      debug("[socket] connect", socketInstance?.id);
      const token = getToken();
      if (token) socketInstance?.emit("user-connected", { token });
    });
    socketInstance.on("disconnect", (reason) => {
      debug("[socket] disconnect", reason);
    });
    socketInstance.on("connect_error", (err) => {
      debug("[socket] connect_error", err.message, err);
    });
    socketInstance.io.on("reconnect", (attempt) => {
      debug("[socket] reconnect", attempt);
    });
    socketInstance.onAny((event, ...args) => {
      debug("[socket recv]", event, ...args);
    });
    socketInstance.onAnyOutgoing((event, ...args) => {
      debug("[socket emit]", event, ...args);
    });
  }
  return socketInstance;
}

/** Socket traffic includes tokens and start codes. */
function debug(...args: unknown[]): void {
  if (process.env.NODE_ENV !== "production") console.log(...args);
}

export function destroySocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
