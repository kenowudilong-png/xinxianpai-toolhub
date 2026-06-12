#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
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
test -f apps/web/components.json || { echo "missing apps/web/components.json" >&2; exit 1; }
test -f packages/ui/components.json || { echo "missing packages/ui/components.json" >&2; exit 1; }
test -f packages/ui/@/components/ui/button.tsx || { echo "missing shadcn button" >&2; exit 1; }
test -f apps/web/public/brand/logo-freshpi.png || { echo "missing logo" >&2; exit 1; }
grep -q "radix-rhea" packages/ui/components.json || { echo "preset not applied to packages/ui" >&2; exit 1; }
grep -q "listTools" apps/web/src/app/page.tsx apps/web/src/lib/layout.tsx || { echo "tools table not used by UI" >&2; exit 1; }
grep -q "tool_id" packages/db/src/index.ts apps/web/src/app/api/proxy/route.ts || { echo "tool_id not wired" >&2; exit 1; }
grep -q "models_json" packages/db/src/index.ts apps/web/src/app/admin/api-configs/page.tsx || { echo "models_json not wired" >&2; exit 1; }
if grep -RInE "value=.*(sk-|AIza|AKIA)|NEXT_PUBLIC_.*KEY" apps/web/src; then echo "possible secret exposure" >&2; exit 1; fi
if ! port_listening 18081; then echo "warning: existing 18081 service not detected" >&2; fi
echo "shadcn toolhub audit ok"
