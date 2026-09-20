# Development and deployment

Wooly runs a Vite React SPA and API in one Cloudflare Worker. Production keeps the existing `wooly-db` D1 database. No schema or data migration is required for v1.0.0.

## Local development

Requires Bun 1.4 and Node.js 22.12+. From the repository root:

```bash
bun install --frozen-lockfile
bun run db:migrate
bun run dev
```

Open `http://127.0.0.1:7014`. The Cloudflare Vite plugin runs the Worker and local D1 together. Daily local state lives in `.wrangler/state`. Local/test identity requires the explicit environment, configured local email and trusted loopback host. Production always verifies Access JWTs. Never use production D1 as test input.

## Validation

```bash
bun run typecheck
bun run lint
bun run test:unit:coverage
bun run test:worker
bun run test:api
bunx playwright install chromium
bun run test:e2e:bdd
bun run deploy:check
```

App and Worker coverage gates require all four metrics >=95%. API tests use real HTTP against Miniflare with a unique temporary SQLite directory. Browser tests run on port 27014 with a new local database and verified `_test_marker`. The harness removes its state after shutdown. Test fixtures never deploy to Cloudflare.

## Production

`wrangler.jsonc` is the deployment source of truth:

- Worker: `wooly-web`; custom domain: `wooly.hexly.ai`.
- Database: `wooly-db`, binding `DB`; retain its existing ID and contents.
- Assets: `dist/client`; Worker authentication runs before asset serving.
- Access: team `nocoo`, application audience recorded in Wrangler vars.
- `workers.dev` and preview URLs are disabled. Reset is disabled.
- `/api/live` is public through the existing Access health bypass. It returns the root package version and a real D1 connectivity result.

The Access application manages allowed identities. The Worker validates signature, issuer, audience, expiration and user claims; mutation requests also require a matching Origin. No OAuth client secret or API key is needed by this application.

Configure `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in the GitHub `production` environment. The deploy token needs account Workers Scripts Write and Account Settings Read, plus zone Workers Routes Write and Zone Read. CI runs validation and the successful main push triggers the immutable shared Worker deployment workflow. Deployment runs `bun run deploy` followed by `bun run verify:production`.

For an authorized manual deployment, export the same two credentials privately and run:

```bash
bun run deploy
bun run verify:production
```

The deploy script checks the production bindings, authentication settings, reset flag and alternate URLs before building and publishing. Never deploy `--env local` or `--env test`.

## Database changes

Migrations remain manual and must precede any dependent deployment:

```bash
bun x wrangler d1 migrations list DB --remote
bun x wrangler d1 migrations apply DB --remote
```

These commands target production. Review migrations and back up data before applying changes. Normal development uses `bun run db:migrate`, which is explicitly local.

## Releases

```bash
bun run release -- major
```

The script bumps the root version, updates the changelog, commits, pushes, waits for CI and deployment of that exact commit, checks production, then creates the Git tag and GitHub release. Use `minor` or `patch` for later compatible releases. Migration and retained infrastructure details are in [11-workers-migration.md](11-workers-migration.md).
