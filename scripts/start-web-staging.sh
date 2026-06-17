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
export GIP_INTERNAL_ORIGIN=${GIP_INTERNAL_ORIGIN:-http://127.0.0.1:18085}
export PORT=${PORT:-18083}

mkdir -p "$DATA_DIR" "$LOG_DIR"

PID_FILE="$LOG_DIR/platform-staging.pid"
if [ -f "$PID_FILE" ]; then
  old_pid="$(cat "$PID_FILE")"
  if [ -n "$old_pid" ]; then
    kill "$old_pid" 2>/dev/null || true
  fi
fi

nohup pnpm --filter web start > "$LOG_DIR/web-staging.log" 2>&1 &
echo $! > "$PID_FILE"
