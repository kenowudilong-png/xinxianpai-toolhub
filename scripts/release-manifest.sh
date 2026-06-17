#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  scripts/release-manifest.sh --env staging|prod --ref <git-ref> [--deploy-root <path>]

Generates a release manifest to stdout. The script is read-only by default:
- does not read env files
- does not read database contents
- does not deploy
- does not restart services
- does not write to the deployment root
- does not modify Git

A generated manifest may be copied into a deployment root only by a later,
separately approved release step.
USAGE
}

die() {
  echo "ERROR: $*" >&2
  exit 1
}

ENV_NAME=""
REF=""
DEPLOY_ROOT=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --env)
      [ "$#" -ge 2 ] || die "--env requires staging or prod"
      ENV_NAME="$2"
      shift 2
      ;;
    --ref)
      [ "$#" -ge 2 ] || die "--ref requires a Git ref"
      REF="$2"
      shift 2
      ;;
    --deploy-root)
      [ "$#" -ge 2 ] || die "--deploy-root requires a path"
      DEPLOY_ROOT="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "Unknown argument: $1"
      ;;
  esac
done

case "$ENV_NAME" in
  staging|prod) ;;
  *) usage; die "--env must be staging or prod" ;;
esac

[ -n "$REF" ] || {
  usage
  die "--ref is required"
}

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd "$REPO_ROOT"

git rev-parse --verify "$REF^{commit}" >/dev/null 2>&1 || die "Ref is not a valid commit: $REF"
COMMIT="$(git rev-parse "$REF^{commit}")"
SHORT_COMMIT="$(git rev-parse --short "$COMMIT")"
BRANCH="$(git branch --show-current 2>/dev/null || true)"
REMOTE_URL="$(git remote get-url origin 2>/dev/null || true)"
TREE_STATUS="$(git status --short)"
GENERATED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

if [ -n "$DEPLOY_ROOT" ]; then
  case "$DEPLOY_ROOT" in
    /opt/xinxianpai-toolhub|/Users/mima0000/Documents/xinxianpai/staging/toolhub|/Users/mima0000/Documents/xinxianpai/toolhub/xinxianpai-toolhub)
      ;;
    *)
      die "Unexpected deploy root. Refusing to emit manifest for: $DEPLOY_ROOT"
      ;;
  esac
fi

cat <<MANIFEST
# Xinxianpai Toolhub Release Manifest

Generated At: $GENERATED_AT
Environment: $ENV_NAME
Git Ref: $REF
Commit: $COMMIT
Short Commit: $SHORT_COMMIT
Branch At Generation: ${BRANCH:-unknown}
Origin: ${REMOTE_URL:-unknown}
Deploy Root: ${DEPLOY_ROOT:-not-specified}

## Safety

- Env files read: no
- Secrets read: no
- Database contents read: no
- Deployment performed: no
- Services restarted: no
- Files written by this command: no

## Source Tree Status

MANIFEST

if [ -n "$TREE_STATUS" ]; then
  printf '%s\n' '```text'
  printf '%s\n' "$TREE_STATUS"
  printf '%s\n' '```'
else
  echo 'Clean'
fi

cat <<MANIFEST

## Required Release Evidence

- PR approval:
- PR Check URL:
- Staging deploy evidence:
- Staging smoke test evidence:
- Backup manifest:
- Rollback rehearsal evidence:
- Keno Production approval:

## Production Commit Verification

Production release is not traceable unless this manifest is present in the deployment root and the Commit value matches the approved release commit.
MANIFEST
