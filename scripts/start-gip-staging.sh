#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

USER_HOME="${HOME:-$(cd ~ && pwd)}"
STAGING_ENV_FILE="${STAGING_ENV_FILE:-}"

if [ -d "$USER_HOME/.local/bin" ]; then export PATH="$USER_HOME/.local/bin:$PATH"; fi
if [ -d "$USER_HOME/.local/node-v20.19.0-darwin-arm64/bin" ]; then export PATH="$USER_HOME/.local/node-v20.19.0-darwin-arm64/bin:$PATH"; fi
if [ -d "$ROOT_DIR/runtime/node/bin" ]; then export PATH="$ROOT_DIR/runtime/node/bin:$PATH"; fi

if [ -z "$STAGING_ENV_FILE" ]; then
  echo "ERROR: STAGING_ENV_FILE must point to an explicit staging env file." >&2
  exit 1
fi

if [ ! -f "$STAGING_ENV_FILE" ]; then
  echo "ERROR: staging env file not found: $STAGING_ENV_FILE" >&2
  exit 1
fi

case "$STAGING_ENV_FILE" in
  *production*|*.prod|*.prod.*)
    echo "ERROR: refusing to source production-like env file for staging: $STAGING_ENV_FILE" >&2
    exit 1
    ;;
esac

set -a
source "$STAGING_ENV_FILE"
set +a

export DATA_DIR=${DATA_DIR:-$ROOT_DIR/.staging-data}
export LOG_DIR=${LOG_DIR:-$ROOT_DIR/.staging-logs}
export PLATFORM_DB_PATH=${PLATFORM_DB_PATH:-$DATA_DIR/main.sqlite}
export HOST=127.0.0.1
export PORT=${GIP_STAGING_PORT:-18085}

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
