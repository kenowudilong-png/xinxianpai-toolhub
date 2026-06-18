#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

USER_HOME="${HOME:-$(cd ~ && pwd)}"

if [ -d "$USER_HOME/.local/bin" ]; then export PATH="$USER_HOME/.local/bin:$PATH"; fi
if [ -d "$ROOT_DIR/runtime/node/bin" ]; then export PATH="$ROOT_DIR/runtime/node/bin:$PATH"; fi
if [ -d "$USER_HOME/.local/node-v20.19.0-darwin-arm64/bin" ]; then export PATH="$USER_HOME/.local/node-v20.19.0-darwin-arm64/bin:$PATH"; fi

set -a
LOCAL_ENV_FILE="${LOCAL_ENV_FILE:-$ROOT_DIR/.env.production}"
if [ -f "$LOCAL_ENV_FILE" ]; then
  source "$LOCAL_ENV_FILE"
else
  echo "Warning: $LOCAL_ENV_FILE not found; using safe local defaults." >&2
fi
set +a

export DATA_DIR=${DATA_DIR:-$ROOT_DIR/.local-data}
export LOG_DIR=${LOG_DIR:-$ROOT_DIR/.local-logs}
export PLATFORM_DB_PATH=${PLATFORM_DB_PATH:-$DATA_DIR/main.sqlite}
export GIP_INTERNAL_ORIGIN=${GIP_INTERNAL_ORIGIN:-http://127.0.0.1:18085}
export PORT=${PORT:-18083}

mkdir -p "$DATA_DIR" "$LOG_DIR"

UID_VALUE="$(id -u)"
AGENT_DIR="$USER_HOME/Library/LaunchAgents"

for label in com.xinxianpai.toolhub.web com.xinxianpai.toolhub.gip; do
  plist="$AGENT_DIR/$label.plist"
  launchctl bootout "gui/$UID_VALUE" "$plist" >/dev/null 2>&1 || true
done

if ! command -v screen >/dev/null 2>&1; then
  echo "screen is required for durable local service sessions on macOS." >&2
  exit 1
fi

screen_session_exists() {
  local session="$1"
  screen -ls | grep -Eq "[.]$session[[:space:]]"
}

stop_screen_session() {
  local session="$1"
  if screen_session_exists "$session"; then
    screen -S "$session" -X quit >/dev/null 2>&1 || true
  fi
}

start_screen_session() {
  local session="$1"
  local script="$2"
  local stdout="$3"
  local stderr="$4"

  stop_screen_session "$session"
  : > "$stdout"
  : > "$stderr"

  PROJECT_ROOT="$ROOT_DIR" TARGET_SCRIPT="$script" OUT_LOG="$stdout" ERR_LOG="$stderr" HOME="$USER_HOME" PATH="$PATH" \
    screen -S "$session" -dm /bin/bash -c 'cd "$PROJECT_ROOT" && exec /bin/bash "$TARGET_SCRIPT" >>"$OUT_LOG" 2>>"$ERR_LOG"'
}

GIP_SESSION="xinxianpai-toolhub-gip"
WEB_SESSION="xinxianpai-toolhub-web"

start_screen_session "$GIP_SESSION" "$ROOT_DIR/scripts/run-local-gip.sh" "$LOG_DIR/gip-local.log" "$LOG_DIR/gip-local.err.log"

for _ in $(seq 1 40); do
  if curl -fsS "http://127.0.0.1:18085/api/health" >/dev/null 2>&1; then break; fi
  sleep 1
done
curl -fsS "http://127.0.0.1:18085/api/health" >/dev/null

start_screen_session "$WEB_SESSION" "$ROOT_DIR/scripts/run-local-web.sh" "$LOG_DIR/web-local.log" "$LOG_DIR/web-local.err.log"

for _ in $(seq 1 40); do
  if curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then break; fi
  sleep 1
done
curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null

echo "Local toolhub started:"
echo "  web: http://127.0.0.1:$PORT"
echo "  gip: http://127.0.0.1:18085"
echo "  logs: $LOG_DIR"
echo "  sessions: $GIP_SESSION, $WEB_SESSION"
