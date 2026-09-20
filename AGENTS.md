# Wooly

Chinese household benefits, redemption and loyalty-points dashboard. Profile: `ts-worker-web` (Vite SPA + Cloudflare Worker/D1).

## Sources of truth

This handbook applies throughout the repository. There are no nested handbooks. Maintain only `AGENTS.md`; do not create a legacy alias or copy.

- Root `package.json` and `bun.lock`: sole version and dependency source.
- `wrangler.jsonc`: production and isolated local/test bindings.
- [Development](docs/08-development.md), [domain and UI constraints](docs/10-maintainer-notes.md), [migration](docs/11-workers-migration.md).
- `.husky/`, CI and Vitest configs enforce quality. Never lower coverage, skip tests or bypass hooks.
- Machine procedures live in global AGENTS.md; incidents belong in [Retrospective.md](Retrospective.md).

## Invariants

- Product UI is Chinese. Use published Basalt controls, Magenta identity, L0-L3 surfaces and the persisted 36-color account palette. Preserve the canonical sheep master and derivative provenance.
- Models are pure and immutable and return validation errors. Views call ViewModels; ViewModels use real models and guarded one-time hydration. Preserve the 500ms full-dataset sync.
- `/api/data` transfers six entity arrays plus `defaultSettings` as a full overwrite. Preserve relationships and complete payloads. Concurrent writers can overwrite changes; no merge behavior is promised.
- Cloudflare Access is the only production identity provider. Validate JWT signature, issuer, audience, expiry and user claims. Require matching Origin for mutations and no-store for private responses.
- Production reset, local identity, workers.dev and preview URLs stay disabled. Retain the existing D1 database; never use production as test fixtures.
- `DashboardLayout` resets ViewModels with `key={pathname}`. New routes belong in the router, page-title map and sidebar map.
- Do not launch a second daily server. Automated verification uses dedicated isolated test resources.
- Keep `T extends object` for interface-compatible generic helpers. Filter redemptions by benefit before computing cycle status and consistently apply configured timezone.

## Layout and commands

`src/pages/` and `src/components/` render views; `src/models/`, `src/viewmodels/`, `src/hooks/`, `src/data/` handle domain behavior. `worker/src/` handles authentication and persistence. `worker/migrations/` contains schema changes.

Run from the repository root with Bun 1.4.0, Node.js 22.12+ and the machine-approved registry. Local bindings and the synthetic developer identity are already in `wrangler.jsonc`; no production credentials are needed:

```bash
bun install --frozen-lockfile
bun run db:migrate
bun run dev
bun run typecheck
bun run lint
bun run build
bun run test:unit:coverage
bun run test:worker
bun run test:api
bunx playwright install chromium
bun run test:e2e:bdd
bun run deploy:check
```

## Verification contract

Statuses describe configured enforcement; a passing run is separate evidence. Run relevant checks, preserve normal hooks, and do not execute production operations merely to validate documentation.

| Dimension | Contract and current evidence |
| --- | --- |
| L1 app | **Enforced:** statements/branches/functions/lines >=95% for the configured scope in `vitest.config.ts`, through hooks and CI. View rendering, browser transport and dataset hydration are outside this coverage gate; L3 exercises critical paths. No skipped/focused tests. |
| L1 Worker | **Enforced:** all four metrics >=95% across `worker/src`, via `worker/vitest.config.ts`, hooks and CI. |
| L2 integration | **Enforced:** `tests/api/` covers every declared API endpoint/method over real local HTTP against the bundled Worker and D1, including JWT, origins, validation and reset denial. |
| L3 system | **Enforced in CI**, also manual: `e2e/bdd/` covers household CRUD, persistence, nested route reload and session recovery. It does not automate the real Access identity-provider login. |
| G1 static | **Enforced:** strict app, Worker and test TypeScript, check-only Biome with zero warnings, and oxc gates. |
| G2 security | **Enforced:** staged gitleaks at pre-commit and OSV on `bun.lock` at pre-push; shared CI runs both scanners. Missing required binaries fail. Push-ref secret scanning remains **planned**. |
| D1 isolation | **Enforced:** local Miniflare/Vite, separate ports and temporary state. HTTP harness verifies `_test_marker` on setup/close and around dataset resets; browser harness verifies it before startup. Marker revalidation before every fixture/reset and browser teardown remains **planned**. |
| Build | **Enforced:** Vite client/Worker build in pre-push and CI; Wrangler dry run is a **manual** preflight. |

Pre-commit runs app coverage, Worker tests, HTTP tests, types, staged lint, staged gitleaks and index-snapshot oxc gates. Pre-push runs build, app coverage, HTTP/Worker tests, Worker types, lint and OSV. Most checks use the working tree; only oxc pre-commit gates use a full index snapshot.

The personal target is index-snapshot L1 + G1 at pre-commit (<30s), then stdin-push-ref L2 + G2 at pre-push (<3min). Full snapshot/ref execution and timing guarantees remain **planned**; do not claim those gates exist.

## Operations

Daily dev uses `http://127.0.0.1:7014` and `.wrangler/state`. Playwright uses port 27014 and a unique temporary database. HTTP fixtures use ephemeral ports. Never deploy local/test environments or remote test resources.

`main` CI success triggers the pinned reusable Worker deployment workflow with production environment credentials. Deployment, releases, production migrations and destructive resets need authorization for that operation. Authorized release entry: `bun run release -- major|minor|patch`. Apply reviewed schema migrations manually before dependent code deployments. Verify `/api/live` version and D1 connectivity plus anonymous Access redirects after deployment.

Update current human documentation with behavior changes. Historical design records are labeled in [the documentation index](docs/README.md); they do not override this handbook. Report checks actually run and unresolved gaps.
