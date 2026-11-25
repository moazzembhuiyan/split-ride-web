# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

Use **bun**. `package-lock.json` is stale (missing tiptap, react-pdf, formepdf, dompurify, use-debounce), so don't use `npm ci`; `bun.lock` is the live lockfile.

```bash
bun install                  # required before the Next docs in node_modules/next/dist/docs exist
bun run dev
bun run build
bun run lint                 # biome check (lint + format + import order)
bun run format               # biome format --write
bunx biome check <path>      # check a single file; add --write to fix
bunx tsc --noEmit            # no typecheck script is defined
```

There is no test framework or CI config in this repo.

Env vars are all `NEXT_PUBLIC_*` in a gitignored `.env`: `SERVER_URL` (no trailing slash), `SOCKET_URL`, `GOOGLE_MAPS_API_KEY`, `FIREBASE_*` (incl. `FIREBASE_VAPID_KEY`), `STRIPE_PUBLISHABLE_KEY`. `public/firebase-messaging-sw.js` can't read env and hardcodes its Firebase config, so keep it matched to `.env`.

## What this is

Frontend only for Split Ride, a ride-sharing app limited to Cyprus (prices in €). The backend is separate (REST + Socket.IO, MongoDB ids). There are no Next API routes or server actions, and nearly every page is a client component. `Ride Share-postman-collection.json` is the backend API reference.

## Roles and routing

Backend roles are `user` (passenger), `provider` (driver) and `admin`. UI text says "driver", but the role string is `provider`.

| Role | Routes |
|---|---|
| `user` | `src/app/(view)/*` (`/book`, `/my-rides`) and any route not listed below |
| `provider` | `src/app/driver/*` |
| `admin` | `src/app/admin/*`, login at `/admin/auth/login` |
| shared | `/message` (any logged-in role), `/terms` (public), `/help` and `/support` (providers are redirected to `/driver/help`) |

Passenger and driver login is `/` itself (renders `src/app/auth/_login`). `src/proxy.ts` (Next 16's replacement for `middleware.ts`) does the gating by decoding, **not verifying**, the JWT, so it is navigation UX rather than a security boundary. New public or shared routes must be added there or they are redirected.

The JWT lives in a JS-readable `token` cookie, which `lib/api.ts` and `lib/socket.ts` read directly from `document.cookie`. Both return no token on the server, so authenticated fetches only work client-side.

## REST layer

`src/services/*.service.ts` (plain fetch) → `src/hooks/<domain>/use-*.ts` (TanStack Query) → page. Types are in `src/types/*.types.ts`.

- `howl<T>()` is for JSON and `prowl<T>()` for FormData uploads. Both prefix `NEXT_PUBLIC_SERVER_URL + /api/v1` and throw `Error(message)` from the response body; callers show it with a sonner `toast`.
- They return the **whole envelope**, so data is `query.data?.data`. Envelopes vary (`ApiResponse`, `PagedResponse`, `Paginator`, and sometimes doubly nested `data.data`).
- Query hook files export a `xxxKeys` query-key factory; use it (or its prefix) when invalidating.
- `driver.service.ts` holds vehicle, KYC, Stripe Connect and withdraw services; `payment.service.ts` also holds saved cards.
- The backend contract contains misspellings (`/payments/refound-payment`, the `userTramsAndCondition` setting key). Don't correct them.

Backend payloads are inconsistently shaped (ids as string, `_id`, `id` or `$oid`; wrapped or unwrapped). Use the existing normalizers: `unwrapSocketAck` (`lib/ride-socket.ts`), `normalizeNewRideRequest` / `parseRideRequestList`, `unwrapPassengers` (`lib/split-settlement.ts`) and `isBookingPaid` / `isPaymentSecured` (`lib/is-booking-paid.ts`).

## Socket layer

Ride lifecycle actions (request, join, accept, trip progress, cancel, fare quote) go over Socket.IO with ack callbacks, not REST.

- `lib/socket.ts` is a singleton; `provider/socket-provider.tsx` connects it and rejoins the persisted `activeRideId` room (`ride-session-store`, localStorage) on every connect.
- Adding a server event means updating `ServerToClientEvents` in `types/socket.types.ts` **and** `ALL_EVENTS` in `socket-provider.tsx`. Global toasts are in `provider/notification-bridge.tsx`.
- There are **two different `useSocketEvent` hooks**: `@/hooks/shared/use-socket` takes a handler and fires per event; `@/store/socket-store` takes only the event name and returns the latest `{ data, at }`.
- Server acks may never arrive, so the helpers in `lib/` wrap emits in timeouts.
- `driver/driver-provider.tsx` runs across all `/driver` pages: GPS tracking, re-announcing online status on reconnect, and the request inbox in `driver-store` (socket events, reconciled against REST).

## Booking and payment flow

`/book` (route, date) → `/book/pin` (map picker, optional) → `/book/info` (seats, fare preview) → `/book/select` (preview → payment → status). `/book/[id]` is the booking detail page, reached from `/my-rides`, and can also take payment.

1. The draft lives in `booking-store` (sessionStorage, `skipHydration`). `book/layout.tsx` rehydrates it, so check `hasHydrated` before redirecting on missing data.
2. `intent` selects the mode: `find` emits `ride:join-split-ride`; `start` and `private` emit `ride:request`.
3. Fares: `quoteRideFare` asks the server over the socket and falls back to `lib/estimate-fare.ts`. Rates and booking/refund windows come from admin general settings, read with `settingsMap` / `settingNumber` in `lib/general-settings.ts`.
4. `bookingId` may not be in the ack; `/book/select` polls `/passenger/:id` for it.
5. `chargeBooking` (`lib/pay-booking.ts`): checkout → Stripe confirm → backend confirm. Stripe uses **manual capture**, so `requires_capture` / `authorized` counts as paid.
6. `lib/pending-payment.ts` (sessionStorage) lets an interrupted payment resume.

For split rides the first passenger pays the full fare; the matching fee (`splitRideMatchedSurchargePercent`, `…Percent3` for three riders) and refunds apply only once a second party joins. `lib/split-settlement.ts` is a display estimate, and refund/surcharge amounts recorded by the API take precedence.

## Maps

Rendering uses MapLibre via `components/ui/map.tsx`; Google Maps is used only for places autocomplete and directions. Map coordinates and backend `coordinates` arrays are `[lng, lat]`, while Google and request payloads use `{ lat, lng }`. Cyprus bounds are in `lib/cyprus.ts`.

## UI and i18n

- shadcn (`radix-luma` style, Tailwind v4, theme in `src/app/globals.css`), Hugeicons as the configured icon library.
- Text goes through `useT()` (`@/i18n`), client-only. Dictionaries are flat dotted keys; a missing key renders as the key itself with **no English fallback**, so add new keys to all 12 files in `src/i18n/dictionaries`. `ar` and `ur` are RTL.

## Stale or mock code

- `API-INTEGRATION.md`: the endpoint-to-hook map is useful, but the status column was never updated, some paths have changed, and the base URL is wrong (`/api/v1` is correct).
- Static mockups not linked from the live flow: `book/confirm`, `book/address` (with `book/form.tsx` and `book/find.tsx`), `driver/(view)/confirm`. `book/matching` only redirects. `driver/(view)/find.tsx`, by contrast, is live.
- `check_changes.ps1` has a hardcoded path from another machine. `.qoder/repowiki` is generated documentation; trust the code over it.
