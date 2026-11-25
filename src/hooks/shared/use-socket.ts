"use client";

import { useEffect } from "react";
import { useSocketContext } from "@/provider/socket-provider";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketEvent,
  SocketEventData,
} from "@/types/socket.types";

export function useSocket() {
  const { socket, connected } = useSocketContext();

  function emit<E extends keyof ClientToServerEvents>(
    event: E,
    ...args: Parameters<ClientToServerEvents[E]>
  ) {
    socket.emit(event, ...args);
  }

  function on<E extends SocketEvent>(
    event: E,
    handler: (data: SocketEventData<E>) => void
  ) {
    // biome-ignore lint/suspicious/noExplicitAny: socket typing needs cast
    socket.on(event as any, handler as any);
  }

  function off<E extends SocketEvent>(
    event: E,
    handler: (data: SocketEventData<E>) => void
  ) {
    // biome-ignore lint/suspicious/noExplicitAny: socket typing needs cast
    socket.off(event as any, handler as any);
  }

  return { socket, connected, emit, on, off };
}

/** Subscribe to a socket event for the lifetime of the component */
export function useSocketEvent<E extends SocketEvent>(
  event: E,
  handler: (data: SocketEventData<E>) => void
) {
  const { socket } = useSocketContext();

  useEffect(() => {
    // biome-ignore lint/suspicious/noExplicitAny: socket typing needs cast
    socket.on(event as any, handler as any);
    return () => {
      // biome-ignore lint/suspicious/noExplicitAny: socket typing needs cast
      socket.off(event as any, handler as any);
    };
  }, [socket, event, handler]);
}
