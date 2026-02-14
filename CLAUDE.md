# Wooly — Project Intelligence

## Overview

**Wooly** is a family benefits/perks tracker dashboard built with Next.js. It inherits the full UI design system from the **basalt** template project (a Vite + React SPA at `/Users/nocoo/workspace/personal/basalt`). The primary brand color is **Magenta** (`HSL 320 70% 55%`).

**Domain**: Track household benefit sources (credit cards, insurance, memberships), their associated benefits (quotas, credits, actions), and redemption history across family members. Includes a points system for loyalty programs.

**All UI text is in Chinese.**

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript | 5.9.3 |
| UI Library | React | 19.2.4 |
| Styling | Tailwind CSS v4 (via `@tailwindcss/postcss`) | 4.1.18 |
| Component Library | shadcn/ui (Radix UI primitives) | — |
| Charts | recharts | 3.7.0 |
| Icons | lucide-react | 0.563.0 |
| Toast | sonner | 1.7.4 |
| Command Palette | cmdk | 1.1.1 |
| Authentication | NextAuth.js (Auth.js v5) | 5.0.0-beta.30 |
| Database | better-sqlite3 (synchronous, server-side only) | 12.6.2 |
| Package Manager | bun | 1.3.6 |
| Unit Testing | Vitest + @testing-library/react + jsdom | 4.0.18 |
| Coverage | @vitest/coverage-v8 (80% branch / 90% others) | 4.0.18 |
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

### MVVM Pattern

Wooly follows a strict **Model-View-ViewModel** architecture:

| Layer | Location | Responsibility | Testable? |
|---|---|---|---|
| **Model** | `src/models/` | Pure functions: CRUD, validation, computation. No React, no state. | Yes — inline fixtures |
| **ViewModel** | `src/viewmodels/` | React hooks: orchestrate models, manage state, expose UI-ready data. | Yes — renderHook + real mock data |
| **View** | `src/app/`, `src/components/` | React components: render UI, call ViewModel hooks. No business logic. | No — lint + build only |
| **Data** | `src/data/`, `src/db/` | Mock/empty datasets, SQLite persistence, API transport. | No — infrastructure |

**Key rules:**
- Views never call Model functions directly — always through ViewModel hooks.
- Models are pure functions with zero side effects. All CRUD functions are immutable (never mutate input, always return new arrays/objects).
- ViewModels use `useState` internally; tests use `renderHook` + `act()` from `@testing-library/react`.
- ViewModel tests use real mock data + real model functions (no mocking of model layer).
- ViewModel tests mock `@/hooks/use-dataset` via shared `mockUseDatasetModule()` helper in `src/test/viewmodels/setup.ts`, returning test dataset synchronously.
- Model tests use inline fixtures (never import mock.ts).

### Layout Architecture

- Root `layout.tsx` provides fonts, `SessionProvider`, `TooltipProvider`, and `Toaster` — NO sidebar.
- Route group `(dashboard)/layout.tsx` wraps children with `DashboardLayout` (sidebar + header).
- Route group `(auth)/` has no layout wrapper — standalone pages like login render without sidebar.
- `DashboardLayout` passes `key={pathname-dataMode}` to `LayoutInner`, causing React to remount and reset all ViewModel state on route change or data mode switch.

### Component Patterns

- All interactive components use `"use client"` directive.
- State patterns use `useSyncExternalStore` where possible to comply with React 19 strict ESLint rules (useIsMobile, ThemeToggle, DataModeToggle, Toaster).
- Page components under `src/app/` are Server Components by default.
- CRUD dialog components follow a consistent pattern: controlled `open` prop, `onSubmit` callback, form state via `useState`.

## Domain Model

### Entities

| Entity | Key Fields | Notes |
|---|---|---|
| **Source** (来源) | name, category, currency, icon, website, phone, validFrom/validUntil, isArchived | Credit cards, insurance, memberships. Archive excludes from calculations. |
| **Benefit** (权益) | name, type (quota/credit/action), sourceId, totalQuota/totalCredit, cycle, memberScope | Inherits currency from Source. Cycle can override Source's default. |
| **Redemption** (核销) | benefitId, memberId, redeemedAt, amount | Tracks individual benefit usage events. |
| **Member** (受益人) | name, relationship (本人/配偶/父母/子女/兄弟姐妹/其他) | Family members who can redeem benefits. |
| **PointsSource** (积分来源) | name, balance, currency (points/miles) | Loyalty point accounts. |
| **Redeemable** (可兑换) | pointsSourceId, name, cost | Items redeemable with points. |

### Benefit Types

| Type | Behavior | Example |
|---|---|---|
| **Quota** (次数型) | Decrement by 1 per redemption | 机场贵宾厅 3次/季 |
| **Credit** (额度型) | One-click full redemption of monetary amount | 体检额度 ¥2000/年 |
| **Action** (任务型) | Reminder only, no quantity tracking | 年度保单检视 |

### Cycle System

- `CycleAnchor`: `{ period: "monthly"|"quarterly"|"yearly", startDay?: number, startMonth?: number }`
- Source defines default cycle; Benefit can override with its own anchor.
- `getCurrentCycleWindow(anchor, now, tz)` → `{ start: Date, end: Date }` — determines the current billing period.
- `computeBenefitCycleStatus(benefit, redemptions, sources, now, tz)` → usage ratio, remaining, status label.

### Icon Resolution (Source)

Priority: **favicon** (derived from `website` via `https://favicon.im/{domain}`) > **manual icon** > **default category icon**. Favicon load failures gracefully fallback.

## Persistence Layer (SQLite)

Two separate databases selected by the DataMode toggle:

| Database | File | Behavior |
|---|---|---|
| **Test** (测试数据库) | `data/test.db` | Seeded from `src/data/mock.ts` on first access or reset |
| **Production** (生产数据库) | `data/production.db` | Starts empty; reset clears all data |

Database files (`data/*.db`) are gitignored and created on demand.

### API Pattern

Bulk read/write — NOT per-entity REST. All 7 collections transferred as a single JSON payload:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/data` | GET | Read all entities for current mode's DB |
| `/api/data` | PUT | Write all entities back (full overwrite) |
| `/api/data/reset` | POST | Reset DB (test: reseed from mock; production: clear) |

DataMode is passed via `?mode=test` or `?mode=production` query param.

### ViewModel Async Hydration Pattern

All 6 ViewModels follow the same pattern:

1. Call `useDataset()` which returns `{ dataset, loading, scheduleSync }`.
2. Local state initialized empty (e.g., `useState<Source[]>([])`).
3. One-time hydration `useEffect` with `initializedRef` guard: when `dataset` arrives, populate all local state.
4. CRUD mutations update local state directly, then call `scheduleSync()` with a getter that builds the full Dataset from refs.
5. `scheduleSync` debounces (800ms) then PUTs the entire dataset back to the API.

The hydration useEffect requires `/* eslint-disable react-hooks/set-state-in-effect */` block pairs since React 19 ESLint forbids setState in effects, but this is a legitimate one-time async→local sync pattern.

## Testing

### Strategy

| Layer | Test Location | Approach | Fixture Source |
|---|---|---|---|
| Model | `src/test/models/` | Pure function unit tests | Inline fixtures (never import mock.ts) |
| ViewModel | `src/test/viewmodels/` | `renderHook` + `act()` with real mock data | `src/data/mock.ts` + real model functions |
| View | — | Not tested (lint + build only) | — |
| Lib/Hooks | Co-located (`*.test.ts`) | Unit tests | Inline fixtures |

### Coverage

Coverage is scoped to Model/ViewModel/lib/hooks layers only. Excludes view layer, type-only files, View-adjacent hooks (`use-theme.ts`, `use-today.ts`), async/transport code (`use-dataset.ts`, `src/db/**`, `src/data/api.ts`).

**Current**: 452 tests across 20 files. Thresholds: 90% statements/functions/lines, 80% branches.

## Pages

| Route | Page Title | ViewModel |
|---|---|---|
| `/` | 仪表盘 | `useDashboardViewModel` |
| `/sources` | 权益来源 | `useSourcesViewModel` |
| `/sources/[id]` | (dynamic) | `useSourceDetailViewModel` |
| `/sources/points-[id]` | (dynamic) | `usePointsDetailViewModel` |
| `/tracker` | 权益追踪 | `useTrackerViewModel` |
| `/settings` | 设置 | `useSettingsViewModel` |

`PointsSourceCard` navigates to `/sources/points-{id}`. The Source Detail page detects the `points-` prefix to switch between regular source detail and points detail views.

## Design System (inherited from basalt)

All design tokens live in `src/app/globals.css`. No `tailwind.config.js` — Tailwind CSS v4 uses `@theme inline` blocks.

**3-Layer Background System:**
- **L0** (body): `--background` — light `220 14% 94%` / dark `0 0% 9%`
- **L1** (content panel): `--card` — light `220 14% 97%` / dark `0 0% 10.6%`
- **L2** (inner cards): `--secondary` — light `0 0% 100%` / dark `0 0% 12.2%`

**Primary Color:** Magenta `320 70% 55%` (light) / `320 70% 60%` (dark)

**Visualization Palette:** 24 sequential chart colors (`--chart-1` through `--chart-24`), chart-1 = Magenta. Accessed via `src/lib/palette.ts`.

**Typography:** Body = **Inter**, Display = **DM Sans** (utility class `font-display`).

**Custom Radii:** `--radius-card: 14px`, `--radius-widget: 10px`.

## Conventions

- **Imports**: Use `@/*` path alias (maps to `src/*`).
- **CSS Colors**: Always use CSS custom properties via `hsl(var(--token))`. Never hardcode color values.
- **Chart Colors**: Use `palette.ts` constants. Never access CSS variables directly in JS for chart colors.
- **New shadcn/ui components**: `bunx shadcn@latest add <component>`.
- **New pages**: Create under `src/app/(dashboard)/`. Add route to `PAGE_TITLES` in `DashboardLayout.tsx` and `NAV_GROUPS` in `AppSidebar.tsx`. Standalone pages go under `src/app/(auth)/`.
- **Environment variables**: Secrets in `.env.local` (gitignored). Template in `.env.example` (committed).
- **CRUD immutability**: All model CRUD functions return new arrays/objects. Never mutate the input.
- **Validation**: Model CRUD functions return `ValidationError[]`. ViewModels surface these as user-facing error state.
- **`stripUndefined` generic constraint**: Use `T extends object` (not `Record<string, unknown>`) because TS interfaces lack implicit index signatures.
- **TDD commits**: Use `--no-verify` flag since tests are expected to fail before implementation exists.

## Authentication

Uses **NextAuth.js v5** (Auth.js) with Google OAuth provider and email whitelist.

- Google provider with `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` from env. `signIn` callback checks email against `AUTH_ALLOWED_EMAILS` whitelist.
- Route protection via `src/proxy.ts`: all routes require auth except `/login`, `/api/auth/*`, `/_next`, `/favicon*`, `/logo/*`.
- `trustHost: true` enables URL auto-detection from `Host` / `x-forwarded-host` headers — works across localhost and reverse proxy without changing env vars.
- Env vars: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`, `AUTH_URL` (optional), `AUTH_ALLOWED_EMAILS`, `USE_SECURE_COOKIES` (for HTTPS dev proxy).

## Logo System

Source images (`logo-light.png`, `logo-dark.png`) are 2048x2048 PNGs in root. **Never modify the originals** — run `python scripts/generate_logo.py` to regenerate all derived assets in `public/logo/`.

`Logo` component auto-selects light/dark variant via `useAppliedTheme()`. Theme hook (`use-theme.ts`) is built on `useSyncExternalStore`.

## Upstream Reference (basalt)

When porting from basalt (`/Users/nocoo/workspace/personal/basalt`):

- Replace `useLocation` -> `usePathname`, `useNavigate` -> `useRouter`, `<Outlet>` -> `{children}`.
- Add `"use client"` to any component with hooks, event handlers, or browser APIs.
- basalt uses `@tailwindcss/vite`; wooly uses `@tailwindcss/postcss`.
- basalt's chart-1 was blue `217 91% 60%`; in wooly it is magenta `320 70% 55%` (swapped with chart-12).

## Retrospective

- **React 19 strict ESLint rules**: `react-hooks/set-state-in-effect` and `react-hooks/refs` require `useSyncExternalStore` or key-based state reset patterns. Always use these from the start when porting from basalt.
- **Tailwind CSS v4 has no `tailwind.config.js`**: All theming via CSS `@theme inline` blocks and custom properties in `globals.css`.
- **`Record<string, unknown>` vs `object`**: TS interfaces lack implicit index signatures. Use `T extends object` for generic constraints. Vitest won't catch this — always run `next build` to verify.
- **`computeBenefitCycleStatus` caller must pre-filter redemptions by benefitId** — `countRedemptionsInWindow` does NOT filter internally.
- **recharts SSR warning**: Harmless during `next build`. Expected and does not affect functionality.
- **Timezone mismatch in `redeemedAt`**: `new Date().toISOString()` produces UTC. Use `today` from `useToday()` or `formatDateInTimezone()` consistently. Never mix UTC and local timezone date strings.
- **`eslint-disable-next-line` does not suppress block-level violations**: Use `/* eslint-disable */` / `/* eslint-enable */` block pairs for multi-line regions.
- **Branch coverage drops with async hydration**: Defensive branches like `if (loading || !dataset)` are never hit in tests (mocks return loaded data synchronously). Accept ~82% branch rather than 90%.
