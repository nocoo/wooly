# Workers Migration — v1.0.0

Status: implementation and local validation complete; production release pending.

## Accepted decisions

- Replace Next.js with a Vite/React SPA and React Router. Preserve Chinese UI, Basalt identity, MVVM domain behavior, and existing navigation URLs.
- Deploy one Cloudflare Worker with static assets, authenticated API, and the existing production D1 database. Do not copy or reset production data.
- Replace Google OAuth/NextAuth and the server-to-server API key with Cloudflare Access. Team: `nocoo`; application audience: `733fc16e1ebab2704e6d1a878403d805255f7e16f0b492bf3955cf053af354d9`.
- Verify Access JWT signature, issuer, audience, expiry, and user identity in the Worker. Check mutation origins. Disable alternate deployment URLs. Keep reset disabled in production.
- Release the next major version, `1.0.0`, using the root package version as the only release-version source.
- Update `wooly.hexly.ai` directly after validation. The owner authorized deployment and DNS changes. Retain old infrastructure for the owner to delete after cutover; identify it explicitly in the final handoff.
- Remove obsolete application paths instead of maintaining compatibility layers.

## Architecture assessment

| Project | Observed runtime | Relevance |
| --- | --- | --- |
| Wooly before v1 | Next.js server in Docker on `jp2`, proxying to a separate Worker/D1 API; Google OAuth | SSR and the server proxy add deployment work to an otherwise client-driven MVVM dashboard |
| Gecko | `vinext` uses Vite internally, but its dashboard still starts with Node in Docker and retains Next/Auth.js APIs | A Vite-based build alone does not remove the server or Docker requirement |
| Geekhub | Vite SPA, Cloudflare Vite plugin, Access, one Worker deployment workflow | Closest operational reference for the new Wooly architecture |
| Ocelot | Vite frontend and authenticated Worker assets/API | Reference for Access verification and asset boundaries |

Workers can host adapted Next.js applications, but Wooly does not need an adapter or server rendering for its authenticated household dashboard. Its business logic already lives in client ViewModels and pure models, and D1 already runs on Cloudflare. Native Vite assets plus a small Worker remove the Next server, OAuth session implementation and inter-service API key while preserving existing data and behavior.

## Parallel ownership

| Owner | Files and responsibility |
| --- | --- |
| Pi | Frontend `src/`, page/router/session migration, frontend tests |
| Grok | `worker/src/`, `worker/test/`, real HTTP tests in `tests/api/` |
| Coordinator | Dependencies, configuration, scripts, browser tests, docs, CI/CD, review, commits, release, infrastructure |

Agents share the checkout. Only the coordinator stages and commits changes, after integrated checks, to avoid concurrent Git index changes.

## API contract

- `GET /api/session`: `{ user: { email: string, name: string } }` from verified Access claims.
- `GET /api/data`, `PUT /api/data`: existing complete household dataset contract.
- `POST /api/data/reset`: explicit local/test opt-in; disabled in production.
- `GET /api/live`: version, status and safe D1 connectivity evidence.
- Logout: Cloudflare Access `/cdn-cgi/access/logout`.
- Unknown API routes return JSON 404, never the SPA shell.

## Execution and evidence

- [x] Inspect current architecture, sibling projects, CI/CD, and platform documentation.
- [x] Confirm owner authorization for Access, DNS cutover, and major release.
- [x] Implement frontend and Worker changes.
- [x] Review boundaries, authentication, dataset preservation, and configuration.
- [x] Pass strict types, lint, existing 95% coverage gates, real HTTP/local D1 tests, browser journeys, build and dependency/secret scans.
- [ ] Commit coherent changes; push and verify CI on the release commit.
- [ ] Verify existing D1 binding and Access policy, deploy Worker/assets, and switch domain.
- [ ] Verify deployed version, D1 health, authenticated/unauthenticated behavior and browser assets.
- [ ] Publish GitHub v1.0.0 release and record evidence and old-resource deletion list.

## Cutover and recovery

Record the original DNS record and old Worker/D1 metadata privately before changing routing. D1 remains the same database throughout cutover. If deployment verification fails, restore the original domain routing; do not reset data or apply destructive migrations. Final source contains only the new architecture; retained external infrastructure is temporary operational recovery material.

## Local verification

- Worker: 106 unit tests pass; coverage statements 100%, branches 97.41%, functions 100%, lines 100%.
- Frontend: 534 unit tests pass; coverage statements 99.44%, branches 95.46%, functions 100%, lines 99.90% (including the new session provider).
- HTTP: 20 tests pass against the real Miniflare Worker runtime, including signed JWT verification through its outbound JWKS service and guarded temporary SQLite.
- Browser: member create/edit/delete, account creation, nested route refresh, benefit creation/redemption, D1 persistence and expired-session recovery pass against an isolated local Worker.
- Pure models, ViewModels and SQL migrations are unchanged.
- Vite production build and Wrangler dry run pass. Pages load as separate chunks; fonts preserve Latin Inter/DM Sans and Caveat 700.
- Dependency scan: no known issues reported by OSV for the unified lockfile.
- Production credentials are configured in GitHub's production environment. The old deployment's dataset fingerprint was recorded privately for read-only comparison after cutover.

## Owner cleanup after verified cutover

- On `jp2.nocoo.cloud`, remove the old `wooly-app` Docker service, `/opt/wooly` deployment and its reverse-proxy mapping.
- Remove the old Worker named `wooly` and its `wooly.worker.hexly.ai` custom domain when no old clients need it.
- Remove Wooly-only legacy OAuth credentials and API keys; remove obsolete repository secrets `GHCR_PULL_TOKEN`, `GHCR_PULL_USER`, `VPS_HOST`, `VPS_PORT`, `VPS_SSH_KEY`, `VPS_USER` after confirming they are no longer needed.
- Retain `wooly-db`: the new application uses this same D1 database.

The migration does not delete these external resources automatically.
