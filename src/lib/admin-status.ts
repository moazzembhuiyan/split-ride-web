const STATUSES = new Set([
  "active",
  "inactive",
  "pending",
  "blocked",
  "scheduled",
  "accepted",
  "started",
  "running",
  "completed",
  "cancelled",
  "paid",
  "unpaid",
  "authorized",
  "refunded",
  "replied",
  "resolved",
  "private",
  "split",
  "user",
  "provider",
  "admin",
]);

/** Translated label of an API status, ride type or role; unknown ones as sent. */
export function statusText(
  t: (key: string) => string,
  value: string | null | undefined,
): string {
  if (!value) return "—";
  return STATUSES.has(value) ? t(`admin.status.${value}`) : value;
}
