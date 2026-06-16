#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
if [ -d "$HOME/.local/bin" ]; then export PATH="$HOME/.local/bin:$PATH"; fi
if [ -d "$HOME/.local/node-v20.19.0-darwin-arm64/bin" ]; then export PATH="$HOME/.local/node-v20.19.0-darwin-arm64/bin:$PATH"; fi
if [ -d "$ROOT_DIR/runtime/node/bin" ]; then export PATH="$ROOT_DIR/runtime/node/bin:$PATH"; fi
export PYTHON=${PYTHON:-$(command -v python3 || true)}
CHECK_MODE=${CHECK_MODE:-pr}
if [ "$CHECK_MODE" = "release" ] && [ -f .env.production ]; then
  set -a
  source .env.production
  set +a
elif [ "$CHECK_MODE" = "pr" ]; then
  export APP_SECRET=${APP_SECRET:-check-mode-app-secret-32-bytes-minimum}
  export JWT_SECRET=${JWT_SECRET:-check-mode-jwt-secret-32-bytes-minimum}
  export DATA_DIR=${DATA_DIR:-/tmp/xinxianpai-toolhub-check-data}
  export LOG_DIR=${LOG_DIR:-/tmp/xinxianpai-toolhub-check-logs}
fi
port_listening() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -lntp 2>/dev/null | grep -q ":${port}\\b"
  elif command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
  else
    return 1
  fi
}
pnpm typecheck
pnpm lint
pnpm build
if [ -x apps/gip-team/node_modules/.bin/tsc ]; then
  (cd apps/gip-team && npm run build:all)
else
  if [ "$CHECK_MODE" = "release" ]; then
    echo "apps/gip-team dependencies are missing; run npm ci before release checks." >&2
    exit 1
  fi
  echo "Skipping GIP build in CHECK_MODE=$CHECK_MODE because apps/gip-team/node_modules is not installed."
fi
bash scripts/audit-harness.sh
bash scripts/audit-integrity.sh
if [ "$CHECK_MODE" = "release" ]; then
  if port_listening "${PORT:-18083}"; then curl -fsSI "http://127.0.0.1:${PORT:-18083}/" >/dev/null; fi
  if port_listening 18085; then curl -fsS "http://127.0.0.1:18085/api/health" >/dev/null; fi
else
  echo "Skipping runtime health probes in CHECK_MODE=$CHECK_MODE."
fi
if [ "${RUN_E2E:-0}" = "1" ]; then bash scripts/e2e-smoke.sh; fi
