# Visual archive

This directory preserves screenshot studies from the former Next.js application. The original acceptance matrix and its findings are in the [June 2026 UI audit](../07-ui-design-audit.md). These images are historical references, not proof of the current Vite UI.

The old `scripts/visual-snapshot.ts`, `dev:site` command, mock-server flags and `?_visual=` state dispatcher were removed in v1.0.0. The current app does not provide that capture workflow.

## Current browser verification

From the repository root:

```bash
bunx playwright install chromium
bun run test:e2e:bdd
```

Playwright starts the Vite Worker on `127.0.0.1:27014`, creates and verifies a temporary local database, and shuts the server down after the run. It does not reuse the daily development server. See [test resources](../08-development.md#test-resources).

The household journey writes `test-results/worker-tracker.png`; the HTML report lives in `playwright-report/`. These generated artifacts are ignored by Git. This is a functional journey with one screenshot, not a screenshot-diff gate or a complete viewport/theme/state matrix.

For a visual change, manually inspect its affected routes, desktop/mobile layouts, light/dark themes and relevant loading/empty/populated states against the [current design constraints](../10-maintainer-notes.md#design-system). Use isolated local fixtures and identify the tested revision. Keep historical captures labeled separately from new evidence.

## Archive layout

- `baseline/`: committed reference captures from the earlier implementation.
- Per-change directories: exploratory before/after matrices, usually ignored by Git.
- Selected studies may be tracked; inspect `git ls-files docs/visual` before treating a local image as published evidence.

The archived `normal`, `empty` and `loading` labels describe the old mock dispatcher. They are not current API parameters. Do not restore production auth bypasses or remote test resources to reproduce the old captures.
