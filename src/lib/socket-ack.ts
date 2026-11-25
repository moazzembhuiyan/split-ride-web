import { userMessage } from "@/lib/error-message";
import type { AppSocket } from "@/lib/socket";

export type AckResult =
  | { ok: true; message?: string; data?: unknown }
  | {
      ok: false;
      /** offline: never sent. timeout: sent, outcome unknown. */
      reason: "offline" | "timeout" | "rejected";
      code?: string;
      /** Safe to show to the user. */
      message: string;
    };

const CONNECT_WAIT_MS = 5000;

function asRecord(value: unknown): Record<string, unknown> | null {
  const item = Array.isArray(value) ? value[0] : value;
  return item && typeof item === "object"
    ? (item as Record<string, unknown>)
    : null;
}

function offline(code: "OFFLINE" | "NETWORK"): AckResult {
  return { ok: false, reason: "offline", code, message: userMessage({ code }) };
}

function rejected(body: Record<string, unknown> | null): AckResult {
  const code = typeof body?.code === "string" ? body.code : undefined;
  return {
    ok: false,
    reason: "rejected",
    code,
    message: userMessage({ code, message: body?.message }),
  };
}

/**
 * Socket.IO queues emits while disconnected and sends them later, which would
 * run an action the user already saw fail. So nothing is emitted without a
 * live connection.
 */
export function waitForConnection(socket: AppSocket): Promise<boolean> {
  if (socket.connected) return Promise.resolve(true);
  return new Promise((resolve) => {
    const done = (ok: boolean) => {
      clearTimeout(timer);
      socket.off("connect", onConnect);
      resolve(ok);
    };
    const onConnect = () => done(true);
    const timer = setTimeout(() => done(false), CONNECT_WAIT_MS);
    socket.on("connect", onConnect);
    socket.connect();
  });
}

interface EmitAckOptions {
  timeoutMs: number;
  /** Server events that also answer this request. */
  answers?: {
    event: string;
    /** true: success, false: refused, undefined: not about this request. */
    // biome-ignore lint/suspicious/noExplicitAny: event payloads differ
    match: (data: any) => boolean | undefined;
  }[];
}

/** Emits and waits for the server's answer. Only success === true succeeds. */
export async function emitAck(
  socket: AppSocket,
  event: string,
  payload: unknown,
  { timeoutMs, answers = [] }: EmitAckOptions,
): Promise<AckResult> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return offline("OFFLINE");
  }
  if (!(await waitForConnection(socket))) return offline("NETWORK");

  // biome-ignore lint/suspicious/noExplicitAny: dynamic event names
  const raw = socket as any;
  return new Promise((resolve) => {
    const listeners = answers.map(({ event: name, match }) => {
      const handler = (data: unknown) => {
        const verdict = match(data);
        if (verdict === undefined) return;
        finish(verdict ? { ok: true, data } : rejected(asRecord(data)));
      };
      raw.on(name, handler);
      return () => raw.off(name, handler);
    });

    const finish = (result: AckResult) => {
      clearTimeout(timer);
      for (const remove of listeners) remove();
      resolve(result);
    };

    const timer = setTimeout(
      () =>
        finish({
          ok: false,
          reason: "timeout",
          code: "TIMEOUT",
          message: userMessage({ code: "TIMEOUT" }),
        }),
      timeoutMs,
    );

    raw.emit(event, payload, (res: unknown) => {
      const body = asRecord(res);
      finish(
        body?.success === true
          ? {
              ok: true,
              message:
                typeof body.message === "string" ? body.message : undefined,
              data: body.data,
            }
          : rejected(body),
      );
    });
  });
}
