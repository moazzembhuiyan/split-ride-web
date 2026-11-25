import { userMessage } from "@/lib/error-message";
import type { AppSocket } from "@/lib/socket";
import { emitAck } from "@/lib/socket-ack";
import { userService } from "@/services/user.service";

const ANSWER_TIMEOUT_MS = 15000;

interface OnlineRequest {
  online: boolean;
  lat: number;
  lng: number;
  vehicleId: string;
}

/** Resolves once the server has answered; `online` is the server's state. */
export async function requestOnline(
  socket: AppSocket,
  { online, lat, lng, vehicleId }: OnlineRequest,
): Promise<{ ok: boolean; message?: string }> {
  const result = await emitAck(
    socket,
    online ? "driver:go-online" : "driver:go-offline",
    online ? { lat, lng, vehicleId } : { lat, lng },
    {
      timeoutMs: ANSWER_TIMEOUT_MS,
      answers: [
        {
          event: "driver:status-changed",
          match: (data) =>
            typeof data?.isOnline === "boolean"
              ? data.isOnline === online
              : undefined,
        },
        { event: "error", match: () => false },
      ],
    },
  );
  if (result.ok) return { ok: true };

  if (result.reason === "timeout") {
    // The answer may have been lost: ask the server for its state.
    try {
      const me = await userService.getMe();
      if (me.data?.isOnline === online) return { ok: true };
    } catch {
      // Report the timeout below.
    }
    return { ok: false, message: userMessage({ code: "TIMEOUT" }) };
  }
  return { ok: false, message: result.message };
}
