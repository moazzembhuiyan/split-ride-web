import type { Notification } from "@/types/notification.types";

function str(
  ...values: Array<string | undefined | null>
): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function isNewRequestType(type: string | undefined): boolean {
  if (!type) return false;
  const t = type.toLowerCase();
  return (
    t.includes("new-request") ||
    t.includes("new_request") ||
    t.includes("ride-request") ||
    t.includes("ride_request") ||
    t === "request"
  );
}

/** Opens a profile dialog of the navbar instead of a page. */
export const PANEL_PREFIX = "#panel:";

type Target = "chat" | "wallet" | "kyc" | "home" | "request" | "ride";

const TARGETS: [RegExp, Target][] = [
  [/chat|message|conversation/, "chat"],
  [/new[-_ ]?request|ride[-_ ]?request|^request$/, "request"],
  [/wallet|refund|payment|earning|payout|withdraw/, "wallet"],
  [/kyc/, "kyc"],
  [/^home$/, "home"],
  [/ride|booking|trip/, "ride"],
];

function targetOf(value: string | undefined): Target | undefined {
  const text = value?.toLowerCase();
  if (!text) return undefined;
  return TARGETS.find(([pattern]) => pattern.test(text))?.[1];
}

export function notificationHref(
  notif: Notification,
  role: "driver" | "passenger" | "admin" = "passenger",
  options: { rideInProgress?: boolean } = {},
): string | undefined {
  const rideId = str(
    notif.rideId,
    notif.data?.rideId,
    notif.payload?.rideId,
    notif.data?.ride,
    notif.payload?.ride,
  );
  const bookingId = str(
    notif.booking,
    notif.bookingId,
    notif.data?.bookingId,
    notif.payload?.bookingId,
    notif.data?.booking,
    notif.payload?.booking,
  );
  const type = str(notif.type, notif.data?.type, notif.payload?.type);
  const passengerId = str(notif.data?.passengerId, notif.payload?.passengerId);
  const screen = str(notif.screen, notif.data?.screen, notif.payload?.screen);
  const chatId = str(
    notif.chatId,
    notif.data?.chatId,
    notif.payload?.chatId,
    notif.data?.chat,
    notif.payload?.chat,
  );
  // The screen decides, then the type.
  const target = targetOf(screen) ?? targetOf(type);

  if (role === "admin") {
    if (bookingId || rideId) return `/admin/bookings`;
    return undefined;
  }
  if (role === "driver") {
    if (isNewRequestType(type) || target === "request") {
      // Never takes the driver away from a ride in progress.
      return options.rideInProgress ? undefined : "/driver";
    }
    if (target === "chat") {
      return chatId ? `/message?chat=${encodeURIComponent(chatId)}` : "/message";
    }
    if (target === "wallet") return "/driver/my-payments";
    if (target === "kyc" || target === "home") return "/driver";
    if (rideId) return `/driver/my-rides/${rideId}`;
    if (bookingId) return "/driver/my-rides";
    return "/driver";
  }
  if (target === "chat") {
    return chatId ? `/message?chat=${encodeURIComponent(chatId)}` : "/message";
  }
  if (target === "wallet") return `${PANEL_PREFIX}/refund`;
  if (passengerId && target !== "kyc") return `/my-rides/${passengerId}`;
  if (rideId) return `/my-rides/${rideId}`;
  if (bookingId || target === "ride") return "/my-rides";
  if (target === "home") return "/book";
  return undefined;
}
