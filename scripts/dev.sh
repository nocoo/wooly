#!/usr/bin/env bash
# Run the Next.js site (port 7014) and the wrangler worker (port 8787) together.
# Both processes inherit the parent terminal so logs interleave with prefixes.
# Ctrl-C terminates both.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Ensure worker has a .dev.vars so /api/data succeeds locally without a real key.
if [ ! -f "$ROOT/worker/.dev.vars" ]; then
  cat >"$ROOT/worker/.dev.vars" <<'EOF'
API_KEY=dev-local-key
ALLOW_RESET=true
EOF
  echo "↪ created worker/.dev.vars (dev API_KEY=dev-local-key, ALLOW_RESET=true)"
fi

# Ensure .env.local has the worker connection vars; append only the missing ones.
ENV_FILE="$ROOT/.env.local"
touch "$ENV_FILE"
ensure_env() {
  local key="$1" value="$2"
  if ! grep -qE "^${key}=" "$ENV_FILE"; then
    printf '%s=%s\n' "$key" "$value" >>"$ENV_FILE"
    echo "↪ added ${key} to .env.local"
  fi
}
ensure_env WOOLY_WORKER_URL "http://localhost:8787"
ensure_env WOOLY_API_KEY "dev-local-key"
ensure_env WOOLY_ALLOW_RESET "true"

# Spawn both processes; tag each line so output is distinguishable.
prefix() {
  local tag="$1"
  while IFS= read -r line; do
    printf '[%s] %s\n' "$tag" "$line"
  done
}

cleanup() {
  trap - INT TERM EXIT
  # Kill the whole process group so wrangler/next children die too.
  kill -- -$$ 2>/dev/null || true
}
trap cleanup INT TERM EXIT

# Start as session leader so the negative PID kill above hits all descendants.
set -m

(cd "$ROOT/worker" && bun run dev 2>&1 | prefix worker) &
WORKER_PID=$!

(cd "$ROOT" && next dev --turbopack --port 7014 2>&1 | prefix site) &
SITE_PID=$!

# Exit when either child exits, propagating its status.
wait -n "$WORKER_PID" "$SITE_PID"
EXIT=$?
exit $EXIT
