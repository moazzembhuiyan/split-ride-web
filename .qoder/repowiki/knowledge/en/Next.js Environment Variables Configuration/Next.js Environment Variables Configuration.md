---
kind: configuration_system
name: Next.js Environment Variables Configuration
category: configuration_system
scope:
    - '**'
source_files:
    - .env.local
    - .env.local.example
    - src/lib/api.ts
    - src/lib/firebase.ts
    - src/lib/socket.ts
    - next.config.ts
---

The application uses Next.js's built-in environment variable system with no custom configuration loader or abstraction layer. All runtime configuration is loaded directly from `process.env` at module load time across the codebase.

**Environment files and structure:**
- `.env.local` — active development/production secrets (backend URL, Google Maps API key, Firebase credentials)
- `.env.local.example` — template showing all required variables for new developers
- No `.env.development`, `.env.production`, or other Next.js environment file variants are used

**Configuration categories and their consumers:**

1. **Backend connectivity** (`src/lib/api.ts`, `src/lib/socket.ts`):
   - `NEXT_PUBLIC_SERVER_URL` — base backend URL (with fallback to `http://localhost:3000`)
   - `NEXT_PUBLIC_SOCKET_URL` — Socket.IO server URL (falls back to `NEXT_PUBLIC_SERVER_URL` if unset)
   - The API client composes these into `${base_url}${base_api}/...` where `base_api = "/api/v1"`

2. **Firebase services** (`src/lib/firebase.ts`):
   - `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`, `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
   - Config object is constructed inline and passed to `initializeApp()`

3. **Google Maps** (`src/lib/location-picker.tsx` via `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)

4. **Build-time configuration** (`next.config.ts`):
   - Hardcoded `images.remotePatterns` allowlist for external image hosts
   - `serverExternalPackages` excludes Firebase packages from bundling
   - Turbopack enabled via empty config object

**Key conventions and constraints:**
- All variables consumed by the browser bundle must be prefixed with `NEXT_PUBLIC_` (enforced by Next.js build) — there is no separation between server-only and client-facing env vars in this repo
- No validation, schema enforcement, or default-value orchestration beyond simple nullish coalescing (`??`) fallbacks
- No centralized config module; each feature reads its own `process.env.*` values directly
- No feature flags, environment-specific overrides, or secret rotation mechanism
- Token-based auth is handled via cookies (`token=`), not env vars, and is read at request time from `document.cookie`