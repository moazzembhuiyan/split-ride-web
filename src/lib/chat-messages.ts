import type { Message } from "@/types/chat.types";

function timeOf(message: Message): number {
  const value = message.createdAt ?? message.sentAt;
  const ms = value ? new Date(value).getTime() : Number.NaN;
  return Number.isFinite(ms) ? ms : 0;
}

/**
 * Oldest first. A history that was loaded while a live message arrived must
 * not drop it, so both lists are combined; the server's copy wins.
 */
export function mergeMessages(
  current: Message[],
  incoming: Message[],
): Message[] {
  const byId = new Map<string, Message>();
  for (const message of current) byId.set(message._id, message);
  for (const message of incoming) byId.set(message._id, message);
  return [...byId.values()].sort(
    (a, b) => timeOf(a) - timeOf(b) || a._id.localeCompare(b._id),
  );
}
