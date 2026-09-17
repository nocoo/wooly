# Wooly

Chinese family benefits, redemption and loyalty-points dashboard.
Profile: `ts-worker-web` (Next.js server + Cloudflare Worker/D1).
Direction: [docs](docs/README.md); detailed constraints: [maintainer notes](docs/10-maintainer-notes.md). Frameworks must preserve this handbook.

## Sources of Truth

This file is the contract; hooks, CI and config enforce it. Raise weaker enforcement, never lower the contract.

| Fact | Where |
|---|---|
| Human docs / model | [README.md](README.md), [data model](docs/01-data-model.md), [MVVM](docs/02-mvvm-architecture.md) |
| Version / setup | `package.json`, `worker/package.json`, both frozen `bun.lock` files; [development](docs/08-development.md) |
| Enforcement | `.husky/`, `.github/workflows/ci.yml`, `vitest.config.ts`, `worker/vitest.config.ts` |
| Env | Ignored `.env.local`, `worker/.dev.vars`, local `worker/wrangler.toml`; templates contain no secret values |
| Machine rules / accidents | Global `AGENTS.md` and `rules/`; [Retrospective.md](Retrospective.md) |

## Project Invariants

- All product UI text is Chinese. Use published `@nocoo/basalt` controls, Magenta identity, Basalt L0–L3 surfaces and the persisted 36-color account palette; never copy local Basalt/shadcn primitives or hardcode CSS colors.
- Models are pure and immutable, return validation errors, and have no React/state. Views call ViewModels; ViewModels orchestrate real models and dataset hydration. Preserve 800ms full-dataset sync and the initialization guard.
- `/api/data` reads/writes all seven collections as a full overwrite; preserve relationships and complete payloads. Worker URL/key stay server-side. Reset requires both site and Worker flags and remains disabled in production.
- Google OAuth requires the configured email whitelist. Preserve proxy/public-route boundaries and reverse-proxy auth/cookie behavior; never expose `WOOLY_API_KEY` to the browser.
- Root layout has providers but no sidebar; dashboard/auth route groups stay distinct. Route changes reset ViewModels via `key={pathname}`; add navigation entries to both page-title and nav-group maps.
- The user keeps the daily dev server running; agents must not launch another. Normal dev can use real Worker data. Mock mode is reserved for an explicitly requested screenshot matrix and must be stopped afterward.
- Preserve the canonical sheep master, protected feature margins and separate transparent/presentation derivatives; identity changes require direction. Provenance and regeneration: [brand archive](assets/brand/README.md). Apply schema migrations before dependent deployment.

## Stack / Layout

| Component | Choice / location |
|---|---|
| UI | Next.js App Router, React, Tailwind v4, published Basalt; `src/app/`, `src/components/` |
| Logic | `src/models/`, `src/viewmodels/`, `src/hooks/`, `src/services/` |
| Data | `worker/` API + D1 migrations; `src/data/` transport/fixtures |
| Quality | Bun 1.3.6, TypeScript 7, Biome + oxc gates, Vitest + Miniflare, Playwright |

## Commands

From root; install both lanes. Use their locked dependencies and gitleaks/osv-scanner on PATH.

```bash
bun install --frozen-lockfile
(cd worker && bun install --frozen-lockfile)
bun run typecheck
bun run typecheck:worker
bun run lint
bun run build
bun run test:unit:coverage
bun run test:worker
bun run test:api
```

`build` uses Next's webpack builder; typecheck is not a build. Unit model fixtures are inline; ViewModel tests use real model functions and the shared `mockUseDatasetModule()` helper.
`bun run dev` selects remote/local Worker mode from `WOOLY_WORKER_URL`; setup, auth variable names and migrations are in [maintainer notes](docs/10-maintainer-notes.md).
`bun run test:e2e:bdd` runs the existing login smoke. Before expanding/running authenticated flows, provide a verified local fixture stack; its current config can inherit dev env and reuse a server.

## Verification

6DQ = L1/L2/L3 + G1/G2 + D1 isolation. Status: `enforced`, `planned`, `manual`, `N/A`. No skipped/focused tests or lowered thresholds.

| Piece | Required proof and current reality | Status | Evidence / gap |
|---|---|---|---|
| L1 app | All four coverage metrics ≥95%; configured model/VM/lib/hook scope enforces 95, but loading/transport exclusions need coverage review | planned | `vitest.config.ts`; pre-commit, pre-push and CI run the scoped gate |
| L1 Worker | Statements/branches/functions/lines each ≥95% | planned | Worker tests run in hooks/CI, but `worker/vitest.config.ts` has no coverage gate |
| L2 | Real local HTTP covering every route/method and SQL behavior | planned | `test:api` imports handlers with mocked fetch; Worker Miniflare SQL tests are in-process, not full HTTP L2 |
| L3 | Critical household CRUD/redemption/auth journeys | planned | CI enables `test:e2e:bdd`, but `e2e/bdd` currently covers only login smoke |
| G1 | Strict types + check-only lint, zero errors/warnings in app and Worker | enforced | Root/Worker typechecks, Biome/oxc hooks and CI |
| G2 | Required secret and dependency scanners; missing binary fails | enforced | Pre-commit gitleaks; pre-push OSV root + Worker; shared CI security; push-ref gap below |
| D1 | Per-run local storage and guard/marker before fixtures/reset/cleanup | planned | Worker unit Miniflare is local; browser harness lacks a dedicated guarded fixture stack |
| Build | Actual Next output | enforced | Pre-push and CI `bun run build` |
| Docs | Update affected numbered docs and review full-dataset/UI invariants | manual | Source and diff review |

Pre-commit runs eight stages: coverage, Worker tests, mocked API tests, root types, staged lint, gitleaks and two oxc gates. Only the oxc gates use an index snapshot; full snapshot coverage remains planned (target <30s).
Pre-push runs build, coverage, mocked API, Worker tests/types, lint and both OSV scans in parallel; real L2 and stdin-ref secret scanning remain planned (target <3min).
Hooks are check-only; never use `--no-verify`, disable gates or commit a failing TDD state.

## Resources / Isolation

Dev site: 7014; optional local Worker: 8787 with daily `worker/.wrangler/state`. Default remote Worker mode uses production data and must never become E2E input.
Existing L3: 27014; no real-HTTP L2 port is provisioned. Do not share dev state: target local Wrangler/Miniflare with a fresh per-run SQLite directory, test-context guard and `_test_marker`.
Never deploy remote `-test` resources. Current browser smoke is not proof of the full isolation contract.

## Operations / Release

Authorized release entry: `bun run release`; Worker deploy and local/remote migration commands are in [maintainer notes](docs/10-maintainer-notes.md).
Migrations are manual and precede code deployment; reset stays off in production. Verify the deployed health endpoint using the current Worker contract.

## Retrospective

Narratives: [Retrospective.md](Retrospective.md); cross-project lessons: global rules/nmem; deterministic rules: tests/hooks.
- Pre-filter redemptions by benefit ID before `computeBenefitCycleStatus`; use the configured timezone consistently.
- Prefer `useSyncExternalStore` or keyed resets; retain `T extends object` for interface-compatible generics.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
