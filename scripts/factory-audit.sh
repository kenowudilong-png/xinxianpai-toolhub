#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FACTORY_ROOT="${FACTORY_ROOT:-/Users/mima0000/Documents/xinxianpai/factory}"

pass() { printf 'PASS %s\n' "$1"; }
fail() { printf 'FAIL %s\n' "$1" >&2; exit 1; }

require_file() {
  local path="$1"
  [ -f "$path" ] || fail "missing file: $path"
  pass "file exists: $path"
}

require_dir() {
  local path="$1"
  [ -d "$path" ] || fail "missing directory: $path"
  pass "directory exists: $path"
}

validate_yaml() {
  local path="$1"
  python3 - "$path" <<'PY'
import sys
from pathlib import Path
path = Path(sys.argv[1])
text = path.read_text(encoding='utf-8')
if not text.strip():
    raise SystemExit(f"empty yaml: {path}")
try:
    import yaml  # type: ignore
except Exception:
    # Minimal structural fallback: require at least one top-level key.
    if not any(line and not line.startswith((' ', '-')) and ':' in line for line in text.splitlines()):
        raise SystemExit(f"no top-level yaml keys detected: {path}")
else:
    yaml.safe_load(text)
PY
  pass "yaml valid: $path"
}

[ -d "$FACTORY_ROOT" ] || fail "FACTORY_ROOT does not exist: $FACTORY_ROOT"
[ -d "$ROOT_DIR" ] || fail "repo root does not exist: $ROOT_DIR"

require_file "$FACTORY_ROOT/FACTORY_SOP.md"
require_file "$FACTORY_ROOT/FACTORY_PLAYBOOK.md"
require_file "$FACTORY_ROOT/PROJECT_STATUS.md"
require_file "$FACTORY_ROOT/BLOCKERS.md"
require_file "$FACTORY_ROOT/DECISIONS.md"
require_dir "$FACTORY_ROOT/docs"
require_dir "$FACTORY_ROOT/policies"
require_dir "$FACTORY_ROOT/runs/20260618-factory-final-closeout"
require_file "$FACTORY_ROOT/runs/20260618-factory-final-closeout/INTAKE.md"
require_file "$FACTORY_ROOT/runs/20260618-factory-final-closeout/SCAN_REPORT.md"
require_file "$FACTORY_ROOT/runs/20260618-factory-final-closeout/EVALUATION.md"
require_file "$FACTORY_ROOT/runs/20260618-factory-final-closeout/IMPLEMENTATION_PLAN.md"
require_file "$FACTORY_ROOT/runs/20260618-factory-final-closeout/REVIEW_REPORT.md"
require_file "$FACTORY_ROOT/runs/20260618-factory-final-closeout/LOCAL_STAGING_REPORT.md"

for policy in codex_rules security_rules release_rules tool_acceptance; do
  require_file "$FACTORY_ROOT/policies/$policy.yaml"
  validate_yaml "$FACTORY_ROOT/policies/$policy.yaml"
done

require_file "$ROOT_DIR/.github/pull_request_template.md"
require_file "$ROOT_DIR/scripts/start-local.sh"
require_file "$ROOT_DIR/scripts/run-local-web.sh"
require_file "$ROOT_DIR/scripts/run-local-gip.sh"
require_file "$ROOT_DIR/scripts/stop-local.sh"
require_file "$ROOT_DIR/scripts/local-smoke.sh"

if grep -R --line-number --include='*.md' --include='*.yaml' -E '(sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16})' "$FACTORY_ROOT/FACTORY_SOP.md" "$FACTORY_ROOT/FACTORY_PLAYBOOK.md" "$FACTORY_ROOT/policies" "$FACTORY_ROOT/runs/20260618-factory-final-closeout" >/tmp/xinxianpai-factory-audit-secret-hits.$$ 2>/dev/null; then
  cat /tmp/xinxianpai-factory-audit-secret-hits.$$ >&2
  rm -f /tmp/xinxianpai-factory-audit-secret-hits.$$
  fail "secret-like material detected in factory control files"
fi
rm -f /tmp/xinxianpai-factory-audit-secret-hits.$$

pass "factory audit complete"
