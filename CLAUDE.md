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

### MVVM Pattern

Wooly follows a strict **Model-View-ViewModel** architecture:

| Layer | Location | Responsibility | Testable? |
|---|---|---|---|
| **Model** | `src/models/` | Pure functions: CRUD, validation, computation. No React, no state. | Yes — inline fixtures |
| **ViewModel** | `src/viewmodels/` | React hooks: orchestrate models, manage state, expose UI-ready data. | Yes — renderHook + real mock data |
| **View** | `src/app/`, `src/components/` | React components: render UI, call ViewModel hooks. No business logic. | No — lint + build only |
| **Data** | `src/data/mock.ts` | Mock dataset used by ViewModels as initial state. | No — fixture file |

**Key rules:**
- Views never call Model functions directly — always through ViewModel hooks.
- Models are pure functions with zero side effects. All CRUD functions are immutable (never mutate input, always return new arrays/objects).
- ViewModels use `useState` internally; tests use `renderHook` + `act()` from `@testing-library/react`.
- ViewModel tests use real mock data + real model functions (no mocking of model layer).
- Model tests use inline fixtures (never import mock.ts).

### Directory Structure

```
src/
  app/                           # Next.js App Router (View layer)
    globals.css                  # ALL design tokens (Tailwind v4 @theme, CSS variables)
    layout.tsx                   # Root layout (fonts, providers, Toaster — NO sidebar)
    api/auth/[...nextauth]/      # NextAuth.js API route handler
      route.ts
    (dashboard)/                 # Route group: pages with DashboardLayout (sidebar + header)
      layout.tsx                 # Wraps children with DashboardLayout
      page.tsx                   # 仪表盘 (Dashboard home)
      loading.tsx                # Loading state (renders LoadingScreen)
      sources/
        page.tsx                 # 权益来源 (Sources list)
        [id]/page.tsx            # Source detail (handles regular + points-{id} prefix)
      tracker/page.tsx           # 权益追踪 (Tracker — redeem/undo)
      settings/page.tsx          # 设置 (Settings — members, timezone)
    (auth)/                      # Route group: standalone pages (no sidebar)
      login/page.tsx             # Badge login page (basalt BadgeLoginPage template)
  models/                        # Model layer — pure functions
    types.ts                     # All domain interfaces and CRUD input types
    cycle.ts                     # Cycle engine (6 core functions)
    format.ts                    # Formatting utilities (dates, labels, colors)
    benefit.ts                   # Benefit CRUD + validation + urgency + icon resolution
    source.ts                    # Source CRUD + validation + archive + expiry
    member.ts                    # Member CRUD + validation + dependency checks
    redemption.ts                # Redemption CRUD
    dashboard.ts                 # Dashboard computations (stats, alerts, progress, trends)
    points.ts                    # PointsSource + Redeemable CRUD + validation + affordability
  viewmodels/                    # ViewModel layer — React hooks
    useDashboardViewModel.ts     # Stats, alerts, progress, top sources, monthly trend
    useSourcesViewModel.ts       # Source cards, member filter, points source cards, CRUD
    useSourceDetailViewModel.ts  # Source header, benefit rows, member usage, benefit CRUD, redeem
    useTrackerViewModel.ts       # Stats, recent redemptions, redeemable benefits, redeem/undo
    useSettingsViewModel.ts      # Member CRUD, timezone, section navigation
    usePointsDetailViewModel.ts  # Points header, redeemable rows, stats, CRUD, balance update
   data/
    mock.ts                      # Full mock dataset (Chinese scenario: 招行白金, 平安保险, 88VIP, etc.)
    empty.ts                     # Empty dataset (all empty arrays) for production mode
    datasets.ts                  # Dataset interface + getDataset(mode) accessor
  components/
    dashboard/                   # Dashboard widget components (ported from basalt)
      StatCardWidget.tsx         # Stat card with icon, value, label, trend
      RecentListCard.tsx         # Recent activity list
      ItemListCard.tsx           # Generic item list with icon
      RadialProgressCard.tsx     # Radial progress chart (recharts)
      BarChartCard.tsx           # Bar chart (recharts)
      BenefitProgressRow.tsx     # Benefit progress bar with status
      ActionGridCard.tsx         # Action items grid
    ui/                          # shadcn/ui primitives (15 components)
      alert-dialog.tsx, avatar.tsx, badge.tsx, button.tsx, card.tsx,
      collapsible.tsx, command.tsx, dialog.tsx, dropdown-menu.tsx,
      input.tsx, label.tsx, select.tsx, separator.tsx, sonner.tsx, tooltip.tsx
    SourceCard.tsx               # Source card with favicon, expiry, archive badge
    PointsSourceCard.tsx         # Points source card with balance
    SourceFormDialog.tsx         # Source create/edit dialog
    BenefitFormDialog.tsx        # Benefit create/edit dialog
    MemberFormDialog.tsx         # Member create/edit dialog
    RedeemableFormDialog.tsx     # Redeemable create/edit dialog
    RedeemDialog.tsx             # Redemption dialog (select member, confirm)
    DeleteConfirmDialog.tsx      # Generic delete confirmation dialog
    DataModeToggle.tsx           # Test/Production data mode dropdown toggle
    MemberFilterBar.tsx          # Member filter pills
    BenefitStatusBadge.tsx       # Status badge (active, expiring, exhausted)
    TimezoneSelect.tsx           # Timezone dropdown
    AppSidebar.tsx               # Collapsible sidebar with nav groups, search (Cmd+K), user footer
    DashboardLayout.tsx          # Main shell: sidebar + header + content area
    LoadingScreen.tsx            # Full-screen loading (basalt LoadingPage template)
    Logo.tsx                     # Logo component (auto dark/light, size presets)
    SessionProvider.tsx          # Client-side NextAuth SessionProvider wrapper
    ThemeToggle.tsx              # Light/Dark/System theme cycler
  hooks/
    use-mobile.ts                # useIsMobile() — useSyncExternalStore based
    use-theme.ts                 # Shared theme store (useTheme, useAppliedTheme, applyTheme)
    use-today.ts                 # useToday() — date rollover detection, 30s polling
    use-data-mode.ts             # Data mode store (useDataMode, getStoredDataMode, setDataMode)
  lib/
    auth.ts                      # Email whitelist utilities
    utils.ts                     # cn() helper (clsx + tailwind-merge) + stripUndefined()
    palette.ts                   # Chart color constants, withAlpha(), CHART_COLORS array
  test/
    setup.ts                     # Vitest setup (jest-dom matchers)
    models/                      # Model layer tests (8 files)
      benefit.test.ts, cycle.test.ts, dashboard.test.ts, format.test.ts,
      member.test.ts, points.test.ts, redemption.test.ts, source.test.ts
    viewmodels/                  # ViewModel layer tests (7 files)
      useDashboardViewModel.test.ts, useSourcesViewModel.test.ts,
      useSourceDetailViewModel.test.ts, useTrackerViewModel.test.ts,
      useSettingsViewModel.test.ts, usePointsDetailViewModel.test.ts,
      integration.test.ts
  auth.ts                        # NextAuth.js config (Google provider, whitelist callback)
  proxy.ts                       # Route protection (redirects unauthenticated to /login)
docs/                            # Design documents (6 files, all finalized)
  01-data-model.md               # Entity definitions, fields, enums, validation, CRUD rules
  02-mvvm-architecture.md        # Layer rules, function signatures, CRUD patterns, test strategy
  03-pages-and-ui.md             # 5 page layouts with wireframes, component mapping
  04-mock-data.md                # Mock data spec with exact values for all entities
  05-cycle-engine.md             # Cycle engine algorithm, test case matrix
  06-implementation-plan.md      # Commit-by-commit plan for P1-P6
scripts/
  generate_logo.py               # Resize logo-light/dark.png → public/ assets
```

### Config Files (Project Root)

| File | Purpose |
|---|---|
| `package.json` | Dependencies, scripts (port 7018), bun packageManager |
| `tsconfig.json` | TypeScript config (`strict: true`), `@/*` path alias to `./src/*` |
| `next.config.ts` | Next.js config (Google avatar + favicon.im image remotePatterns) |
| `postcss.config.mjs` | Tailwind CSS v4 via `@tailwindcss/postcss` |
| `eslint.config.mjs` | ESLint flat config (next core-web-vitals + typescript) |
| `vitest.config.ts` | Vitest with jsdom, react-swc plugin, v8 coverage (90%), scoped to Model/VM/lib/hooks |
| `components.json` | shadcn/ui config (aliases, style, RSC enabled) |
| `.husky/pre-commit` | Runs `bun run test` |
| `.husky/pre-push` | Runs `bun run test && bun run lint` |

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

Priority: **favicon** (derived from `website` via `https://favicon.im/{domain}`) > **manual icon** > **default category icon**. Favicon load failures gracefully fallback. The `resolveSourceIcon()` and `extractDomain()` functions handle this in `benefit.ts`.

## Testing

### Strategy

| Layer | Test Location | Approach | Fixture Source |
|---|---|---|---|
| Model | `src/test/models/` | Pure function unit tests | Inline fixtures (never import mock.ts) |
| ViewModel | `src/test/viewmodels/` | `renderHook` + `act()` with real mock data | `src/data/mock.ts` + real model functions |
| View | — | Not tested (lint + build only) | — |
| Lib/Hooks | Co-located (`*.test.ts`) | Unit tests | Inline fixtures |

### Coverage

Coverage is scoped to Model/ViewModel/lib/hooks layers only. Excludes:
- View layer (components, pages, auth, proxy)
- `src/models/types.ts` (type-only file, no runtime code)
- `src/hooks/use-theme.ts` (View-adjacent, depends on DOM APIs)
- `src/hooks/use-today.ts` (View-adjacent, depends on timer + Date.now)

Note: `src/hooks/use-data-mode.ts` is NOT excluded — it is fully testable (pure localStorage + events, no DOM APIs).

**Current**: 452 tests across 20 files. All thresholds met:

| Metric | Value | Threshold |
|---|---|---|
| Statements | 98.97% | 90% |
| Branches | 90.66% | 90% |
| Functions | 99.23% | 90% |
| Lines | 99.88% | 90% |

### Test Counts by File

| File | Tests |
|---|---|
| `cycle.test.ts` | 50 |
| `source.test.ts` | 51 |
| `points.test.ts` | 38 |
| `benefit.test.ts` | 31 |
| `dashboard.test.ts` | 29 |
| `format.test.ts` | 24 |
| `member.test.ts` | 20 |
| `redemption.test.ts` | 11 |
| `useSourcesViewModel.test.ts` | 25 |
| `useSourceDetailViewModel.test.ts` | 24 |
| `useSettingsViewModel.test.ts` | 24 |
| `useTrackerViewModel.test.ts` | 23 |
| `useDashboardViewModel.test.ts` | 16 |
| `usePointsDetailViewModel.test.ts` | 17 |
| `integration.test.ts` | 14 |
| `auth.test.ts` | 13 |
| `palette.test.ts` | 13 |
| `utils.test.ts` | 13 |
| `use-mobile.test.ts` | 4 |
| `use-data-mode.test.ts` | 12 |

## Design System (inherited from basalt)

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

- Root `layout.tsx` provides fonts, `SessionProvider`, `TooltipProvider`, and `Toaster` — it does **not** wrap with `DashboardLayout`.
- Route group `(dashboard)/layout.tsx` wraps children with `DashboardLayout` (sidebar + header).
- Route group `(auth)/` has no layout wrapper — standalone pages like login render without sidebar.
- `DashboardLayout` reads `usePathname()` and `useDataMode()`, passing `key={pathname-dataMode}` to `LayoutInner`, causing React to remount and reset all ViewModel state on route change or data mode switch.
- `LayoutInner` manages: sidebar collapsed state, mobile overlay, header with title + GitHub link + DataModeToggle + ThemeToggle.
- `AppSidebar` owns: collapsible nav groups, Cmd+K command palette search, user avatar footer.

### Component Patterns

- All interactive components use `"use client"` directive.
- State patterns use `useSyncExternalStore` where possible to comply with React 19 strict ESLint rules:
  - `useIsMobile` — external `matchMedia` listener
  - `ThemeToggle` — external `localStorage` + `matchMedia` store (via shared `use-theme` hook)
  - `DataModeToggle` — external `localStorage` store (via shared `use-data-mode` hook)
  - `Toaster` (sonner) — external store pattern
- Page components under `src/app/` are Server Components by default.
- CRUD dialog components follow a consistent pattern: controlled `open` prop, `onSubmit` callback, form state via `useState`.

## Pages

| Route | Page Title | ViewModel | Description |
|---|---|---|---|
| `/` | 仪表盘 | `useDashboardViewModel` | Stats, alerts, progress ring, top sources, monthly trend, recent activity |
| `/sources` | 权益来源 | `useSourcesViewModel` | Source cards grid, member filter, points source cards, add/edit/archive/delete |
| `/sources/[id]` | (dynamic) | `useSourceDetailViewModel` | Source header, benefit table, member usage matrix, benefit CRUD, redeem |
| `/sources/points-[id]` | (dynamic) | `usePointsDetailViewModel` | Points header, redeemable table, stats, redeemable CRUD, balance update |
| `/tracker` | 权益追踪 | `useTrackerViewModel` | Stats summary, recent redemptions, redeemable benefits list, quick redeem/undo |
| `/settings` | 设置 | `useSettingsViewModel` | Member management CRUD, timezone selector, section navigation |

**Routing note:** `PointsSourceCard` navigates to `/sources/points-{id}`. The Source Detail page detects the `points-` prefix in the URL param to switch between regular source detail and points detail views.

## Conventions

- **Imports**: Use `@/*` path alias (maps to `src/*`).
- **CSS Colors**: Always use CSS custom properties via `hsl(var(--token))`. Never hardcode color values in components.
- **Chart Colors**: Use `palette.ts` constants (`chart.primary`, `CHART_COLORS[i]`, `withAlpha("chart-1", 0.5)`). Never access CSS variables directly in JS for chart colors.
- **New shadcn/ui components**: Install via `bunx shadcn@latest add <component>`. Config in `components.json`.
- **New pages**: Create `src/app/(dashboard)/<route>/page.tsx` (Server Component). Add route to `PAGE_TITLES` in `DashboardLayout.tsx` and `NAV_GROUPS` in `AppSidebar.tsx`.
  - **Dashboard pages** go under `src/app/(dashboard)/` — they get sidebar + header automatically.
  - **Standalone pages** (login, loading, etc.) go under `src/app/(auth)/` or a new route group — no sidebar wrapper.
- **Environment variables**: Secrets go in `.env.local` (gitignored). Template goes in `.env.example` (committed).
- **CRUD immutability**: All model CRUD functions return new arrays/objects. Never mutate the input.
- **Validation**: Model CRUD functions return `ValidationError[]`. ViewModels surface these as user-facing error state.
- **`stripUndefined` generic constraint**: Use `T extends object` (not `Record<string, unknown>`) because TS interfaces lack implicit index signatures.
- **TDD commits**: Use `--no-verify` flag since tests are expected to fail before implementation exists.

## Authentication

Uses **NextAuth.js v5** (Auth.js) with Google OAuth provider and email whitelist.

**Configuration** (`src/auth.ts`):
- Google provider with `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` from env.
- `signIn` callback checks email against `AUTH_ALLOWED_EMAILS` whitelist.
- Non-whitelisted users see "Access Denied" on the login page (`?error=AccessDenied`).
- Custom pages: `signIn: "/login"`, `error: "/login"`.

**Route protection** (`src/proxy.ts`):
- All routes require authentication except: `/login`, `/api/auth/*`, `/_next`, `/favicon*`, `/logo/*`.
- Unauthenticated users are redirected to `/login?callbackUrl=<original-path>`.

**Session management**:
- `SessionProvider` wraps the entire app in root `layout.tsx`.
- Client components use `useSession()` from `next-auth/react` (e.g., `AppSidebar` for user info).
- Server components can use `auth()` from `@/auth` for server-side session checks.

**Whitelist utilities** (`src/lib/auth.ts`):
- `parseEmailWhitelist(raw)` — parses comma-separated string into normalized array.
- `isEmailAllowed(email, whitelist)` — checks email against whitelist (empty whitelist = allow all).

**Environment variables** (`.env.local`):
- `AUTH_GOOGLE_ID` — Google OAuth Client ID
- `AUTH_GOOGLE_SECRET` — Google OAuth Client Secret
- `AUTH_SECRET` — NextAuth.js session encryption key
- `AUTH_URL` — (Optional) Base URL. Leave empty to auto-detect from request headers via `trustHost: true`. Only set if auto-detection doesn't work.
- `AUTH_ALLOWED_EMAILS` — Comma-separated whitelist of allowed Google emails
- `USE_SECURE_COOKIES` — Set to `"true"` when using HTTPS reverse proxy in development. Not needed in production (`NODE_ENV=production` auto-enables).

**URL auto-detection**: With `trustHost: true`, Auth.js reads `Host` / `x-forwarded-host` headers to dynamically construct callback URLs. This allows the same config to work across localhost, `wooly.dev.hexly.ai`, and production without changing env vars. The `buildRedirectUrl()` in `proxy.ts` similarly reads forwarded headers for correct redirect URLs behind reverse proxies.

**Google OAuth callback URLs** (must be registered in Google Cloud Console):
- `http://localhost:7018/api/auth/callback/google` (local development)
- `https://wooly.dev.hexly.ai/api/auth/callback/google` (dev proxy)

## Logo System

Source images (`logo-light.png`, `logo-dark.png`) are 2048×2048 RGBA PNGs in the project root. **Never modify the originals** — run `python scripts/generate_logo.py` to regenerate all derived assets.

**Generated assets:**
- `public/logo/{light,dark}-{32,64,128,256}.png` — sized variants for `Logo` component
- `public/logo-loading-{light,dark}.png` — 256×256 for `LoadingScreen`
- `public/favicon.png` — 32×32 (light variant; favicon cannot auto-detect dark mode)

**Logo component** (`src/components/Logo.tsx`):
- Uses `next/image` with size presets: `sm` (32px), `md` (64px), `lg` (128px), `xl` (256px)
- Automatically selects light/dark variant via `useAppliedTheme()` from `use-theme` hook
- Used in: `AppSidebar` (sm), login page (lg), `LoadingScreen` (xl)

**Theme hook** (`src/hooks/use-theme.ts`):
- Shared store extracted from `ThemeToggle` to avoid duplication across `Logo`, `ThemeToggle`, and future consumers.
- Exports: `useTheme()` (returns current setting), `useAppliedTheme()` (resolves "system" to actual light/dark), `applyTheme()` (persists + applies), `emitThemeChange()` (notifies listeners).
- Built on `useSyncExternalStore` to comply with React 19 strict ESLint rules.

## Basalt Template Mapping

Pages and components ported from basalt templates:

| Wooly Page/Component | Basalt Template | Key Adaptations |
|---|---|---|
| `(auth)/login/page.tsx` | `BadgeLoginPage.tsx` | Badge card with barcode, Google sign-in, orbital secure-auth footer |
| `LoadingScreen.tsx` | `LoadingPage.tsx` | Full-screen circle with logo + orbital CSS spinner |
| `StatCardWidget.tsx` | `StatCard.tsx` | Adapted for wooly stat data shape |
| `RecentListCard.tsx` | `RecentListCard.tsx` | Used for recent redemptions |
| `ItemListCard.tsx` | `ItemListCard.tsx` | Used for top sources, alerts |
| `RadialProgressCard.tsx` | `RadialProgressCard.tsx` | Overall benefit usage progress ring (recharts) |
| `BarChartCard.tsx` | `BarChartCard.tsx` | Monthly redemption trend (recharts) |
| `ActionGridCard.tsx` | `ActionGridCard.tsx` | Action-type benefit reminders |
| `BenefitProgressRow.tsx` | (new) | Benefit usage progress bar with status badge |

Basalt has 19 total routes (14 dashboard, 5 standalone). Wooly has 6 routes (5 dashboard + login).

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
- **`Record<string, unknown>` vs `object` in generic constraints**: TypeScript interfaces lack an implicit index signature, so `T extends Record<string, unknown>` rejects interface types like `UpdateBenefitInput`. Use `T extends object` instead when the function only needs to iterate keys (e.g., `stripUndefined`). Vitest runs in a more permissive mode and won't catch this — always run `next build` to verify strict TypeScript compilation.
- **Coverage scoping is essential**: View layer (components, pages) should be excluded from coverage requirements. Configure `vitest.config.ts` `include` to scope only to Model/ViewModel/lib/hooks. Also exclude type-only files (`types.ts`) and View-adjacent hooks (`use-theme.ts`).
- **CRITICAL BUG (P5)**: `computeBenefitCycleStatus` expects redemptions pre-filtered by benefitId, but `countRedemptionsInWindow` does NOT filter by benefitId internally. The caller must filter before passing. This was caught during page integration and fixed.
- **recharts SSR warning**: recharts logs a harmless SSR warning during `next build`. This is expected and does not affect functionality.
- **Defensive branches are acceptable uncovered code**: Fallbacks like `?? "未知"`, `if (!source) continue`, and `?? 0` are defensive guards that cannot be triggered with valid data. Accept them rather than writing contrived tests.
- **Timezone mismatch in `redeemedAt` timestamps**: `new Date().toISOString()` produces UTC dates, but stats compare against `useToday()` which returns dates in the configured timezone (Asia/Shanghai, UTC+8). When the UTC date differs from the local date (00:00–08:00 Shanghai time), `slice(0, 10)` extracts the wrong date. Fix: use `today` from `useToday()` as the `redeemedAt` value, or use `formatDateInTimezone()` consistently. Never mix UTC and local timezone date strings.
