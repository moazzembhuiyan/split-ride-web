---
kind: dependency_management
name: Bun-managed Next.js dependency tree with lockfile and trusted scripts
category: dependency_management
scope:
    - '**'
source_files:
    - package.json
    - bun.lock
---

This repository manages Node.js dependencies for a Next.js 16 + React 19 application using **Bun** as the package manager. The manifest is declared in `package.json` and the resolved, reproducible install graph is captured in `bun.lock`. A secondary `package-lock.json` also exists at the root (likely from prior npm usage) but is not the active lockfile — Bun reads `bun.lock` by default.

### What system/approach is used
- **Package manager**: Bun (`bun install`, `bun add`, etc.)
- **Lockfile**: `bun.lock` (lockfileVersion 1), committed to version control so installs are deterministic across machines and CI.
- **Runtime framework**: Next.js 16 with React 19; all app code depends on these via `dependencies`.
- **Build tooling**: Biome (`@biomejs/biome`) for lint/format, Tailwind v4 + PostCSS for styling, TypeScript for type-checking.
- **No vendoring**: Dependencies are installed into `node_modules`; nothing is vendored into source.
- **Private registries / GOPRIVATE**: Not applicable — this is a JavaScript/TypeScript project, not Go.

### Key files and packages
- `package.json` — single-source-of-truth for dependency declarations, devDependencies, and scripts (`dev`, `build`, `start`, `lint`, `format`).
- `bun.lock` — full transitive-resolution lockfile that pins every package version and integrity hash.
- `next.config.ts`, `postcss.config.mjs`, `tsconfig.json`, `biome.json`, `components.json` — configuration files consumed by the dependency ecosystem (Next, Tailwind, TypeScript, Biome, shadcn).

Notable runtime dependency groups:
- UI primitives: `radix-ui`, `@ark-ui/react`, `@base-ui/react`, `shadcn`, `tailwind-merge`, `class-variance-authority`, `clsx`, `sonner`, `vaul`, `input-otp`.
- Data/state: `@tanstack/react-query`, `zustand`, `react-cookie`.
- Maps & media: `maplibre-gl`, `@googlemaps/js-api-loader`, `lucide-react`, `react-icons`, `@hugeicons/*`.
- Backend integrations: `firebase` (auth, firestore, messaging), `socket.io-client`.
- Dev tooling: `@biomejs/biome`, `tailwindcss` v4, `@tailwindcss/postcss`, `typescript`, `@types/*`.

### Architecture and conventions
- **Single workspace**: No workspaces or monorepo layout — one `package.json` at the repo root governs all dependencies.
- **Version strategy**: Mix of caret ranges (`^`) for most libraries and exact pinning for core platform packages (`next` 16.2.6, `react` 19.2.4, `react-dom` 19.2.4, `@biomejs/biome` 2.2.0). This keeps the app shell tightly pinned while allowing minor/patch bumps in third-party UI libs.
- **Dev vs. runtime split**: All build-time tools (Biome, Tailwind, TypeScript, types) live under `devDependencies`; only runtime-facing packages go under `dependencies`.
- **Native module safety**: `sharp` and `unrs-resolver` are listed under both `ignoreScripts` and `trustedDependencies`, telling Bun to skip their postinstall scripts during normal installs while still allowing them when explicitly trusted. `@firebase/util` is also trusted, likely because it ships native bindings.
- **No private registry config**: There is no `.npmrc`, `.yarnrc`, or `bunfig.toml` visible in the tree, so packages resolve from the public npm registry.

### Rules developers should follow
1. **Always use Bun** — run `bun install` / `bun add <pkg>` / `bun remove <pkg>`. Do not use npm/yarn/pnpm, which would regenerate `package-lock.json` and diverge from `bun.lock`.
2. **Commit `bun.lock`** — after adding/removing dependencies, commit the updated lockfile so CI and teammates get identical trees.
3. **Pin core platform versions** — keep `next`, `react`, `react-dom`, and `@biomejs/biome` pinned to exact versions (as they already are) to avoid subtle runtime mismatches.
4. **Use caret ranges for third-party libs** — prefer `^x.y.z` for UI/data libs so patch/minor updates flow automatically, unless a breaking change is required.
5. **Keep build tooling in `devDependencies`** — anything needed only at build/lint time belongs there.
6. **Be deliberate with native modules** — if a new dependency ships native binaries or postinstall scripts, add it to `trustedDependencies` (and optionally `ignoreScripts`) in `package.json` to keep installs fast and predictable.
7. **Do not vendor** — do not copy `node_modules` into source; rely on the lockfile for reproducibility.