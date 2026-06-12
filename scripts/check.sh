#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
if [ -d "$HOME/.local/bin" ]; then export PATH="$HOME/.local/bin:$PATH"; fi
if [ -d "$HOME/.local/node-v20.19.0-darwin-arm64/bin" ]; then export PATH="$HOME/.local/node-v20.19.0-darwin-arm64/bin:$PATH"; fi
if [ -d "$ROOT_DIR/runtime/node/bin" ]; then export PATH="$ROOT_DIR/runtime/node/bin:$PATH"; fi
export PYTHON=${PYTHON:-$(command -v python3 || true)}
if [ -f .env.production ]; then set -a; source .env.production; set +a; fi
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
pnpm build
(cd apps/gip-team && npm run build:all)
bash scripts/audit-harness.sh
bash scripts/audit-integrity.sh
if port_listening "${PORT:-18083}"; then curl -fsSI "http://127.0.0.1:${PORT:-18083}/" >/dev/null; fi
if port_listening 18085; then curl -fsS "http://127.0.0.1:18085/api/health" >/dev/null; fi
if [ "${RUN_E2E:-0}" = "1" ]; then bash scripts/e2e-smoke.sh; fi
