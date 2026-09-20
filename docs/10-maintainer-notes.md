# 10 — 架构、运维与界面约束

[AGENTS.md](../AGENTS.md) 是质量契约与测试入口。此文保留模型、交互、部署和品牌的详细约束；依赖版本以清单为准，事故记录在 [Retrospective.md](../Retrospective.md)。所有下列源码路径均相对仓库根目录。

## 架构细节

### MVVM Pattern

Wooly follows a strict **Model-View-ViewModel** architecture:

| Layer | Location | Responsibility | Testable? |
|---|---|---|---|
| **Model** | `src/models/` | Pure functions: CRUD, validation, computation. No React, no state. | Yes — inline fixtures |
| **ViewModel** | `src/viewmodels/` | React hooks: orchestrate models, manage state, expose UI-ready data. | Yes — renderHook + real mock data |
| **View** | `src/pages/`, `src/components/` | React components: render UI, call ViewModel hooks. No business logic. | Browser journeys |
| **Data** | `src/data/` | Mock/test fixtures, API transport. | Test executable transport logic |

**Key rules:**
- Views never call Model functions directly — always through ViewModel hooks.
- Models are pure functions with zero side effects. All CRUD functions are immutable (never mutate input, always return new arrays/objects).
- ViewModels use `useState` internally; tests use `renderHook` + `act()` from `@testing-library/react`.
- ViewModel tests use real mock data + real model functions (no mocking of model layer).
- ViewModel tests mock `@/hooks/use-dataset` via shared `mockUseDatasetModule()` helper in `src/test/viewmodels/setup.ts`, returning test dataset synchronously.
- Model tests use inline fixtures (never import mock.ts).

### Layout Architecture

`src/main.tsx` mounts the app. `src/App.tsx` provides React Router, Basalt and Access session context. `AppShellRoute` gates household routes; `/login` renders the session recovery page. `DashboardLayout` uses `key={pathname}` to reset ViewModel state on navigation. Add routes to the router, page-title map and sidebar navigation together.

### Component Patterns

- State patterns use `useSyncExternalStore` where possible (useIsMobile, ThemeToggle, Toaster). Rules-of-Hooks + dependency-array correctness are enforced today by Biome's `useHookAtTopLevel` and `useExhaustiveDependencies`. The stricter React 19 rules — `react-hooks/set-state-in-effect` (setState inside useEffect) and `react-hooks/refs` (ref safety) — are historical: they lived in the pre-migration tseslint stack and are currently unmapped in Biome's React ruleset, so nothing blocks a violation. Use `useSyncExternalStore` from the start anyway; the pattern is still the right one.
- CRUD dialog components follow a consistent pattern: controlled `open` prop, `onSubmit` callback, form state via `useState`.

## Domain Model

### Entities

| Entity | Key Fields | Notes |
|---|---|---|
| **Source** (权益账户) | name, category, currency, icon, website, phone, validFrom/validUntil, isArchived, cost, cardNumber, colorIndex | Credit cards, insurance, memberships. Archive excludes from calculations. cost is a free-text string (e.g., "¥3600/年", "首年免年费"). cardNumber is a free-text string for card identification (e.g., last 4 digits). colorIndex (1-36 or null) maps to chart palette colors for SourceCard background gradient. |
| **Benefit** (权益) | name, type (quota/credit/action), sourceId, totalQuota/totalCredit, cycle, memberScope | Inherits currency from Source. Cycle can override Source's default. |
| **Redemption** (核销) | benefitId, memberId, redeemedAt, amount | Tracks individual benefit usage events. |
| **Member** (受益人) | name, relationship (本人/配偶/父母/子女/兄弟姐妹/其他) | Family members who can redeem benefits. |
| **PointsSource** (积分账户) | name, balance, currency (points/miles) | Loyalty point accounts. |
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

## Persistence Layer (Worker / D1)

Data is served by a Cloudflare Worker backed by D1 (SQLite-compatible).
The same Worker serves authenticated static assets and the API. The browser sends same-origin requests; there is no intermediate server or shared API key.

### API Pattern

Bulk read/write — NOT per-entity REST. All 7 collections transferred as a single JSON payload:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/data` | GET | Read all entities from Worker/D1 |
| `/api/data` | PUT | Write all entities back (full overwrite) |
| `/api/data/reset` | POST | Reset DB (requires explicit local/test environment + ALLOW_RESET) |

### ViewModel Async Hydration Pattern

All 6 ViewModels follow the same pattern:

1. Call `useDataset()` which returns `{ dataset, loading, scheduleSync }`.
2. Local state initialized empty (e.g., `useState<Source[]>([])`).
3. One-time hydration `useEffect` with `initializedRef` guard: when `dataset` arrives, populate all local state.
4. CRUD mutations update local state directly, then call `scheduleSync()` with a getter that builds the full Dataset from refs.
5. `scheduleSync` debounces (500ms) then PUTs the entire dataset back to the API.

The hydration useEffect needs no lint suppression — the corresponding React 19 hooks rule (`react-hooks/set-state-in-effect` under the previous ESLint stack; unmapped in Biome's current React ruleset) is not enforced today. The `initializedRef` guard already enforces the one-time-only contract regardless of which linter is active.

## Development and operations

See [development and deployment](08-development.md) for exact commands, isolation and credentials. Daily development uses port 7014 and local D1; do not start a competing daily server. Automated browser verification uses port 27014 and an isolated temporary database. Production migration and cutover evidence belongs in [11-workers-migration.md](11-workers-migration.md).

## Pages
| Route | Page Title | ViewModel |
|---|---|---|
| `/` | 仪表盘 | `useDashboardViewModel` |
| `/sources` | 权益账户 | `useSourcesViewModel` |
| `/sources/[id]` | (dynamic) | `useSourceDetailViewModel` |
| `/sources/points-[id]` | (dynamic) | `usePointsDetailViewModel` |
| `/tracker` | 权益追踪 | `useTrackerViewModel` |
| `/settings` | 设置 | `useSettingsViewModel` |

`PointsSourceCard` navigates to `/sources/points-{id}`. The Source Detail page detects the `points-` prefix to switch between regular source detail and points detail views.

## Design System

Core chrome and controls come from public `@nocoo/basalt (version in package.json)`. Domain account colors stay in `src/app/globals.css` and `src/lib/palette.ts` (36 persisted card values). No `tailwind.config.js` — Tailwind CSS v4 uses `@theme inline`.

**Surfaces (Basalt L0–L3):** body `bg-basalt-background` / `text-basalt-foreground` (L0) → `ContentIsland` (L1) → `LayerCard` (L2) → `LayerCard.Well` (L3). Do not reintroduce generic `--background` / `--card` tokens.

**Primary Color:** Magenta via `AccentProvider.paletteOverrides` (`320 70% 55%` light / `320 70% 60%` dark).

**Visualization Palette:** 24 sequential chart colors plus 6 black and 6 white card series (`--chart-1` through `--chart-36`). Accessed via `src/lib/palette.ts`.

**Typography:** Body = **Inter**, Display = **DM Sans** (utility class `font-display`).

## Conventions

- **Imports**: Use `@/*` path alias (maps to `src/*`).
- **CSS Colors**: Always use CSS custom properties via `hsl(var(--token))`. Never hardcode color values.
- **Chart Colors**: Use `palette.ts` constants. Never access CSS variables directly in JS for chart colors.
- **New UI**: import from `@nocoo/basalt`. Do not copy shadcn primitives into `src/components/ui/`.
- **New pages**: Create under `src/pages/`; register in `src/App.tsx`, `PAGE_TITLES` and `NAV_GROUPS`.
- **Configuration**: Runtime bindings and non-secret vars in `wrangler.jsonc`; deployment credentials in the GitHub production environment.
- **CRUD immutability**: All model CRUD functions return new arrays/objects. Never mutate the input.
- **Validation**: Model CRUD functions return `ValidationError[]`. ViewModels surface these as user-facing error state.
- **`stripUndefined` generic constraint**: Use `T extends object` (not `Record<string, unknown>`) because TS interfaces lack implicit index signatures.

## Authentication

Cloudflare Access controls identity admission. The Worker verifies the signed assertion using the configured team JWKS and audience. Session UI reads `/api/session`; logout navigates to `/cdn-cgi/access/logout`. Session recovery navigates the top-level browser through Access again. Private API responses use `Cache-Control: no-store`.

## Logo System

Root `logo.png` is the canonical 2048 × 2048 transparent master, adopted from the framing repair `wooly/2026-09-07-02`, finishing `01`. Keep its natural fleece entry, wink, tongue, and protected feature margins; identity changes require explicit direction. Regenerate derivatives with `uv run --with pillow python scripts/resize-logos.py`:

- `public/logo-{24,80}.png` and `public/icon.png` / `favicon.ico` use the transparent foreground.
- `assets/brand/icon.png` and `icon-rounded.png` preserve the selected presentation separately. README and Open Graph use the rounded presentation; Apple touch uses the square presentation.
- `Logo` (`src/components/Logo.tsx`) uses the transparent size variants on both themes. Account favicons and card-network logos are independent identities.

Provenance, actual consumers, and reproduction steps: `assets/brand/README.md` and `source.json`. The family study retains the original sheep; this pass changes only the presentation background, texture, and shadows.

## Upstream Reference

Use published Basalt controls and its React Router link adapter. Both projects use `@tailwindcss/vite`; Wooly retains its Magenta chart identity and persisted card palette.
