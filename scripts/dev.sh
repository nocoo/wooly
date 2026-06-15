#!/usr/bin/env bash
# Run the Next.js site (port 7014). When WOOLY_WORKER_URL points at
# localhost, also boot the wrangler worker (port 8787); when it points
# at a remote URL (e.g. the production worker), site runs alone.
# Both processes inherit the parent terminal so logs interleave with
# prefixes. Ctrl-C terminates everything.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env.local"
touch "$ENV_FILE"

# Read current WOOLY_WORKER_URL from .env.local (default: prod worker).
read_env() {
  local key="$1" default="$2"
  local value
  value=$(grep -E "^${key}=" "$ENV_FILE" | tail -1 | cut -d= -f2- || true)
  printf '%s' "${value:-$default}"
}

WORKER_URL=$(read_env WOOLY_WORKER_URL "https://wooly.worker.hexly.ai")
API_KEY=$(read_env WOOLY_API_KEY "")

# Decide whether to run a local worker. localhost / 127.* URLs do, others
# don't (we point at a deployed Cloudflare Worker).
LOCAL_WORKER=false
if [[ "$WORKER_URL" =~ ^https?://(localhost|127\.) ]]; then
  LOCAL_WORKER=true
fi

# Append missing connection vars only — never overwrite existing values.
ensure_env() {
  local key="$1" value="$2"
  if ! grep -qE "^${key}=" "$ENV_FILE"; then
    printf '%s=%s\n' "$key" "$value" >>"$ENV_FILE"
    echo "↪ added ${key} to .env.local"
  fi
}

if [ "$LOCAL_WORKER" = true ]; then
  # Local mode: ensure worker .dev.vars + matching client key.
  if [ ! -f "$ROOT/worker/.dev.vars" ]; then
    cat >"$ROOT/worker/.dev.vars" <<'EOF'
API_KEY=dev-local-key
ALLOW_RESET=true
EOF
    echo "↪ created worker/.dev.vars (dev API_KEY=dev-local-key, ALLOW_RESET=true)"
  fi
  ensure_env WOOLY_WORKER_URL "http://localhost:8787"
  ensure_env WOOLY_API_KEY "dev-local-key"
  ensure_env WOOLY_ALLOW_RESET "true"
else
  # Remote mode: keep .env.local as-is. Verify API_KEY isn't a placeholder.
  ensure_env WOOLY_WORKER_URL "$WORKER_URL"
  ensure_env WOOLY_ALLOW_RESET "false"
  if [ -z "$API_KEY" ] || [ "$API_KEY" = "__FILL_ME__" ] || [ "$API_KEY" = "dev-local-key" ]; then
    echo "❌ WOOLY_API_KEY in .env.local is empty or a placeholder."
    echo "   Set it to the production Worker's API_KEY secret, or switch"
    echo "   WOOLY_WORKER_URL=http://localhost:8787 to run a local worker."
    exit 1
  fi
  echo "▸ using remote worker: $WORKER_URL"
fi

# Spawn processes; tag each line so output is distinguishable.
prefix() {
  local tag="$1"
  while IFS= read -r line; do
    printf '[%s] %s\n' "$tag" "$line"
  done
}

cleanup() {
  trap - INT TERM EXIT
  # Kill the whole process group so children die too.
  kill -- -$$ 2>/dev/null || true
}
trap cleanup INT TERM EXIT
set -m

if [ "$LOCAL_WORKER" = true ]; then
  (cd "$ROOT/worker" && bun run dev 2>&1 | prefix worker) &
  WORKER_PID=$!
fi

(cd "$ROOT" && next dev --turbopack --port 7014 2>&1 | prefix site) &
SITE_PID=$!

# Exit when any child exits, propagating its status.
if [ "$LOCAL_WORKER" = true ]; then
  wait -n "$WORKER_PID" "$SITE_PID"
else
  wait -n "$SITE_PID"
fi
EXIT=$?
exit $EXIT
