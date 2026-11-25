# Split Ride

A ride-sharing web app for Cyprus where passengers can book a private ride or **split a ride** with other travellers on the same route and share the fare. Prices are in euro (€).

This repository is the **frontend only**. It talks to a separate backend over REST and Socket.IO.

## Features

**Passengers**
- Sign in with phone/OTP, and register
- Book a ride by route and date, with an optional map pin picker and seat selection
- Three modes: find a split ride to join, start a split ride, or book a private ride
- Live fare quotes from the server, with a local estimate as a fallback
- Card payments through Stripe with manual capture and saved cards
- Booking history, ride detail, cancellation and refunds
- In-app chat, push notifications, help and support

**Drivers (providers)**
- Vehicle and KYC onboarding, and Stripe Connect payouts
- Online/offline status, live GPS tracking, and a real-time ride request inbox
- Accept rides and update trip progress
- Earnings, payments and withdrawal requests

**Admins**
- Dashboard with charts
- Manage users, drivers, bookings and transactions
- Approve withdrawal requests
- General settings, such as fare rates, split-ride fees and booking/refund windows
- FAQ, support, and terms editor (rich text)

**General**
- 12 languages (en, ar, de, el, es, fr, hi, it, ja, ru, ur, zh), including right-to-left for Arabic and Urdu
- Light/dark theme
- Maps restricted to Cyprus

## Tech stack

| Area | Tools |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling/UI | Tailwind CSS v4, shadcn (radix-luma), Base UI, Hugeicons, Motion |
| Data | TanStack Query, Zustand |
| Realtime | Socket.IO client, Firebase Cloud Messaging |
| Payments | Stripe (`@stripe/react-stripe-js`) |
| Maps | MapLibre GL, Google Maps (places autocomplete and directions) |
| Forms/validation | Zod, react-phone-number-input, input-otp |
| Documents | react-pdf, Forme PDF, Tiptap |
| Tooling | Bun, Biome |

## Getting started

### Prerequisites
- [Bun](https://bun.sh)
- A running Split Ride backend (REST and Socket.IO). The endpoints are described in `Ride Share-postman-collection.json`.

### Install and run

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

> Use `bun`, not `npm ci`. `bun.lock` is the live lockfile and `package-lock.json` is out of date.

### Environment variables

Create a `.env` file in the project root:

```env
NEXT_PUBLIC_SERVER_URL=           # backend base URL, no trailing slash
NEXT_PUBLIC_SOCKET_URL=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
```

`public/firebase-messaging-sw.js` cannot read env vars, so its Firebase config is hardcoded. Keep it in sync with `.env`.

### Scripts

| Command | What it does |
|---|---|
| `bun run dev` | Start the dev server |
| `bun run build` | Production build |
| `bun run start` | Serve the production build |
| `bun run lint` | Biome lint, format and import-order check |
| `bun run format` | Format with Biome |
| `bunx tsc --noEmit` | Type check |

There is no test suite yet.

## Project structure

```
src/
  app/
    (view)/     passenger pages: /book, /my-rides, /help, /support, /terms
    driver/     driver (provider) pages
    admin/      admin panel, login at /admin/auth/login
    auth/       login and register
    message/    chat (shared by all roles)
  components/   UI, booking and core components
  hooks/        TanStack Query hooks by domain
  services/     REST service functions
  lib/          API client, socket, fare, payment and settlement helpers
  provider/     socket, notification and app providers
  store/        Zustand stores
  types/        API and socket types
  i18n/         translations
```

## How it works

### Roles and routing
There are three roles: `user` (passenger), `provider` (driver) and `admin`. `src/proxy.ts` redirects each role to its own area by reading the JWT from the `token` cookie. This is navigation only, not a security boundary, because the token is not verified there.

### Data flow
`services/*.service.ts` (fetch) → `hooks/*/use-*.ts` (TanStack Query) → pages.

### Real-time
Ride lifecycle actions (request, join, accept, trip progress, cancel, fare quote) go over Socket.IO with ack callbacks. A singleton socket reconnects and rejoins the active ride room automatically.

### Booking and payment
1. `/book`: choose route and date.
2. `/book/pin`: optional map pin.
3. `/book/info`: seats and fare preview.
4. `/book/select`: preview, payment, then status.

Payment is checkout → Stripe confirm → backend confirm. Stripe uses manual capture, so an authorized payment counts as paid. For split rides, the first passenger pays the full fare. A matching fee and refunds apply only once another passenger joins.

## Contributing

Run `bun run lint` and `bunx tsc --noEmit` before opening a pull request. New UI text must be added to all 12 dictionaries in `src/i18n/dictionaries`. A missing key renders as the key itself, with no English fallback.

See [CLAUDE.md](CLAUDE.md) for more detailed architecture notes.
