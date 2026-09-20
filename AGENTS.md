# Wooly

Chinese household benefits, redemption and loyalty-points dashboard. Profile: `ts-worker-web` (Vite SPA + Cloudflare Worker/D1).

## Sources of truth

- Root `package.json` and `bun.lock`: sole version and dependency source.
- `wrangler.jsonc`: production and isolated local/test bindings.
- [Development](docs/08-development.md), [domain and UI constraints](docs/10-maintainer-notes.md), [migration](docs/11-workers-migration.md).
- `.husky/`, CI and Vitest configs enforce quality. Never lower coverage, skip tests or bypass hooks.
- Machine procedures live in global AGENTS.md; incidents belong in root `Retrospective.md`.

## Invariants

- Product UI is Chinese. Use published Basalt controls, Magenta identity, L0-L3 surfaces and the persisted 36-color account palette. Preserve the canonical sheep master and derivative provenance.
- Models are pure and immutable and return validation errors. Views call ViewModels; ViewModels use real models and guarded one-time hydration. Preserve the 500ms full-dataset sync.
- `/api/data` transfers all seven collections as a full overwrite. Preserve relationships and complete payloads. Concurrent writers can overwrite changes; no merge behavior is promised.
- Cloudflare Access is the only production identity provider. Validate JWT signature, issuer, audience, expiry and user claims. Require matching Origin for mutations and no-store for private responses.
- Production reset, local identity, workers.dev and preview URLs stay disabled. Retain the existing D1 database; never use production as test fixtures.
- `DashboardLayout` resets ViewModels with `key={pathname}`. New routes belong in the router, page-title map and sidebar map.
- Do not launch a second daily server. Automated verification uses dedicated isolated test resources.
- Keep `T extends object` for interface-compatible generic helpers. Filter redemptions by benefit before computing cycle status and consistently apply configured timezone.

## Layout and commands

`src/pages/` and `src/components/` render views; `src/models/`, `src/viewmodels/`, `src/hooks/`, `src/data/` handle domain behavior. `worker/src/` handles authentication and persistence. `worker/migrations/` contains schema changes.

Install once from root using the locked Bun version and machine-approved registry:

```bash
bun install --frozen-lockfile
bun run db:migrate
bun run dev
bun run typecheck
bun run lint
bun run test:unit:coverage
bun run test:worker
bun run test:api
bun run test:e2e:bdd
bun run deploy:check
```

## Verification contract

| Layer | Required evidence |
| --- | --- |
| L1 app | All four coverage metrics >=95% for configured models/ViewModels/lib/hooks/data and session context; transport/hydration exclusions remain covered through browser journeys |
| L1 Worker | All four metrics >=95% across worker/src |
| L2 | Real local HTTP, JWT claims/origin controls, dataset validation and D1 behavior |
| L3 | Browser household CRUD, persistence, nested route reload and session recovery |
| G1 | Strict app, Worker and test TypeScript plus check-only Biome/oxc gates |
| G2 | Required gitleaks and OSV scans; missing binaries fail |
| Isolation | Fresh per-run local SQLite, explicit test context and verified marker before fixture/reset/cleanup |
| Build | Actual Vite client and Worker output, Wrangler dry run |

Pre-commit runs coverage, Worker tests, HTTP tests, types, staged lint, gitleaks and index-snapshot oxc gates. Pre-push runs build, coverage, HTTP/Worker tests, Worker types, lint and OSV. Full index-snapshot test execution and push-ref secret scanning remain planned; do not claim those gates exist.

## Operations

Daily dev uses port 7014 and `.wrangler/state`. Playwright uses port 27014 and a unique temporary database. HTTP fixtures use ephemeral ports. Never deploy local/test environments or remote test resources.

`main` CI success triggers the pinned reusable Worker deployment workflow with production environment credentials. Authorized release entry: `bun run release -- major|minor|patch`. Apply reviewed schema migrations manually before dependent code deployments. Verify `/api/live` version and D1 connectivity plus anonymous Access redirects after deployment.
