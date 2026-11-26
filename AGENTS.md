# Wooly

Chinese household benefits, redemption, and loyalty-points dashboard (`ts-worker-web`: Vite React SPA + single Cloudflare Worker/D1).
Docs: [README.md](README.md) · [Development](docs/08-development.md) · [Maintainer Notes](docs/10-maintainer-notes.md) · [Migration](docs/11-workers-migration.md) · [Docs Index](docs/README.md) · [Retrospective](Retrospective.md)

## Commands

Layout: views in `src/{pages,components}/`, domain in `src/{models,viewmodels,hooks,data}/`, auth/D1 in `worker/src/`, SQL in `worker/migrations/`.

Run from root with Bun 1.4.0 and Node.js 22.23+ (CI: 26.12.1); root `package.json` + `bun.lock` are the sole version/dependency source. Local bindings and `developer@example.test` live in `wrangler.jsonc`.

```sh
bun install --frozen-lockfile
bun run db:migrate            # local D1 migrations (--local --env local)
bun run dev                   # http://127.0.0.1:7014 (wooly.dev.hexly.ai)
bun run typecheck             # S1: wrangler types + app/worker/test tsc
bun run lint                  # S2: Biome check-only (0 warnings)
bun run test:unit:coverage    # L1: >=80% app coverage
bun run test:worker           # L2: >=80% worker/src coverage
bun run test:api              # L3: local HTTP (tests/api/: JWT/origins/reset)
bunx playwright install chromium && bun run test:e2e:bdd  # L4: e2e/bdd/ journeys
bun run build                 # B1: Vite client + Worker bundle
bun run deploy:check          # P1: build + wrangler deploy --dry-run (reuses B1 in CI)
```

## Invariants

- Product UI is Chinese; use published `@nocoo/basalt` controls, Magenta identity, L0-L3 surfaces, and the 36-color palette. Preserve the sheep master and provenance ([notes](docs/10-maintainer-notes.md)).
- Models are pure, immutable, and return validation errors. Views call ViewModels; ViewModels use real models, guarded one-time hydration, and 500ms debounced full-dataset sync.
- `/api/data` overwrites all six entity arrays plus `defaultSettings` atomically. Preserve relationships and complete payloads; concurrent writers overwrite last-write-wins with no merge.
- Cloudflare Access is the sole prod IdP. Validate JWT signature, issuer, audience, expiry, and user claims; enforce matching `Origin` on mutations and `Cache-Control: no-store` on `/api/*`.
- Keep prod reset, local identity, `workers.dev`, and preview URLs disabled in `wrangler.jsonc`. Retain existing `wooly-db`; never deploy local/test configs or use prod as test fixtures.
- `DashboardLayout` keeps chrome mounted and keys only its content boundary by `pathname` to reset page ViewModels. Register new routes in `src/App.tsx`, `PAGE_TITLES`, and `NAV_GROUPS`.
- Keep `T extends object` for interface-compatible generic helpers. Pre-filter redemptions by `benefitId` before computing cycle status and consistently apply the configured timezone.
- `main` push CI success triggers prod deploy (`.github/workflows/release.yml`). Releases (`bun run release -- major|minor|patch`), manual deploys, prod D1 migrations, and resets require authorization.
- Apply reviewed prod D1 migrations manually before dependent code deploys; verify `/api/live` version, D1 status, and Access redirects via `bun run verify:production` ([ops](docs/08-development.md)).
- Update current human docs with behavior changes; historical records in [docs/README.md](docs/README.md) do not override this handbook. Never run prod operations merely to validate docs.

## Quality & Local Gates

Follows `system1-quality`; CI slot definitions and pinned `base-ci` revision live in `.github/workflows/quality-slots.yml` (`quality / Z1: Gate` required on `main`). Status vocabulary: `enforced`, `planned`, `manual`, `N/A`.

- **Exceptions**: Real Access IdP login (`L4`) is `manual`. `P1 Package` runs `wrangler deploy --dry-run` reusing `B1` (`enforced`); `L3` and `L4` reuse the `B1` artifact. Never lower thresholds, skip/focus tests, or bypass hooks.
- **Coverage**: `L1` enforces >=80% all 4 metrics on `vitest.config.ts` scope (views, `src/data/api.ts`, thin hooks covered by `L3`/`L4`); `L2` enforces >=80% across `worker/src` (`worker/vitest.config.ts`).
- **Local hooks**: installed via `bun run prepare` (`.husky/`); missing `gitleaks`/`osv-scanner` fail. Configured enforcement is distinct from a passing run; report checks actually run and gaps.
- **pre-commit**: runs staged `gitleaks` (`G1`), then checks out the staged index (`git checkout-index`, read-only worktree `node_modules`) for parallel `S1`, `S2`, `L1`, `L2`, and `L3`.
- **pre-push**: runs `B1`, `S2`, `L1`, `L2`, `L3`, `typecheck:worker`, and `G2` (`osv-scanner` on `bun.lock`) on the working tree; stdin push-ref targeting, push-ref `G1`, and `L4` remain `planned`.
- **Isolation gaps**: `_test_marker` revalidation before every fixture/reset path and on browser teardown remains `planned` ([test resources](docs/08-development.md#test-resources)).

## Resources & Isolation

| Lane       | Endpoint / State                                                        | Boundary                                                            |
| ---------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Dev        | `http://127.0.0.1:7014`, `.wrangler/state` (`developer@example.test`)   | Daily local D1; do not launch a second daily server                 |
| API (`L3`) | Ephemeral loopback port, temp dir + `_test_marker`                      | Bundled Miniflare Worker; marker verified on setup/close and resets |
| E2E (`L4`) | `http://127.0.0.1:27014`, temp `WOOLY_TEST_STATE` (`test@example.test`) | Marker verified before startup; server reuse disabled               |
| Prod       | `https://wooly.hexly.ai`, Worker `wooly-web`, D1 `wooly-db`             | Read-only checks unless deployment or migration is authorized       |

## Retrospective

Record incident narratives in [Retrospective.md](Retrospective.md); promote recurring project constraints to `Invariants` above and enforceable safeguards to tests/hooks.
