#!/usr/bin/env bash
set -euo pipefail

# Ensure .next/types exists and is up-to-date.
# tsc --noEmit does NOT generate .next/types — only next dev/build does.
# tsconfig.json includes .next/types/**/*.ts for route type checking.
# Without this directory, tsc silently skips route type validation.
#
# Next 16 collapsed per-route .next/types/app/**/route.ts files into a
# single .next/types/routes.d.ts, so freshness is checked by comparing
# its mtime against the newest source file under src/app/.

needs_rebuild=false
ROUTES_DTS=".next/types/routes.d.ts"
APP_DIR="src/app"

if [ ! -f "$ROUTES_DTS" ]; then
  echo "⚠️  .next/types/routes.d.ts not found — rebuild needed."
  needs_rebuild=true
else
  # Cross-platform mtime: macOS uses stat -f '%m', Linux uses stat -c '%Y'
  if stat -c '%Y' "$ROUTES_DTS" &>/dev/null; then
    # Linux / WSL
    if command -v fd &>/dev/null; then
      newest_app=$(fd -e ts -e tsx . "$APP_DIR/" -x stat -c '%Y' {} 2>/dev/null | sort -nr | head -1)
    else
      newest_app=$(find "$APP_DIR" -type f \( -name '*.ts' -o -name '*.tsx' \) -exec stat -c '%Y' {} \; 2>/dev/null | sort -nr | head -1)
    fi
    routes_mtime=$(stat -c '%Y' "$ROUTES_DTS" 2>/dev/null || echo 0)
  else
    # macOS
    if command -v fd &>/dev/null; then
      newest_app=$(fd -e ts -e tsx . "$APP_DIR/" -x stat -f '%m' {} 2>/dev/null | sort -nr | head -1)
    else
      newest_app=$(find "$APP_DIR" -type f \( -name '*.ts' -o -name '*.tsx' \) -exec stat -f '%m' {} \; 2>/dev/null | sort -nr | head -1)
    fi
    routes_mtime=$(stat -f '%m' "$ROUTES_DTS" 2>/dev/null || echo 0)
  fi

  if [ -n "${newest_app:-}" ] && [ "$newest_app" -gt "$routes_mtime" ]; then
    echo "⚠️  .next/types/routes.d.ts is older than newest app/ source — rebuilding..."
    needs_rebuild=true
  fi
fi

if [ "$needs_rebuild" = true ]; then
  echo "   Running next build to regenerate route types..."
  rm -rf .next/types
  bun run build
fi

exec bun x tsc --noEmit
