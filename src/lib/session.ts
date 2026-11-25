import { toast } from "sonner";
import { translate } from "@/i18n/translate";

const TOKEN_MAX_AGE = 60 * 60 * 24 * 7;
const REFRESH_KEY = "split-ride:refresh-token";

/** Fired on login and token refresh so the socket can re-authenticate. */
export const SESSION_CHANGED = "split-ride:session-changed";

let ending = false;

export function getToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  return (
    document.cookie
      .split("; ")
      .find((r) => r.startsWith("token="))
      ?.split("=")[1] || undefined
  );
}

function getRefreshToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem(REFRESH_KEY) ?? undefined;
}

export function saveSession(tokens: {
  accessToken?: string;
  refreshToken?: string;
}): void {
  if (!tokens.accessToken) return;
  ending = false;
  document.cookie = `token=${tokens.accessToken};path=/;max-age=${TOKEN_MAX_AGE};SameSite=Lax`;
  if (tokens.refreshToken) {
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  }
  window.dispatchEvent(new Event(SESSION_CHANGED));
}

export function clearSession(): void {
  document.cookie = "token=;path=/;max-age=0;SameSite=Lax";
  localStorage.removeItem(REFRESH_KEY);
}

/** Marks the session as ending, so late 401s do not report it as expired. */
export function beginLogout(): void {
  ending = true;
}

function decode(token: string | undefined): Record<string, unknown> | null {
  try {
    const part = token?.split(".")[1];
    if (!part) return null;
    return JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string | undefined): boolean {
  const exp = decode(token)?.exp;
  return typeof exp === "number" && exp * 1000 <= Date.now();
}

export function loginPath(token = getToken()): string {
  const admin =
    decode(token)?.role === "admin" ||
    window.location.pathname.startsWith("/admin");
  return admin ? "/admin/auth/login" : "/";
}

/** Signs out after the server rejected the session. Runs once. */
export function expireSession(): void {
  if (ending || typeof window === "undefined") return;
  ending = true;
  const target = loginPath();
  clearSession();
  toast.error(translate("error.sessionExpired"));
  window.setTimeout(() => window.location.assign(target), 1200);
}

export type RefreshResult =
  /** A valid token is in place. */
  | "refreshed"
  /** The server refused the refresh token: the session is over. */
  | "rejected"
  /** No refresh token is stored (signed in before refresh was supported). */
  | "unavailable"
  /** Network or server failure: says nothing about the session. */
  | "failed";

async function requestRefresh(
  refreshUrl: string,
  staleToken: string | undefined,
): Promise<RefreshResult> {
  // Another tab may have refreshed while this one waited for the lock.
  const current = getToken();
  if (current && current !== staleToken) return "refreshed";

  const refreshToken = getRefreshToken();
  if (!refreshToken) return "unavailable";

  try {
    const res = await fetch(refreshUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
      credentials: "include",
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 401) return "rejected";
    if (!res.ok) return "failed";
    const body = await res.json();
    const tokens = body?.data ?? body;
    if (typeof tokens?.accessToken !== "string") return "failed";
    saveSession(tokens);
    return "refreshed";
  } catch {
    return "failed";
  }
}

let refreshing: Promise<RefreshResult> | null = null;

/** Refreshes the token; simultaneous callers share one request. */
export function refreshSession(
  refreshUrl: string,
  staleToken: string | undefined,
): Promise<RefreshResult> {
  if (ending) return Promise.resolve("failed");
  refreshing ??= (async () => {
    const run = () => requestRefresh(refreshUrl, staleToken);
    return navigator.locks
      ? await navigator.locks.request("split-ride:refresh", run)
      : await run();
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

/**
 * Handles a rejected token. Returns true when the caller may try again.
 * Signs out only if the refresh itself was rejected, or if the token is past
 * its expiry and cannot be refreshed.
 */
export async function recoverSession(
  refreshUrl: string,
  staleToken: string | undefined,
): Promise<boolean> {
  const result = await refreshSession(refreshUrl, staleToken);
  if (result === "refreshed") return true;
  if (
    result === "rejected" ||
    (result === "unavailable" && isTokenExpired(staleToken))
  ) {
    expireSession();
  }
  return false;
}
