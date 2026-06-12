# Visual Snapshot Workspace

This directory holds **Playwright-captured screenshot matrices** used as the visual acceptance gate for UI changes (see `docs/07-ui-design-audit.md` §3 for the contract).

## Layout

```
docs/visual/
├── README.md           # this file (committed)
├── .gitignore          # ignores per-change captures, keeps baseline (committed)
├── baseline/           # long-lived reference screenshots (committed)
│   └── dashboard__desktop__light__normal.png
└── <change-id>/        # one directory per design change (gitignored)
    ├── before/
    │   └── <change-id>__<page>__<viewport>__<theme>__<state>.png
    └── after/
        └── <change-id>__<page>__<viewport>__<theme>__<state>.png
```

## How to capture a matrix

1. **Start dev server in mock mode** (one-off):
   ```bash
   WOOLY_VISUAL_BYPASS_AUTH=true WOOLY_USE_MOCK=true bun run dev:site
   ```
   Leave it running. The mock branch only activates when both env vars are set, so production is unaffected.

2. **Run the capture for the `before` baseline** (on `main`, before your change):
   ```bash
   bun scripts/visual-snapshot.ts \
     --change 1.1 \
     --pages dashboard \
     --states normal,empty,loading \
     --phase before
   ```

3. **Apply the change**, then capture `after`:
   ```bash
   bun scripts/visual-snapshot.ts --change 1.1 --pages dashboard \
     --states normal,empty,loading --phase after
   ```

4. **Review** the two directories side-by-side. If approved, ship; if not, iterate.

5. **Cleanup** (optional): once merged, delete `<change-id>/` — the `before/after` directories are gitignored so they never enter the repo.

## When to promote to `baseline/`

If a change establishes a new visual reference that future changes should compare against (e.g. stage 1.0 wires the `data-visual-state` selector), copy the `after` shots into `baseline/` and commit them. Subsequent changes reuse those as their `before` instead of recapturing from `main`.

## Per-change checklist

- [ ] Run `before` capture from `main`.
- [ ] Apply change atomically (one PR per change-id).
- [ ] Run `after` capture from your branch.
- [ ] Attach the diff (or describe what changed) in the PR.
- [ ] After merge, delete `<change-id>/` locally — it never enters git.

## State semantics (recap from §3.5.3)

| State | What it captures | Driven by |
|---|---|---|
| `normal` | Page rendered with full mock dataset | `?_visual=normal` (default) |
| `empty` | Page rendered with empty Dataset (no members/sources/etc.) | `?_visual=empty` |
| `loading` | Page rendered with `vm.loading === true` (skeleton/spinner) | `?_visual=loading` — server hangs `/api/data` for 60s |

Pages must render `[data-visual-state="<state>"]` on their root container so the capture script can wait on a stable selector. Without it, `loading` captures will time out and `normal/empty` may capture an unhydrated frame.

## Reference matrix sizes

- Sidebar/header change affecting only one representative page: `1 × 2 × 2 × 1 = 4`
- Single-page change with all three states: `1 × 2 × 2 × 3 = 12`
- Cross-cutting change covering dashboard + tracker, normal only: `2 × 2 × 2 × 1 = 8`

See `docs/07-ui-design-audit.md` §3.1 for the formula and §3.2 for which states to elect per change.
