# Changelog

All notable changes to this project will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Version numbers follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.7] - 2026-06-22

### Added
- Migrate from appleboy/ssh-action to in-house ssh-deploy@v2026.5

### Changed
- Bump @cloudflare/workers-types 4.20260620.1 → 4.20260621.1 (worker)
- Bump @types/node 25.9.3 → 26.0.0
- Bump @cloudflare/workers-types 4.20260619.1 → 4.20260620.1 (worker)
- Stub localStorage/sessionStorage so jsdom tests work on Node 24+
- Bump @cloudflare/workers-types 4.20260617.1 → 4.20260619.1 (worker)
- Bump miniflare 4.20260616.0 → 4.20260617.1 (worker)
- Bump wrangler 4.101.0 → 4.103.0 (worker)
- Bump lucide-react 1.20.0 → 1.21.0
- Add release.yml smoke test job (actionlint + SHA-pin assertions)
- Pin base-ci reusable workflow to v2026.5 SHA
- Bump undici to 7.28.0 via overrides
- Bump @cloudflare/workers-types 4.20260615.1 → 4.20260617.1 (#99)
- Bump miniflare 4.20260611.0 → 4.20260616.0 (#93)
- Bump wrangler 4.100.0 → 4.101.0 (#94)
- Bump lucide-react 1.18.0 → 1.20.0 (#92)
- Bump @cloudflare/workers-types to ^4.20260615.1 (#77)
- Bump @playwright/test 1.60.0 → 1.61.0 (#78)
- Bump vitest and @vitest/coverage-v8 to 4.1.9 (#89,#90)
- Bump @radix-ui/* primitives (#79-#88)

### Fixed
- Constant-time x-api-key comparison (#98)
- Fail closed when AUTH_ALLOWED_EMAILS is empty

### Removed
- Upgrade eslint 9.39.4 → 10.5.0, drop eslint-config-next

## [0.0.6] - 2026-06-16

### Added
- Show Visa/Mastercard/Amex/UnionPay/JCB/Discover logo on credit cards

### Fixed
- Bump worker vite/ws via overrides
- Bump vite/babel/js-yaml via overrides for OSV gates

## [0.0.5] - 2026-06-15

### Added
- Add release.ts automation, non-interactive

## [0.0.4] - 2026-06-15

First tagged release. Bundles 80 commits accumulated against `main` since
the original `0.0.3` package.json bump — captured as a single Z+1 snapshot
rather than back-filling individual tags. Future releases will follow the
single-purpose-per-release convention from `开发流程：版本号的维护`.

### Highlights

- **UI design overhaul** — full stage 0–3 of `docs/07-ui-design-audit.md`
  shipped: DashboardSegment section dividers, DashboardSkeleton / Sources
  / Tracker / Settings skeletons, SegmentedControl atom, StatCardWidget
  primary/secondary variants with chart-palette accents, Badge variant
  consolidation (info + muted), simplified 2-state ThemeToggle on chrome,
  Caveat handwriting wordmark, sidebar version chip, `data-visual-state`
  selectors on every page root.
- **30 → 36 chart palette** — 6 new white-card schemes (white/cream/cool-
  white/blush/mint/pearl) with proper inset rim + accent text colors;
  overlay-circle contrast bumped across categories.
- **Cards grid scales to 8 columns** at 1920px+.
- **Visual snapshot scaffold** — `scripts/visual-snapshot.ts` Playwright
  driver, mock-mode probe + state fixture routing, 48-shot baseline
  matrix committed under `docs/visual/baseline/`.
- **Dataset caching across routes** — `DatasetProvider` context lifts the
  single `/api/data` fetch above DashboardLayout's `key={pathname}` reset
  boundary, eliminating the "account not found" / empty-state flicker on
  navigation and member filter swaps.
- **dev.sh remote-worker mode** — points at the prod Cloudflare Worker
  by default, only boots local wrangler when `WOOLY_WORKER_URL` starts
  with `localhost`.

### Added

- `DashboardSegment`, `SegmentedControl`, `DatasetProvider`,
  `SourceDetailSkeleton`, `SourcesSkeleton`, `TrackerSkeleton`,
  `SettingsSkeleton`, `ThemeToggleSimple`, `src/lib/version.ts`,
  `src/components/icons/source-category.ts`, `src/components/icons/github.tsx`
- `StatCardWidget` `variant` + `accentColor` props
- `Badge` `info` + `muted` variants
- Source card color schemes 31–36 (white card series)
- `WOOLY_USE_MOCK` + `WOOLY_VISUAL_BYPASS_AUTH` dev-only env flags
- `?_visual=normal|empty|loading` state fixture on `/api/data`

### Changed

- Dashboard / sources / tracker / settings pages now use
  `DashboardSegment` for section grouping
- Sidebar nav group labels: `text-xs tracking-[0.15em] muted-foreground/70`
- Wordmark: Caveat 700, version chip alongside
- `BenefitStatusBadge` is now a thin wrapper over the shared `Badge`
- `sources` page cards grid: `md=2 / lg=3 / xl=4 / 2xl=6 / min-[1920px]=8`
- `useDataset` reads from `DatasetProvider` context (fetch runs once per
  session)

### Fixed

- Detail page no longer flashes "账户不存在" before data loads
- "Add account / benefit / redeemable / member" buttons no longer reopen
  the dialog populated with previously-edited item data
- Visual snapshot script disables CSS animations + waits for chart
  measurement before capturing
- White-card variants visible in the form color picker (added muted plate
  + inset hairline border)
- Source detail header icon renders the lucide component instead of the
  raw category string ("credit-card")
- `colorIndex` validator uses `COLOR_SCHEME_COUNT` instead of hardcoded
  upper bound 30
- Dashboard `chart-9..30` Tailwind utility classes now resolve (theme
  inline `--color-chart-9..30` were missing)
- Login page badge card centers vertically (`mt-auto` on footer was
  consuming the gap)

### Dependencies

Major version bumps:

- `typescript` 5.9.3 → 6.0.3
- `lucide-react` 0.563.0 → 1.17.0 (brand icons removed — Github icon
  extracted into `src/components/icons/github.tsx`)
- `sonner` 1.7.4 → 2.0.7
- `jsdom` 28.1.0 → 29.1.1
- `tailwind-merge` 2.6.1 → 3.6.0
- `@types/node` 22 → 25

Minor / patch bumps across all radix-ui primitives, next 16.2.8 → 16.2.9,
react 19.2.5 → 19.2.7, postcss 8.5.10 → 8.5.15, tailwindcss 4.2.2 → 4.3.0,
miniflare 4.2026.05.15 → 4.2026.06.11, wrangler 4.92.0 → 4.100.0,
vitest 4.1.4 → 4.1.8, @playwright/test 1.60.0 (new dev dep).

ESLint 9 → 10 was attempted and reverted: `eslint-config-next@16.2.9`
still depends on `eslint-plugin-react@7.x` which is incompatible with
ESLint 10. Tracked separately.

### Docs

- New `docs/07-ui-design-audit.md` — full UI audit comparing wooly to pew,
  with stage 0–3 implementation roadmap and acceptance criteria
- `docs/visual/README.md` + `.gitignore` documenting the snapshot
  workspace
- CLAUDE.md updated with two-mode dev workflow and "Working with Claude
  in this repo" notes (don't auto-spawn dev server, don't enable mock
  mode for ad-hoc dev)
