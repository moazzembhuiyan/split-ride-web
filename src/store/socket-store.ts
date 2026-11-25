import { create } from "zustand";
import type {
  ServerToClientEvents,
  SocketEvent,
  SocketEventData,
} from "@/types/socket.types";

export type SocketEventEntry<T = unknown> = { data: T; at: number };

type SocketEventMap = {
  [E in SocketEvent]?: SocketEventEntry<SocketEventData<E>>;
};

interface SocketState {
  events: SocketEventMap;
  dispatch: <E extends SocketEvent>(event: E, data: SocketEventData<E>) => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  events: {},
  dispatch: (event, data) =>
    set((s) => ({
      events: { ...s.events, [event]: { data, at: Date.now() } },
    })),
}));

export function useSocketEvent<E extends SocketEvent>(
  event: E,
): SocketEventEntry<SocketEventData<E>> | undefined {
  return useSocketStore((s) => s.events[event] as SocketEventEntry<SocketEventData<E>> | undefined);
}

export type { ServerToClientEvents };
