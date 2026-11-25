---
kind: frontend_style
name: Tailwind v4 + shadcn/ui Design System with CSS Variables
category: frontend_style
scope:
    - '**'
source_files:
    - src/app/globals.css
    - components.json
    - postcss.config.mjs
    - src/components/ui/button.tsx
    - src/lib/utils.ts
---

The Split Ride frontend uses a modern, token-driven styling system built on Tailwind CSS v4 and the shadcn/ui component library. The approach centers on CSS custom properties (variables) for theming, class composition via `class-variance-authority` (CVA), and utility-first styling through Tailwind's new import syntax.

**Core stack:**
- **Tailwind CSS v4** — imported via `@import "tailwindcss"` in `src/app/globals.css`, using the new PostCSS plugin `@tailwindcss/postcss` instead of the legacy `tailwind.config.js` file. No `tailwind.config.*` exists; configuration lives entirely in CSS.
- **shadcn/ui** — configured via `components.json` with `style: "radix-luma"`, RSC enabled, TypeScript, CSS variables mode, base color `neutral`, and icon library `hugeicons`. Components are generated into `src/components/ui/` and aliased as `@/components/ui`.
- **class-variance-authority (CVA)** — used throughout `src/components/ui/*` to define variant-based style sets (e.g., `buttonVariants` with `variant` and `size` props).
- **clsx + tailwind-merge** — merged via a shared `cn()` helper in `src/lib/utils.ts` for safe class concatenation.
- **Radix UI primitives** — components wrap Radix primitives (`Slot.Root`, etc.) for accessibility and state management.

**Design tokens & theming:**
All visual tokens live in `src/app/globals.css` as CSS custom properties under `:root` and `.dark` selectors. Tokens cover:
- Semantic colors: `--background`, `--foreground`, `--primary`, `--secondary`, `--accent`, `--destructive`, `--muted`, `--border`, `--input`, `--ring`
- Chart palette: `--chart-1` through `--chart-5`
- Sidebar tokens: `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-border`, `--sidebar-ring`
- Typography: `--font-sans` (Outfit), `--font-serif` (Outfit), `--font-mono` (JetBrains Mono)
- Spacing/radius/shadow: `--radius`, `--shadow-*` scale, `--tracking-*` scale
- Dark mode is toggled by adding a `.dark` class on the root element; all tokens have explicit dark overrides.

Tokens are exposed to Tailwind via `@theme inline { --color-* }` blocks, mapping CSS variables to Tailwind design tokens so utilities like `bg-primary`, `text-muted-foreground`, `rounded-lg`, `shadow-md` work directly.

**Component architecture conventions:**
- Every shadcn-generated component in `src/components/ui/` follows the same pattern: CVA variants → `cn()` merge → prop forwarding via `React.forwardRef` → Radix `Slot` for `asChild`.
- Variant names are consistent across components (`variant`, `size`, sometimes `state`).
- All styling uses Tailwind utility classes; no per-component CSS files exist.
- Custom components outside `ui/` (e.g., `src/components/core/*`) compose these primitives with page-specific logic.

**Responsive strategy:**
Tailwind's default breakpoint system is used (sm/md/lg/xl/2xl). A dedicated `use-mobile.ts` hook exists for JS-side responsive checks. No custom breakpoints or media queries appear in the codebase.

**Additional notes:**
- MapLibre popup styles are overridden globally in `globals.css` via `@layer base`.
- Three external registries are registered in `components.json` (`@mapcn`, `@shark`, `@spectrumui`) for extending the component library.
- The project does not use SCSS/SASS, styled-components, emotion, or any CSS-in-JS runtime.