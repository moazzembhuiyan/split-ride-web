import { userMessage } from "@/lib/error-message";
import { getToken, recoverSession } from "@/lib/session";

export const base_api = "/api/v1";
export const base_url =
  process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3000";

export const REFRESH_URL = `${base_url}${base_api}/auth/refresh-auth`;

const READ_TIMEOUT_MS = 20000;
const WRITE_TIMEOUT_MS = 30000;
const UPLOAD_TIMEOUT_MS = 120000;

/** Error whose message is safe to show to the user. */
export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(error: { status?: number; code?: unknown; message?: unknown }) {
    super(userMessage(error));
    this.name = "ApiError";
    this.status = error.status ?? 0;
    this.code = typeof error.code === "string" ? error.code : undefined;
  }
}

/** Wrong credentials and codes also answer 401 there; not an expired session. */
function isAuthEndpoint(endpoint: string): boolean {
  return /^\/(auth|otp)\//.test(endpoint);
}

async function send(
  endpoint: string,
  init: RequestInit,
  timeoutMs: number,
  explicitToken?: string,
): Promise<Response> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw new ApiError({ code: "OFFLINE" });
  }

  const attempt = async (token: string | undefined) => {
    try {
      return await fetch(`${base_url}${base_api}${endpoint}`, {
        ...init,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(init.headers as Record<string, string>),
        },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      const timedOut =
        error instanceof DOMException && error.name === "TimeoutError";
      throw new ApiError({ code: timedOut ? "TIMEOUT" : "NETWORK" });
    }
  };

  const token = explicitToken ?? getToken();
  const res = await attempt(token);
  if (
    res.status === 401 &&
    token &&
    !explicitToken &&
    !isAuthEndpoint(endpoint) &&
    (await recoverSession(REFRESH_URL, token))
  ) {
    return attempt(getToken());
  }
  return res;
}

async function failure(res: Response): Promise<ApiError> {
  let body: { code?: unknown; errorCode?: unknown; message?: unknown } = {};
  try {
    body = (await res.json()) ?? {};
  } catch {
    // Not JSON (proxy error page): falls back to the generic message.
  }
  const code = typeof body.code === "string" ? body.code : body.errorCode;
  return new ApiError({ status: res.status, code, message: body.message });
}

interface HowlOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  token?: string;
  headers?: Record<string, string>;
}

/** JSON API calls */
export async function howl<T>(
  endpoint: string,
  { method = "GET", body, token, headers = {} }: HowlOptions = {},
): Promise<T> {
  const res = await send(
    endpoint,
    {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "include",
    },
    method === "GET" ? READ_TIMEOUT_MS : WRITE_TIMEOUT_MS,
    token,
  );

  if (!res.ok) throw await failure(res);

  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return res.json() as Promise<T>;
  }
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

interface ProwlOptions {
  method?: "POST" | "PUT" | "PATCH";
  body: FormData;
  token?: string;
  headers?: Record<string, string>;
}

/** FormData API calls */
export async function prowl<T>(
  endpoint: string,
  { method = "POST", body, token, headers = {} }: ProwlOptions,
): Promise<T> {
  const res = await send(
    endpoint,
    { method, headers: { Accept: "application/json", ...headers }, body },
    UPLOAD_TIMEOUT_MS,
    token,
  );
  if (!res.ok) throw await failure(res);
  return res.json() as Promise<T>;
}
