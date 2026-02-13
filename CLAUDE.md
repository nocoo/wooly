# Wooly — Project Intelligence

## Overview

**Wooly** is a Next.js dashboard application that inherits the full UI design system from the **basalt** template project (a Vite + React SPA at `/Users/nocoo/workspace/personal/basalt`). The primary brand color is **Magenta** (`HSL 320 70% 55%`).

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript | 5.9.3 |
| UI Library | React | 19.2.4 |
| Styling | Tailwind CSS v4 (via `@tailwindcss/postcss`) | 4.1.18 |
| Component Library | shadcn/ui (Radix UI primitives) | — |
| Icons | lucide-react | 0.563.0 |
| Toast | sonner | 1.7.4 |
| Command Palette | cmdk | 1.1.1 |
| Package Manager | bun | 1.3.6 |
| Unit Testing | Vitest + @testing-library/react + jsdom | 4.0.18 |
| Coverage | @vitest/coverage-v8 (90% threshold) | 4.0.18 |
| Linting | ESLint + eslint-config-next (core-web-vitals + typescript) | 9.32.0 |
| Git Hooks | Husky (pre-commit: test, pre-push: test + lint) | 9.1.7 |

## Key Commands

```bash
bun run dev          # Start dev server on port 7018 (Turbopack)
bun run build        # Production build
bun run start        # Production server on port 7018
bun run test         # Run Vitest (single run)
bun run test:watch   # Run Vitest in watch mode
bun run test:coverage # Run Vitest with v8 coverage report
bun run lint         # ESLint
```

## Architecture

### Directory Structure

```
src/
  app/                    # Next.js App Router
    globals.css           # ALL design tokens (Tailwind v4 @theme, CSS variables)
    layout.tsx            # Root layout (fonts, providers, DashboardLayout, Toaster)
    page.tsx              # Dashboard home page
  components/
    ui/                   # shadcn/ui primitives (9 components)
      avatar.tsx
      card.tsx
      collapsible.tsx
      command.tsx          # Command palette (cmdk)
      dialog.tsx
      input.tsx
      separator.tsx
      sonner.tsx           # Toast notifications
      tooltip.tsx
    AppSidebar.tsx         # Collapsible sidebar with nav groups, search (Cmd+K), user footer
    DashboardLayout.tsx    # Main shell: sidebar + header + content area
    ThemeToggle.tsx        # Light/Dark/System theme cycler
  hooks/
    use-mobile.ts          # useIsMobile() — useSyncExternalStore based
  lib/
    utils.ts               # cn() helper (clsx + tailwind-merge)
    palette.ts             # Chart color constants, withAlpha(), CHART_COLORS array
  test/
    setup.ts               # Vitest setup (jest-dom matchers)
```

### Config Files (Project Root)

| File | Purpose |
|---|---|
| `package.json` | Dependencies, scripts (port 7018), bun packageManager |
| `tsconfig.json` | TypeScript config, `@/*` path alias to `./src/*` |
| `next.config.ts` | Next.js config (minimal) |
| `postcss.config.mjs` | Tailwind CSS v4 via `@tailwindcss/postcss` |
| `eslint.config.mjs` | ESLint flat config (next core-web-vitals + typescript) |
| `vitest.config.ts` | Vitest with jsdom, react-swc plugin, v8 coverage (90%) |
| `components.json` | shadcn/ui config (aliases, style, RSC enabled) |
| `.husky/pre-commit` | Runs `bun run test` |
| `.husky/pre-push` | Runs `bun run test && bun run lint` |

### Design System (inherited from basalt)

The entire design token system lives in `src/app/globals.css`. No `tailwind.config.js` — Tailwind CSS v4 uses `@theme inline` blocks.

**3-Layer Background System:**
- **L0** (body): `--background` — light `220 14% 94%` / dark `0 0% 9%`
- **L1** (content panel): `--card` — light `220 14% 97%` / dark `0 0% 10.6%`
- **L2** (inner cards): `--secondary` — light `0 0% 100%` / dark `0 0% 12.2%`

**Primary Color:** Magenta `320 70% 55%` (light) / `320 70% 60%` (dark)

**Visualization Palette:** 24 sequential chart colors (`--chart-1` through `--chart-24`), with chart-1 = Magenta (primary). Accessed via `src/lib/palette.ts` constants.

**Heatmap Scales:** 4 color families (green, red, blue, orange) x 4 intensity levels each.

**Custom Radii:** `--radius-card: 14px`, `--radius-widget: 10px`, plus standard sm/md/lg.

**Typography:**
- Body: **Inter** (variable font via `next/font/google`)
- Display: **DM Sans** (weights 500/600/700, utility class `font-display`)

### Layout Architecture

`layout.tsx` (Server Component) -> `DashboardLayout` (Client) -> `LayoutInner` (Client)

- `DashboardLayout` reads `usePathname()` and passes it as `key` to `LayoutInner`, causing React to remount and reset `mobileOpen` state on route change (avoids `setState` in `useEffect`).
- `LayoutInner` manages: sidebar collapsed state, mobile overlay, header with title + GitHub link + ThemeToggle.
- `AppSidebar` owns: collapsible nav groups, Cmd+K command palette search, user avatar footer.

### Component Patterns

- All interactive components use `"use client"` directive.
- State patterns use `useSyncExternalStore` where possible to comply with React 19 strict ESLint rules:
  - `useIsMobile` — external `matchMedia` listener
  - `ThemeToggle` — external `localStorage` + `matchMedia` store
  - `Toaster` (sonner) — external store pattern
- Page components under `src/app/` are Server Components by default.

### Testing

- Test files are co-located: `*.test.ts` next to source files.
- Setup file: `src/test/setup.ts` (imports `@testing-library/jest-dom`).
- Coverage thresholds: 90% for statements, branches, functions, and lines.
- Current: 25 tests across 3 files (utils, palette, use-mobile).

## Conventions

- **Imports**: Use `@/*` path alias (maps to `src/*`).
- **CSS Colors**: Always use CSS custom properties via `hsl(var(--token))`. Never hardcode color values in components.
- **Chart Colors**: Use `palette.ts` constants (`chart.primary`, `CHART_COLORS[i]`, `withAlpha("chart-1", 0.5)`). Never access CSS variables directly in JS for chart colors.
- **New shadcn/ui components**: Install via `bunx shadcn@latest add <component>`. Config in `components.json`.
- **New pages**: Create `src/app/<route>/page.tsx` (Server Component). Add route to `PAGE_TITLES` in `DashboardLayout.tsx` and `NAV_GROUPS` in `AppSidebar.tsx`.

## Upstream Reference

The basalt template project at `/Users/nocoo/workspace/personal/basalt` is the source of truth for the design system. When porting new components or tokens from basalt, remember:

- basalt uses Vite + React Router; wooly uses Next.js App Router.
- Replace `useLocation` -> `usePathname`, `useNavigate` -> `useRouter`, `<Outlet>` -> `{children}`.
- Add `"use client"` to any component with hooks, event handlers, or browser APIs.
- basalt uses `@tailwindcss/vite`; wooly uses `@tailwindcss/postcss`.
- basalt's chart-1 was blue `217 91% 60%`; in wooly it is magenta `320 70% 55%` (swapped with chart-12).

## Retrospective

- **React 19 strict ESLint rules**: `eslint-config-next@16.1.6` enforces `react-hooks/set-state-in-effect` (no direct `setState` in `useEffect`) and `react-hooks/refs` (no ref access during render). This required rewriting `useIsMobile`, `ThemeToggle`, `Toaster`, and `DashboardLayout` to use `useSyncExternalStore` or key-based state reset patterns. Always use these patterns from the start when porting from basalt.
- **Tailwind CSS v4 has no `tailwind.config.js`**: All theming is done via CSS `@theme inline` blocks and CSS custom properties in `globals.css`. This is framework-agnostic and ports directly between Vite and Next.js.
- **Triple-slash reference in vitest config**: `/// <reference types="vitest" />` triggers `@typescript-eslint/triple-slash-reference` error. Removed it; Vitest works fine without it in the standalone config file.
