# Retrospective

Accident narratives and historical findings. Current requirements live in [CLAUDE.md](CLAUDE.md); preserve original wording here, and route deterministic follow-ups to tests/hooks.

## Undated — migrated from the previous handbook

- **React 19 strict lint rules**: `useSyncExternalStore` or key-based state reset patterns are needed when porting from basalt. Historically these were enforced by tseslint's `react-hooks/set-state-in-effect` and `react-hooks/refs`; today they're not blocked by Biome's ruleset, but the pattern is still the right one and should be used from the start.
- **Tailwind CSS v4 has no `tailwind.config.js`**: All theming via CSS `@theme inline` blocks and custom properties in `globals.css`.
- **`Record<string, unknown>` vs `object`**: TS interfaces lack implicit index signatures. Use `T extends object` for generic constraints. Vitest won't catch this — always run `next build` to verify.
- **`computeBenefitCycleStatus` caller must pre-filter redemptions by benefitId** — `countRedemptionsInWindow` does NOT filter internally.
- **recharts SSR warning**: Harmless during `next build`. Expected and does not affect functionality.
- **Timezone mismatch in `redeemedAt`**: `new Date().toISOString()` produces UTC. Use `today` from `useToday()` or `formatDateInTimezone()` consistently. Never mix UTC and local timezone date strings.
- **Suppressing a lint rule at a specific site**: Biome uses per-line `// biome-ignore lint/<rule>: <reason>` (the reason is required); there is no block-form disable/enable pair — for multi-line regions, cover them with a `biome.json` `overrides` entry scoped to the specific file(s) or glob instead. Legacy ESLint `/* eslint-disable */` / `/* eslint-enable */` comments no longer do anything since the ESLint stack was removed.
- **Branch coverage drops with async hydration**: Defensive branches like `if (loading || !dataset)` are never hit in tests (mocks return loaded data synchronously). Do not lower `vitest.config.ts` 95% all-four thresholds to paper over that.
