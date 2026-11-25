import { translate } from "@/i18n/translate";

const CODE_KEYS: Record<string, string> = {
  OFFLINE: "error.offline",
  NETWORK: "error.network",
  TIMEOUT: "error.timeout",
  UNAUTHORIZED: "error.sessionExpired",
  INVALID_TOKEN: "error.sessionExpired",
  TOKEN_EXPIRED: "error.sessionExpired",
  CANNOT_CANCEL_AFTER_PICKUP: "error.cannotCancelAfterPickup",
  DRIVER_BUSY: "error.driverBusy",
  PICKUP_REQUIRED: "error.pickupRequired",
  OTP_REQUIRED: "error.otpRequired",
};

/**
 * INVALID_OTP covers a wrong, an expired and a locked code; only the server's
 * message tells them apart.
 */
function codeKey(code: string, message: string): string | undefined {
  if (CODE_KEYS[code]) return CODE_KEYS[code];
  if (!/OTP/.test(code)) return undefined;
  if (
    /LOCK|TOO_MANY/.test(code) ||
    /locked|too many|max(imum)? (number of )?attempts|exceeded/i.test(message)
  ) {
    return "error.otpLocked";
  }
  if (/EXPIRED/.test(code) || /expired|request a new|no otp/i.test(message)) {
    return "error.otpExpired";
  }
  return "error.otpInvalid";
}

/** Codes whose message carries a value only the server knows (e.g. HH:MM). */
const SERVER_TEXT_CODE = /EARLY|WINDOW|NOTICE|SOON/;
const SERVER_TEXT = /you can start from \d{1,2}:\d{2}/i;

const RAW_TEXT =
  /cast to |e11000|econn|mongo|objectid|cannot (read|set) |is not (a function|defined)|undefined|validation failed|unexpected token|<!?(doctype|html)|\bat .+:\d+:\d+|\bjwt\b|^\s*[{[]/i;

function isReadable(message: string): boolean {
  return message.length <= 200 && !RAW_TEXT.test(message);
}

/**
 * Text that may be shown to a user. A known code has its own translation, an
 * unknown code a generic one. Without a code the server's text is kept unless
 * it is raw technical output.
 */
export function userMessage(error: {
  code?: unknown;
  message?: unknown;
}): string {
  const message = typeof error.message === "string" ? error.message.trim() : "";
  const code = typeof error.code === "string" ? error.code : "";
  const usable = message !== "" && isReadable(message);

  if (usable && SERVER_TEXT.test(message)) return message;
  if (code) {
    const key = codeKey(code, message);
    if (key) return translate(key);
    return usable && SERVER_TEXT_CODE.test(code)
      ? message
      : translate("error.generic");
  }
  return usable ? message : translate("error.generic");
}
