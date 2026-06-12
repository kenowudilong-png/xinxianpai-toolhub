#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/.local-logs"
USER_HOME="${HOME:-$(cd ~ && pwd)}"
if [ -f "$ROOT_DIR/.env.production" ]; then
  set -a
  source "$ROOT_DIR/.env.production"
  set +a
fi
LOG_DIR=${LOG_DIR:-$ROOT_DIR/.local-logs}
UID_VALUE="$(id -u)"
AGENT_DIR="$USER_HOME/Library/LaunchAgents"

for label in com.xinxianpai.toolhub.web com.xinxianpai.toolhub.gip; do
  plist="$AGENT_DIR/$label.plist"
  launchctl bootout "gui/$UID_VALUE" "$plist" >/dev/null 2>&1 || true
done

if command -v screen >/dev/null 2>&1; then
  for session in xinxianpai-toolhub-web xinxianpai-toolhub-gip; do
    if screen -ls | grep -Eq "[.]$session[[:space:]]"; then
      screen -S "$session" -X quit >/dev/null 2>&1 || true
    fi
  done
fi

kill_project_listener() {
  local port="$1"
  local pids pid cwd

  pids="$(lsof -nP -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  for pid in $pids; do
    cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1 || true)"
    case "$cwd" in
      "$ROOT_DIR"|"$ROOT_DIR"/*)
        kill "$pid" 2>/dev/null || true
        ;;
    esac
  done
}

kill_project_listener "${PORT:-18083}"
kill_project_listener 18085

for file in "$LOG_DIR/gip-local.pid" "$LOG_DIR/web-local.pid" "$LOG_DIR/platform-staging.pid"; do
  if [ -f "$file" ]; then
    kill "$(cat "$file")" 2>/dev/null || true
    rm -f "$file"
  fi
done

echo "Local toolhub stopped."
