---
kind: error_handling
name: Frontend Error Handling with Sonner Toasts and TanStack Query
category: error_handling
scope:
    - '**'
source_files:
    - src/lib/api.ts
    - src/types/base.ts
    - src/hooks/auth/use-social-auth.ts
---

This Next.js application uses a lightweight, client-side error handling approach centered around three layers: HTTP error wrapping, React Query mutation callbacks, and user-facing toast notifications.

**HTTP layer — `src/lib/api.ts`**
The `howl()` and `prowl()` wrappers normalize all fetch responses. On non-`res.ok`, they attempt to parse an `{ message }` field from the response body and throw a plain `Error` with that message; otherwise they fall back to `"Request failed"`. This is the single place where network errors are surfaced as thrown `Error` objects.

**Business-layer hooks — `src/hooks/*`**
Most mutations are built with `@tanstack/react-query`'s `useMutation`. Callers pass `onSuccess` / `onError` handlers directly in the `mutate()` call (e.g. `use-social-auth.ts`, `admin/delete-account/page.tsx`). There is no global `onError` hook configured at the query client level, so each hook decides how to surface failures.

**User feedback — Sonner toasts**
Errors bubble up to UI code, which consistently calls `toast.error(...)` from the `sonner` package to display messages. The pattern is uniform:
- `onError(err) { toast.error(err.message); }` for API-driven mutations,
- `catch (err) { toast.error(err instanceof Error ? err.message : "...") }` for synchronous try/catch blocks,
- Fallback strings like `"Google sign-in failed"` when the error has no `.message`.

**Response shape — `src/types/base.ts`**
Server responses follow a simple `{ status: boolean, message: string, data: T }` contract (`ApiResponse<T>`). Business logic treats `status === false` or missing `data` as failure and surfaces `message` via toast.

**What is NOT present**
- No custom `Error` subclasses or sentinel error codes.
- No server-side middleware or Next.js `error.ts`/`global-error.ts` boundary components.
- No centralized error logger or analytics integration.
- No `panic`/`recover` equivalent (not applicable to JS).

**Conventions developers should follow**
1. Throw plain `Error` objects from service/API helpers; never swallow them silently.
2. In `useMutation` callers, always provide an `onError` handler that renders `toast.error(err.message)`.
3. For direct `try/catch` blocks, wrap the caught value with `err instanceof Error ? err.message : "fallback"` before passing to `toast.error`.
4. Treat `ApiResponse.status === false` as a business error and show `response.message` to the user.