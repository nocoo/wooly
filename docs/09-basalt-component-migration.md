# 09 — Basalt Component Migration Plan & Status Inventory

> **Goal**: Migrate Wooly from local bespoke/copied Basalt-style components to official `@nocoo/basalt@2.1.7` public controls.
> **Baseline HEAD**: `3cc358e` (merged `#512`, removing unused `src/components/ui/separator.tsx`).
> **Package Version**: `0.0.7` (unchanged, never bump).
> **Design References**: `@nocoo/basalt@2.1.7`, `INTEGRATION.md`, `docs/07-ui-design-audit.md`.
> **Language**: All UI in Chinese; documentation follows repository English conventions.

---

## 1. Inventory & Architectural Grounding

### 1.1 Current Architecture & Lineage
Wooly is a household benefits tracking dashboard built on Next.js 16 (App Router) + React 19 + Tailwind CSS v4. Historically, it replicated Basalt's 3-layer luminance hierarchy (L0 body, L1 content island, L2 cards) and floating island shell, but relied on hand-rolled Radix/shadcn clones in `src/components/ui/` and raw HTML elements (`<button>`, `<input>`, `<select>`).

### 1.2 Migration Principles (Outside-In)
1. **Providers & CSS Foundation**:
   - `globals.css` imports `@source "../../node_modules/@nocoo/basalt/dist/**/*.{js,jsx,ts,tsx}";` (resolved from `src/app/`), followed by `@import "@nocoo/basalt/styles/tailwind";` and `@import "tailwindcss";` in strict order.
   - Root providers wrap the app: `ThemeProvider`, `AccentProvider`, `LinkProvider`, `TooltipProvider`, and granular `Toaster`.
   - Brand color: **Magenta** (`HSL 320 70% 55%` in light mode, `320 70% 60%` in dark mode) registered via `AccentProvider`'s `paletteOverrides` for `primary`. No parallel generic surface tokens or global hard overrides.
2. **Identity & Assets**:
   - Preserve canonical Wooly alpaca brand logo in `src/components/Logo.tsx` (`public/logo-{24,80}.png`, `assets/brand/`). Never replace it with `BasaltMark`.
   - Preserve 24 chromatic card palette tokens, 6 black card variants, and 6 white card variants in `src/lib/palette.ts`. Persisted `colorIndex` (1–36) represents financial/account brand identity and is distinct from Basalt's 5-color chart cycle.
   - Ensure the logo remains stationary during sidebar expand/collapse transitions (260px ↔ 68px).
3. **Shell Chrome & Navigation**:
   - Replace hand-written layout with `@nocoo/basalt/components/app-shell` (`AppShell`, `AppMain`, `AppSkipLink`), `@nocoo/basalt/components/app-header` (`AppHeader`), and `@nocoo/basalt` (`ContentIsland`, `Sheet`).
   - Breadcrumbs in `AppHeader` must have exact, clickable parent links; terminal current-page title is non-clickable.
   - Mobile breakpoint `< 768px` uses `Sheet` drawer; auto-closes on route change.
4. **Pages, Sectioning & Surfaces**:
   - Standardize page chrome with `PageHeader` (title, description, actions, filters).
   - Use `SectionRule` for regions instead of arbitrary dividers.
   - Surfaces strictly follow L0 → L1 → L2 → L3 luminance progression (`data-basalt-surface`). No white frames wrapping dark cards.
5. **Charts & Visualizations**:
   - Evaluate all charts against public `@nocoo/basalt/charts/*` APIs:
     - `BarChartCard` (monthly redemption trends) maps directly to `@nocoo/basalt/charts/bar` (`BarChart`).
     - `RadialProgressCard` (overall usage) maps to `@nocoo/basalt/charts/gauge` (`Gauge`) or `donut` (`DonutChart`).
     - `StatCardWidget` / `StatGrid` maps to `@nocoo/basalt/charts/stat-card` (`StatCard`, `StatGrid`).
     - Complex domain-specific cards (e.g. `SourceCard` credit card visual gradient, `BenefitProgressRow`) remain structured domain components wrapping `LayerCard`, with underlying buttons and badges fully converted to Basalt controls.
6. **Leaf Controls & Dialogs**:
   - Completely eliminate raw `<button>`, `<input>`, `<select>`, `<textarea>` across all active views.
   - Migrate dialogs (`SourceFormDialog`, `BenefitFormDialog`, `MemberFormDialog`, `RedeemDialog`, `RedeemableFormDialog`) to Basalt `Dialog`, `Field`, `Input`, `Select`, `Button`.
   - `DeleteConfirmDialog` maps to Basalt `ConfirmDialog` / `AlertDialog`.
   - Delete obsolete `src/components/ui/` wrappers; do not maintain parallel component libraries.

---

## 2. Route & View Migration Inventory

### 2.1 Route Map & Detailed Coverage

| Route | View Component / File | Purpose & Semantics | Actions & States to Validate | Migration Target |
|---|---|---|---|---|
| `/login` | `src/app/(auth)/login/page.tsx` | ISO ID 54/86 visitor badge card with Google sign-in | Sign in action, error query param banner, loading fallback | `Button`, `LayerCard` surface, `LoadingScreen`, maintain badge ratio and sheep Logo |
| `/` | `src/app/(dashboard)/page.tsx` | Household overview: metrics, expiring alerts, overall usage, monthly trend, top sources | Normal / empty visual state, skeleton loading | `PageHeader`, `SectionRule`, `StatGrid`/`StatCard`, `BarChart`, `Gauge`, `LayerCard` |
| `/sources` | `src/app/(dashboard)/sources/page.tsx` | Account cards matrix (bank cards, points sources), member filter, archive toggle | Add source modal, filter by member, archive accordion, empty/loading | `PageHeader` (inline member filter + add button), `SectionRule`, `SourceCard` (LayerCard), `PointsSourceCard` |
| `/sources/[id]` (regular) | `src/app/(dashboard)/sources/[id]/page.tsx` | Source details: cycle status, benefit list, quick redeem, edit source, delete source, add benefit | Redeem modal, undo, edit benefit, delete confirmation, empty/loading | `AppHeader` breadcrumb (`/sources` clickable), `PageHeader`, `SectionRule`, `BenefitProgressRow` (LayerCard.Well), `ConfirmDialog` |
| `/sources/points-[id]` | `src/app/(dashboard)/sources/[id]/page.tsx` (`PointsDetailView`) | Points account detail: point balance, redeemables list, add redeemable, edit/delete redeemable | Add redeemable, edit, delete, empty/loading | Distinct points header, `PageHeader`, `LayerCard`, `ConfirmDialog`, `RedeemableFormDialog` |
| `/tracker` | `src/app/(dashboard)/tracker/page.tsx` | Redemption operations: quick actions, recent redemption log, redeemable benefits | Quick redeem modal, undo redemption, status filter, empty/loading | `PageHeader`, `SectionRule`, `RecentListCard` (LayerCard), `Button`, `BenefitStatusBadge` |
| `/settings` | `src/app/(dashboard)/settings/page.tsx` | Family members, preferences, timezone, account info | Add/edit member, delete member with dep check, switch timezone/theme, sign out | `PageHeader`, vertical tabs/nav with `LayerCard`, `Field`, `Select`, `ConfirmDialog` |

---

## 3. Chart & Widget Strategy

| Current Component | File | Public Basalt Target | Rationale & Retention Note |
|---|---|---|---|
| `StatCardWidget`, `StatGrid` | `src/components/dashboard/StatCardWidget.tsx` | `@nocoo/basalt/charts/stat-card` (`StatCard`, `StatGrid`) | Direct replacement. Preserves metric display, icons, and accent bars. |
| `BarChartCard` | `src/components/dashboard/BarChartCard.tsx` | `@nocoo/basalt/charts/bar` (`BarChart`) + `LayerCard` | Direct replacement. Monthly trends are standard XY categorical bars. |
| `RadialProgressCard` | `src/components/dashboard/RadialProgressCard.tsx` | `@nocoo/basalt/charts/gauge` (`Gauge`) or `donut` (`DonutChart`) | Replaces bespoke Recharts `RadialBarChart` with accessible Basalt chart widget. |
| `ItemListCard`, `RecentListCard` | `src/components/dashboard/RecentListCard.tsx`, `ItemListCard.tsx` | `LayerCard`, `LayerCard.Header`, `LayerCard.Body`, `LayerCard.Well` | Replaces custom `Card` wrappers with semantic `LayerCard` surfaces. |
| `SourceCard` | `src/components/SourceCard.tsx` | Domain composite component wrapping `LayerCard` | Retains custom financial card gradient and 24-palette colorIndex logic (financial identity, not 5-color chart cycle). Converts action buttons and menus to Basalt controls. |
| `PointsSourceCard` | `src/components/PointsSourceCard.tsx` | Domain composite component wrapping `LayerCard` | Retains points card styling; converts actions to Basalt `Button` and `DropdownMenu`. |
| `BenefitProgressRow` | `src/components/dashboard/BenefitProgressRow.tsx` | `LayerCard.Well` + Basalt `Button` + `Badge` + `Meter` | Direct conversion to L3 surface well and official controls. |

---

## 4. Component Replacement Mapping

| Obsolete Component | Path | Replacement | Plan |
|---|---|---|---|
| `Button` | `src/components/ui/button.tsx` | `@nocoo/basalt` `Button` | Delete file, migrate callers |
| `Input` | `src/components/ui/input.tsx` | `@nocoo/basalt` `Input` | Delete file, migrate callers |
| `Label` | `src/components/ui/label.tsx` | `@nocoo/basalt` `Label`, `Field` | Delete file, migrate callers |
| `Select` | `src/components/ui/select.tsx` | `@nocoo/basalt` `Select` | Delete file, migrate callers |
| `Dialog` | `src/components/ui/dialog.tsx` | `@nocoo/basalt` `Dialog` | Delete file, migrate callers |
| `AlertDialog` | `src/components/ui/alert-dialog.tsx` | `@nocoo/basalt` `AlertDialog`, `ConfirmDialog` | Delete file, migrate callers |
| `DropdownMenu` | `src/components/ui/dropdown-menu.tsx` | `@nocoo/basalt` `DropdownMenu` | Delete file, migrate callers |
| `Badge` | `src/components/ui/badge.tsx` | `@nocoo/basalt` `Badge` | Delete file, update `BenefitStatusBadge` |
| `Card` | `src/components/ui/card.tsx` | `@nocoo/basalt` `LayerCard` | Delete file, migrate callers |
| `Collapsible` | `src/components/ui/collapsible.tsx` | `@nocoo/basalt` `Collapsible` | Delete file, migrate callers |
| `Command` | `src/components/ui/command.tsx` | `@nocoo/basalt` `CommandPalette` | Delete file, migrate callers |
| `SegmentedControl` | `src/components/ui/segmented-control.tsx` | `@nocoo/basalt` `SegmentControl` | Delete file, update tests |
| `Avatar` | `src/components/ui/avatar.tsx` | `@nocoo/basalt` `Avatar` | Delete file, migrate callers |
| `Tooltip` | `src/components/ui/tooltip.tsx` | `@nocoo/basalt` `Tooltip` | Delete file, migrate callers |
| `Sonner` | `src/components/ui/sonner.tsx` | `@nocoo/basalt` `Toaster`, `toast` | Delete file, migrate callers |
| `Skeleton` | `src/components/ui/skeleton.tsx` | `@nocoo/basalt/components/skeleton-line` (`SkeletonLine`) | Delete file, migrate callers |

---

## 5. Logical Migration Phases (Self-Contained Atomic Commits)

To avoid broken intermediate states (e.g. CSS removed before consumers update), migration is grouped into 6 coherent, fully-passing phases:

### Phase 1: Dependency, Styling & Root Provider Infrastructure
- Commit: `build(deps): install @nocoo/basalt 2.1.7 and configure providers`
- Add `@nocoo/basalt@2.1.7`.
- Configure `src/app/globals.css` with exact `@source "../../node_modules/@nocoo/basalt/dist/**/*.{js,jsx,ts,tsx}";` and Basalt Tailwind import order.
- Set up `ThemeProvider` with `paletteOverrides` for Wooly Magenta (`320 70% 55%` / `320 70% 60%`), `AccentProvider`, `LinkProvider` (`next/link`), `TooltipProvider`, and Basalt `Toaster`.
- Keep existing custom `--chart-*` palette tokens in CSS intact.

### Phase 2: AppShell, AppHeader, AppSidebar & Login Page
- Commit: `feat(shell): migrate app frame, navigation and login to basalt shell`
- Migrate `DashboardLayout.tsx` to `AppShell`, `AppMain`, `AppSkipLink`, `AppHeader`, `ContentIsland`, and `Sheet` (mobile).
- Migrate `AppSidebar.tsx` to Basalt `Sidebar` primitives and `CommandPalette`. Ensure Logo position is rock-solid across collapse states.
- Migrate `src/app/(auth)/login/page.tsx` using Basalt `Button`, keeping 54/86 badge ratio and sheep Logo.
- Migrate `LoadingScreen.tsx` to Basalt `LoadingScreen` with sheep Logo `mark`.

### Phase 3: Dashboard Overview & Public Chart Controls
- Commit: `feat(dashboard): adopt page-header, section-rule and basalt charts`
- Rewrite `src/app/(dashboard)/page.tsx` with `PageHeader` and `SectionRule` sections (概览, 关注, 分析).
- Migrate `StatCardWidget` to `@nocoo/basalt/charts/stat-card` (`StatCard`, `StatGrid`).
- Migrate `BarChartCard` to `@nocoo/basalt/charts/bar` (`BarChart`).
- Migrate `RadialProgressCard` to `@nocoo/basalt/charts/gauge` (`Gauge`).
- Migrate `ItemListCard` and `RecentListCard` to `LayerCard`.

### Phase 4: Sources & Source Detail (Including Points Detail)
- Commit: `feat(sources): migrate sources, card matrix and points detail`
- Refactor `src/app/(dashboard)/sources/page.tsx`: `PageHeader` with inline `MemberFilterBar` and "添加账户" button.
- Refactor `src/app/(dashboard)/sources/[id]/page.tsx`:
  - `AppHeader` breadcrumb hierarchy: `权益账户 > [账户名称]`.
  - Regular source detail: `PageHeader`, `SectionRule`, `BenefitProgressRow` with `LayerCard.Well`.
  - Points source detail (`PointsDetailView`): distinct points metric header, redeemables list.
- Update `SourceCard` and `PointsSourceCard` with Basalt `Button` and `DropdownMenu`, preserving 24-palette color styles.

### Phase 5: Tracker, Settings & All Form Dialogs
- Commit: `feat(tracker,settings): migrate tracker, settings and dialog forms`
- Refactor `src/app/(dashboard)/tracker/page.tsx`: `PageHeader`, `SectionRule` (统计, 核销日志, 可核销权益), `Button`, `RecentListCard`.
- Refactor `src/app/(dashboard)/settings/page.tsx`: `PageHeader`, vertical navigation, `Field`, `Input`, `Select`.
- Refactor dialogs: `SourceFormDialog`, `BenefitFormDialog`, `MemberFormDialog`, `RedeemDialog`, `RedeemableFormDialog` to Basalt `Dialog`, `Field`, `Input`, `Select`, `Button`.
- Refactor `DeleteConfirmDialog` to Basalt `ConfirmDialog`.

### Phase 6: Purge Legacy UI Wrappers & Update Unit Tests
- Commit: `chore(cleanup): remove legacy ui components and update unit tests`
- Delete all obsolete files in `src/components/ui/`.
- Scan and replace any remaining raw `<button>`, `<input>`, `<select>` across all active views.
- Update `BenefitStatusBadge.test.tsx` to match public Basalt Badge tokens; remove obsolete `segmented-control.test.tsx` and `ThemeToggleSimple.test.tsx`.
- Complete fixes for review findings:
  - W6: Restore semantic status colors in `BenefitProgressRow` and `tracker/page.tsx` via Meter `[--basalt-primary:...]` variable overriding; fix action reminder contrast using L3 well brightness.
  - W11: Restore `BenefitFormDialog` default custom cycle anchor `{ period: "monthly", anchor: 1 }` and credit input `min={0.01}` / `step={0.01}`.
  - W12: Expose `aria-pressed` selection state and contrast styling on benefit type buttons; associate labels with shared and cycle override switches via `aria-labelledby`; provide explicit `aria-label` for cycle month/day inputs.
  - W13: Replace raw anchor in `/login` top-right with public `Button asChild`.
  - W14: Add `seriesLabel` prop to `BarChartCard` (defaulting to "核销次数") and pass "账户数量" from `/sources`.
- Ensure all CI gates pass: `typecheck`, `lint`, `gate:dynamic-delete`, `gate:ts-expect-error`, `test:unit:coverage`.
- Maintain test coverage above thresholds (90% statements/functions/lines, 80% branches) and report actual measured values.

---

## 6. Acceptance & Regression Matrix

| Requirement / Issue | Acceptance Criteria | Verification Method |
|---|---|---|
| **Sidebar Logo Stability** | Logo strictly retains horizontal/vertical coordinates during 260px ↔ 68px toggle; no jumping or layout shift. | Visual inspection during CSS transitions. |
| **Breadcrumb Accuracy** | Every breadcrumb segment has an active destination (`/sources` links to list; terminal title is text-only). | Manual/automated navigation check. |
| **Header Sizing & Alignment** | `PageHeader` title (`text-2xl`), subtitle, and actions align properly. Primary create button is positioned last. | Visual alignment and responsive check. |
| **Filter Placement** | Small filter sets (`MemberFilterBar`) align inline with actions. Complex filters occupy dedicated sections. | Check `/sources` and `/tracker` layouts. |
| **Surface Progression** | Content surfaces brighten sequentially: L0 (`--basalt-background`) → L1 (`--basalt-card`) → L2 (`--basalt-secondary`) → L3 (`--basalt-bright`). No white boxes nesting dark content. | Compute active CSS variables in light & dark modes. |
| **Zero Raw HTML Controls** | Zero instances of unstyled `<button>`, `<input>`, `<select>`, `<textarea>` in active product pages. | `rg -n '<button\b|<input\b|<select\b|<textarea\b' src --glob '!*.test.*'` returns 0 unapproved instances. |
| **Mobile Drawer Behavior** | At `< 768px`, rail shifts to `Sheet` drawer; menu button opens drawer; selecting route or clicking overlay closes drawer. | Viewport set to 375px. |
| **Interactive Form States** | Real submission, cancel, error state, and disabled buttons function correctly across all 6 dialogs. | Full interactive testing of CRUD flows. |
| **Brand & Palette Preservation** | Magenta primary color and 24 chromatic + 6 black + 6 white card palettes remain 100% intact. | Visual verification of source cards and badges. |
| **Code Quality & Coverage** | Typecheck clean, lint clean, zero dynamic delete, zero unannotated ts-expect-error, L1 test coverage ≥ 90% (80% branch). | Run full test suite and CI validation scripts. |

---

## 7. Migration Completion & Review Verification Record

- **Final Commit**: Phase 6 completion with all review items W1–W14 closed.
- **Review Findings Closure**:
  - **W1–W5, W7–W10**: Preserved from prior commits (collapsible sidebar groups, header GitHub link, mobile hidden rail, theme prehydrate, source/points details, Gauge formatting, member cascade dependents, deduplicated Cmd+K listener).
  - **W6**: Preserved semantic status severity colors across `BenefitProgressRow` (`success`, `info`, `warning`, `muted`) and `tracker` (expiring soon warning) via CSS variable overrides on public `Meter`. Resolved action reminder well nesting luminance (`bg-basalt-bright` on L3 well).
  - **W11**: Restored baseline business defaults `{ period: "monthly", anchor: 1 }` on cycle override toggle and enforced `min={0.01}`, `step={0.01}` on credit amounts in `BenefitFormDialog`.
  - **W12**: Added `aria-pressed` selection semantics and readable contrast styling to benefit type toggle buttons; added `aria-labelledby` binding to shared and custom cycle switches; ensured month/day inputs have clear accessible labels.
  - **W13**: Migrated `/login` GitHub repository link from raw `<a>` to public `Button asChild`.
  - **W14**: Parameterized `BarChartCard` series label so `/sources` correctly labels account category distributions as "账户数量".
  - **W15**: Migrated `PointsSourceCard` and surrounding containers in all 5 skeleton views (`DashboardSkeleton`, `SourcesSkeleton`, `SourceDetailSkeleton`, `TrackerSkeleton`, `SettingsSkeleton`) to public `LayerCard` and `LayerCard.Well` primitives, maintaining L0 → L1 → L2 → L3 surface luminance progression.
  - **W16**: Cleaned `globals.css` of obsolete generic shadcn CSS tokens (surfaces, sidebar, popover, animations, heatmaps), removed dead dependency `tw-animate-css`, while strictly preserving the FULL 36 persisted account card palette colors across light/dark themes.
  - **W17**: Fixed `SEVERITY_METER_CLASS.accent` CSS variable self-reference cycle by allowing natural inheritance of the brand primary color without redundant override.
  - **W18**: Restored body `bg-basalt-background text-basalt-foreground` after CSS cleanup (`11bdcac`). Ghost header controls inherit foreground on dark. Root rechecks light/dark. Sign-off pending.
  - **W19**: Cleared `SkeletonLine` default inline 65% width via public `style={{ width: undefined }}` so Tailwind `w-*` applies; aspect card placeholders use `h-auto`. Five skeleton views (`ed56f36`). Root rechecks forced-loading sizes. Sign-off pending.
- **Phase 6 Cleanup**:
  - Purged `src/components/ui/` (**16** local UI files vs `3cc358e`). `ThemeToggle` / `ThemeToggleSimple` were separate wrappers, not in that count. Removed unused `--color-destructive` alias (`ac46d96`).
  - Migrated all remaining skeletons (`DashboardSkeleton`, `SourcesSkeleton`, `SourceDetailSkeleton`, `TrackerSkeleton`, `SettingsSkeleton`) to `@nocoo/basalt/components/skeleton-line` and `LayerCard`.
  - Purged obsolete component wrappers `ThemeToggle` / `ThemeToggleSimple`, `DashboardSegment`, and their legacy tests.
  - Cleaned direct dependencies in `package.json` (`@radix-ui/*`, `class-variance-authority`, `cmdk`, `sonner`, `tw-animate-css`), verified `bun.lock` integrity with 0 mirror URLs.
- **Verification Gates Measured**:
  - `typecheck`: Clean (0 errors).
  - `lint`: Clean (Biome 0 errors/warnings, `gate:dynamic-delete` clean, `gate:ts-expect-error` clean).
  - `test:unit:coverage`: 556 passing tests across 26 test suites. Coverage: Statements 99.26%, Branches 95.05%, Functions 99.68%, Lines 99.9% (all well above 90%/80% thresholds).
  - `build`: Production build successful (`next build --webpack`).
  - `wooly-interactions.cjs`: All 7 automated end-to-end interactive flows (`shell`, `members`, `source-form`, `benefit-form`, `tracker-redeem-undo`, `points-detail`, `mobile-navigation`) passing.
