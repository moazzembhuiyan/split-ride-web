---
kind: logging_system
name: No Centralized Logging System
category: logging_system
scope:
    - '**'
---

This repository does not implement a centralized logging system. There is no dedicated logger library (e.g., pino, winston, bunyan, next-logger), no log configuration file, and no shared logging utility in `src/lib/` or elsewhere. All output goes directly to the browser console via bare `console.log`, `console.error`, and `console.warn` calls scattered across components and pages — for example in `src/app/driver/(view)/user-accept.tsx`, `src/components/core/location-picker.tsx`, `src/lib/socket.ts`, and various page files. The socket client uses colorized `console.log` markers (`%c[socket ⇐ recv]`, `%c[socket ⇒ emit]`) for debugging, but this is ad-hoc rather than part of a structured logging strategy. No log levels, sinks, or routing are configured; there is no server-side logging either (no Next.js middleware logging, no API route loggers). This category does not apply to this codebase.