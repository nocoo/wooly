# Retrospective

Accident narratives and historical findings. Current requirements live in [AGENTS.md](AGENTS.md); preserve original wording here, and route deterministic follow-ups to tests/hooks.

## Undated — migrated from the previous handbook

- **React 19 strict lint rules**: `useSyncExternalStore` or key-based state reset patterns are needed when porting from basalt. Historically these were enforced by tseslint's `react-hooks/set-state-in-effect` and `react-hooks/refs`; today they're not blocked by Biome's ruleset, but the pattern is still the right one and should be used from the start.
- **Tailwind CSS v4 has no `tailwind.config.js`**: All theming via CSS `@theme inline` blocks and custom properties in `globals.css`.
- **`Record<string, unknown>` vs `object`**: TS interfaces lack implicit index signatures. Use `T extends object` for generic constraints. Vitest won't catch this — always run `next build` to verify.
- **`computeBenefitCycleStatus` caller must pre-filter redemptions by benefitId** — `countRedemptionsInWindow` does NOT filter internally.
- **recharts SSR warning**: Harmless during `next build`. Expected and does not affect functionality.
- **Timezone mismatch in `redeemedAt`**: `new Date().toISOString()` produces UTC. Use `today` from `useToday()` or `formatDateInTimezone()` consistently. Never mix UTC and local timezone date strings.
- **Suppressing a lint rule at a specific site**: Biome uses per-line `// biome-ignore lint/<rule>: <reason>` (the reason is required); there is no block-form disable/enable pair — for multi-line regions, cover them with a `biome.json` `overrides` entry scoped to the specific file(s) or glob instead. Legacy ESLint `/* eslint-disable */` / `/* eslint-enable */` comments no longer do anything since the ESLint stack was removed.
- **Branch coverage drops with async hydration**: Defensive branches like `if (loading || !dataset)` are never hit in tests (mocks return loaded data synchronously). Do not lower `vitest.config.ts` 95% all-four thresholds to paper over that.

## 2026-09-20 — Worker custom-domain cutover

The first v1.0.0 deployment uploaded the new Worker and assets, then failed with Cloudflare error 100117 because `wooly.hexly.ai` still had the externally managed CNAME to the VPS. Wrangler's non-interactive override flags did not replace this record. The release script stopped before publishing a tag; the old site remained available.

The coordinator re-read the DNS record, checked its ID and original target against the private pre-cutover snapshot, removed that exact record, and immediately attached the hostname to `wooly-web`. The cutover operation included restoration of the old CNAME if attachment failed and no replacement record existed. The second deployment attempt for the same CI-proven SHA succeeded. Public health, Access protection, authenticated browser navigation and the complete dataset fingerprint were verified afterward.

For future custom-domain cutovers, treat externally managed DNS as a separate guarded operation. Uploading a Worker is not proof that its triggers or domain changed. Preserve the old target until verification and do not grant routine CI unnecessary DNS-write access.

Dependency consolidation also left an old generated `worker/node_modules` tree locally. It was removed from resolution before final validation, ensuring local tests and clean CI both used the root lockfile. No coverage gate was weakened.

## 2026-09-24 — Keep browser verification inputs fixed

During dependency maintenance, the patch version in `package.json` was changed while the isolated browser suite was running. The suite timed out waiting for the member-edit PUT request. Because Vite watches the manifest, that run did not have fixed inputs; a hot reload is a possible cause, not a proven diagnosis. A fresh run against the committed tree with tracing enabled passed both scenarios without application or test changes.

Complete all watched-file edits before starting browser verification. Builds and browser tests may run concurrently only when neither operation changes the browser server's inputs.

A push was also started before the documentation commit process had finished. It was terminated before updating the remote. A yielded process is still running: await a successful commit exit before starting a push, and verify the remote SHA afterward.
