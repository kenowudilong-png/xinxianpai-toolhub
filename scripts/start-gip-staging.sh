#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
if [ -d "$HOME/.local/bin" ]; then export PATH="$HOME/.local/bin:$PATH"; fi
if [ -d "$HOME/.local/node-v20.19.0-darwin-arm64/bin" ]; then export PATH="$HOME/.local/node-v20.19.0-darwin-arm64/bin:$PATH"; fi
if [ -d "$ROOT_DIR/runtime/node/bin" ]; then export PATH="$ROOT_DIR/runtime/node/bin:$PATH"; fi
if [ -f .env.production ]; then set -a; source .env.production; set +a; fi
export DATA_DIR=${DATA_DIR:-$ROOT_DIR/.local-data}
export LOG_DIR=${LOG_DIR:-$ROOT_DIR/.local-logs}
export PLATFORM_DB_PATH=${PLATFORM_DB_PATH:-$DATA_DIR/main.sqlite}
export HOST=127.0.0.1
export PORT=18085
mkdir -p "$LOG_DIR"
cd apps/gip-team
npm run build:all
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
if port_listening "$PORT"; then
  echo "GIP staging already listening on $PORT"
  exit 0
fi
nohup npm run start > "$LOG_DIR/gip-staging.log" 2>&1 &
sleep 2
curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null
echo "GIP staging started on 127.0.0.1:$PORT"
