# 10 — 架构、运维与界面约束

[CLAUDE.md](../CLAUDE.md) 是质量契约与测试入口。此文保留模型、交互、部署和品牌的详细约束；依赖版本以清单为准，事故记录在 [Retrospective.md](../Retrospective.md)。所有下列源码路径均相对仓库根目录。

## 架构细节

### MVVM Pattern

Wooly follows a strict **Model-View-ViewModel** architecture:

| Layer | Location | Responsibility | Testable? |
|---|---|---|---|
| **Model** | `src/models/` | Pure functions: CRUD, validation, computation. No React, no state. | Yes — inline fixtures |
| **ViewModel** | `src/viewmodels/` | React hooks: orchestrate models, manage state, expose UI-ready data. | Yes — renderHook + real mock data |
| **View** | `src/app/`, `src/components/` | React components: render UI, call ViewModel hooks. No business logic. | L3 acceptance (current smoke is incomplete) |
| **Data** | `src/data/` | Mock/test fixtures, API transport. | Test executable transport logic |

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
- `DashboardLayout` passes `key={pathname}` to `LayoutInner`, causing React to remount and reset all ViewModel state on route change.

### Component Patterns

- All interactive components use `"use client"` directive.
- State patterns use `useSyncExternalStore` where possible (useIsMobile, ThemeToggle, Toaster). Rules-of-Hooks + dependency-array correctness are enforced today by Biome's `useHookAtTopLevel` and `useExhaustiveDependencies`. The stricter React 19 rules — `react-hooks/set-state-in-effect` (setState inside useEffect) and `react-hooks/refs` (ref safety) — are historical: they lived in the pre-migration tseslint stack and are currently unmapped in Biome's React ruleset, so nothing blocks a violation. Use `useSyncExternalStore` from the start anyway; the pattern is still the right one.
- Page components under `src/app/` are Server Components by default.
- CRUD dialog components follow a consistent pattern: controlled `open` prop, `onSubmit` callback, form state via `useState`.

## Domain Model

### Entities

| Entity | Key Fields | Notes |
|---|---|---|
| **Source** (权益账户) | name, category, currency, icon, website, phone, validFrom/validUntil, isArchived, cost, cardNumber, colorIndex | Credit cards, insurance, memberships. Archive excludes from calculations. cost is a free-text string (e.g., "¥3600/年", "首年免年费"). cardNumber is a free-text string for card identification (e.g., last 4 digits). colorIndex (1-24 or null) maps to chart palette colors for SourceCard background gradient. |
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
The Next.js server delegates to the Worker via `src/services/worker-client.ts`,
configured by `WOOLY_WORKER_URL` and `WOOLY_API_KEY` env vars (server-side only).

### API Pattern

Bulk read/write — NOT per-entity REST. All 7 collections transferred as a single JSON payload:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/data` | GET | Read all entities from Worker/D1 |
| `/api/data` | PUT | Write all entities back (full overwrite) |
| `/api/data/reset` | POST | Reset DB (requires WOOLY_ALLOW_RESET=true + Worker ALLOW_RESET) |

### ViewModel Async Hydration Pattern

All 6 ViewModels follow the same pattern:

1. Call `useDataset()` which returns `{ dataset, loading, scheduleSync }`.
2. Local state initialized empty (e.g., `useState<Source[]>([])`).
3. One-time hydration `useEffect` with `initializedRef` guard: when `dataset` arrives, populate all local state.
4. CRUD mutations update local state directly, then call `scheduleSync()` with a getter that builds the full Dataset from refs.
5. `scheduleSync` debounces (800ms) then PUTs the entire dataset back to the API.

The hydration useEffect needs no lint suppression — the corresponding React 19 hooks rule (`react-hooks/set-state-in-effect` under the previous ESLint stack; unmapped in Biome's current React ruleset) is not enforced today. The `initializedRef` guard already enforces the one-time-only contract regardless of which linter is active.

## 部署与开发

日常开发可能连接真实 Worker 数据；这不是 E2E 隔离环境。Playwright 当前只覆盖登录页 smoke，完整隔离流程仍待实现。代理不得自行启动用户已有的开发服务器。

### Architecture (Isolation Model)

| Environment | Site | Worker | Database |
|---|---|---|---|
| **Production** | Docker container | Cloudflare Worker | Cloudflare D1 (prod) |
| **Daily local development** | `bun run dev` (one command launches both) | `cd worker && bun run dev` (or `bun run dev:worker` from root) | `.wrangler/state` local D1 |

No separate "test" Cloudflare resources — local development uses wrangler dev which manages its own local D1 state in `worker/.wrangler/state/`.

### Worker Deploy

```bash
cd worker
wrangler d1 create <database-name>        # note the returned database_id
cp wrangler.toml.example wrangler.toml   # fill in database_name + database_id from above
bun run migrate:remote                    # apply D1 migrations to prod
wrangler secret put API_KEY               # shared key, must match WOOLY_API_KEY on site
bun run deploy                            # wrangler deploy
```

### D1 Migration

```bash
cd worker
bun run migrate:local                     # wrangler d1 migrations apply DB --local
bun run migrate:remote                    # wrangler d1 migrations apply DB --remote
```

Migrations are manual — never chained to `bun run deploy`. Run `migrate:remote` before deploying code that depends on schema changes.

### Docker Site Environment

| Variable | Purpose | Required |
|---|---|---|
| `WOOLY_WORKER_URL` | Worker endpoint (e.g., `https://wooly-worker.example.workers.dev`) | Yes |
| `WOOLY_API_KEY` | Shared key matching Worker's `API_KEY` secret | Yes |
| `WOOLY_ALLOW_RESET` | Enable `/api/data/reset` (keep `false` in prod) | No (default `false`) |
| `AUTH_GOOGLE_ID` | Google OAuth client ID | Yes |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret | Yes |
| `AUTH_SECRET` | NextAuth.js secret (`openssl rand -base64 32`) | Yes |
| `AUTH_ALLOWED_EMAILS` | Comma-separated whitelist | Yes |

### Local Dev Workflow

`scripts/dev.sh` reads `WOOLY_WORKER_URL` from `.env.local` and decides:

- **Remote worker mode** (default — `https://wooly.worker.hexly.ai`): only the Next.js site boots on port 7014. Real production data via the deployed Cloudflare Worker. Requires a real `WOOLY_API_KEY` matching the prod Worker's `API_KEY` secret; the script refuses to start if it sees `__FILL_ME__`, empty, or `dev-local-key`.
- **Local worker mode** (`http://localhost:8787`): script auto-creates `worker/.dev.vars` with `dev-local-key`, seeds matching `.env.local` values, then boots both wrangler (8787) and Next.js (7014) with prefixed logs.

Steps:

1. **Worker config (local mode only)**: `cd worker && cp wrangler.toml.example wrangler.toml` (fill in D1 IDs for local; wrangler dev creates `.wrangler/state` automatically)
2. **Migrate (local mode only)**: `cd worker && bun run migrate:local` (first time or after adding migrations)
3. **Site env**: copy `.env.example` → `.env.local`. Default `WOOLY_WORKER_URL=https://wooly.worker.hexly.ai` connects to prod; fill `WOOLY_API_KEY` with the prod secret. To run a local worker instead, change `WOOLY_WORKER_URL=http://localhost:8787` (script seeds the rest).
4. **Start**: `bun run dev` from the repo root. Ctrl-C kills everything. Use `bun run dev:site` / `bun run dev:worker` to start individually.

#### Working with Claude in this repo

- **The user keeps a dev server running themselves.** Do NOT spawn `bun run dev` / `bun run dev:site` during a Claude session — write the code, let the user verify in their already-open browser.
- **Don't enable mock mode for ad-hoc development.** During normal coding turns, work against the real worker (哥's words: "开发阶段就用真实数据"). `WOOLY_USE_MOCK=true` + visual-snapshot scaffold are still the right tool for the visual-acceptance gate (§3 of docs/07-ui-design-audit.md), but that's a separate workflow — Claude only enters mock mode when a user-requested screenshot matrix demands it, and shuts the test server down when done.
- For verification turns, prefer `bun run typecheck` / `bun run lint` / `bun run test` — they're cheap and exercise the same code paths.

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
- **New pages**: Create under `src/app/(dashboard)/`. Add route to `PAGE_TITLES` in `DashboardLayout.tsx` and `NAV_GROUPS` in `AppSidebar.tsx`. Standalone pages go under `src/app/(auth)/`.
- **Environment variables**: Secrets in `.env.local` (gitignored). Template in `.env.example` (committed).
- **CRUD immutability**: All model CRUD functions return new arrays/objects. Never mutate the input.
- **Validation**: Model CRUD functions return `ValidationError[]`. ViewModels surface these as user-facing error state.
- **`stripUndefined` generic constraint**: Use `T extends object` (not `Record<string, unknown>`) because TS interfaces lack implicit index signatures.

## Authentication

Uses **NextAuth.js v5** (Auth.js) with Google OAuth provider and email whitelist.

- Google provider with `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` from env. `signIn` callback checks email against `AUTH_ALLOWED_EMAILS` whitelist.
- Route protection via `src/proxy.ts`: all routes require auth except `/login`, `/api/auth/*`, `/_next`, `/favicon*`, `/logo/*`.
- `trustHost: true` enables URL auto-detection from `Host` / `x-forwarded-host` headers — works across localhost and reverse proxy without changing env vars.
- Env vars: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`, `AUTH_URL` (optional), `AUTH_ALLOWED_EMAILS`, `USE_SECURE_COOKIES` (for HTTPS dev proxy).

## Logo System

Root `logo.png` is the canonical 2048 × 2048 transparent master, adopted from the framing repair `wooly/2026-09-07-02`, finishing `01`. Keep its natural fleece entry, wink, tongue, and protected feature margins; identity changes require explicit direction. Regenerate derivatives with `uv run --with pillow python scripts/resize-logos.py`:

- `public/logo-{24,80}.png` and `src/app/icon.png` / `favicon.ico` use the transparent foreground.
- `assets/brand/icon.png` and `icon-rounded.png` preserve the selected presentation separately. README and Open Graph use the rounded presentation; Apple touch uses the square presentation.
- `Logo` (`src/components/Logo.tsx`) uses the transparent size variants on both themes. Account favicons and card-network logos are independent identities.

Provenance, actual consumers, and reproduction steps: `assets/brand/README.md` and `source.json`. The family study retains the original sheep; this pass changes only the presentation background, texture, and shadows.

## Upstream Reference (basalt)

When porting from basalt (`/Users/nocoo/workspace/personal/basalt`):

- Replace `useLocation` -> `usePathname`, `useNavigate` -> `useRouter`, `<Outlet>` -> `{children}`.
- Add `"use client"` to any component with hooks, event handlers, or browser APIs.
- basalt uses `@tailwindcss/vite`; wooly uses `@tailwindcss/postcss`.
- basalt's chart-1 was blue `217 91% 60%`; in wooly it is magenta `320 70% 55%` (swapped with chart-12).
