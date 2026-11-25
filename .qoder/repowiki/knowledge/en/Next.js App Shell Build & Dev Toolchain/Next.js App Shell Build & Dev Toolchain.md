---
kind: build_system
name: Next.js App Shell Build & Dev Toolchain
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - next.config.ts
    - tsconfig.json
    - postcss.config.mjs
    - components.json
    - biome.json
---

The project uses a standard Next.js 16 application build pipeline with no custom Makefiles, Dockerfiles, or CI scripts at the repository root. The entire build system is defined through the following configuration files:

**Core build commands** (`package.json`):
- `next dev` — development server (uses Turbopack via `next.config.ts`)
- `next build` — production build output to `.next/`
- `next start` — serve the built app in production mode
- `biome check` / `biome format --write` — linting and formatting

**TypeScript compilation** (`tsconfig.json`):
- Target: ES2017, module: esnext with bundler resolution
- Strict mode enabled, no emit (Next.js handles compilation)
- Path alias `@/*` → `./src/*`
- Incremental builds enabled, Next.js plugin included

**Styling pipeline** (`postcss.config.mjs`, `components.json`):
- Tailwind CSS v4 via `@tailwindcss/postcss` plugin
- shadcn/ui configured with Radix primitives, Hugeicons, and multiple registries (`@mapcn`, `@shark`, `@spectrumui`)
- CSS variables enabled, neutral base color

**Build-time optimizations** (`next.config.ts`):
- Remote image domains whitelisted (placehold.co, dicebear.com, AWS S3 patterns)
- Firebase packages externalized for server-side (`serverExternalPackages`)
- Turbopack enabled for faster builds

**Package management**: Both `package-lock.json` and `bun.lock` are present alongside `ignoreScripts` and `trustedDependencies` entries for sharp/unrs-resolver, indicating compatibility with both npm and Bun runtimes.

No containerization, deployment automation, or CI/CD configuration was found in the repository.