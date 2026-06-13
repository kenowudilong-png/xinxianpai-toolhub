#!/usr/bin/env bash
set -euo pipefail

STAGING_WORKTREE="/Users/mima0000/Documents/xinxianpai/staging/toolhub"
EXPECTED_BRANCH="staging"
EXECUTE=0
REF=""

usage() {
  cat <<'USAGE'
Usage:
  scripts/deploy-staging.sh --ref <git-ref> [--execute]

Default mode is dry-run. Dry-run prints the staging deploy plan only.
Execute mode may update the staging worktree with a clean fast-forward merge.
It never starts services, reads secrets, runs migrations, or touches production.
USAGE
}

die() {
  echo "ERROR: $*" >&2
  exit 1
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --ref)
      [ "$#" -ge 2 ] || die "--ref requires a value"
      REF="$2"
      shift 2
      ;;
    --execute)
      EXECUTE=1
      shift
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

[ -n "$REF" ] || {
  usage
  die "--ref is required"
}

[ -d "$STAGING_WORKTREE" ] || die "Staging worktree path does not exist: $STAGING_WORKTREE"
git -C "$STAGING_WORKTREE" rev-parse --is-inside-work-tree >/dev/null 2>&1 ||
  die "Staging path is not a Git worktree/repository: $STAGING_WORKTREE"

staging_root="$(cd "$STAGING_WORKTREE" && pwd -P)"
git_root="$(git -C "$STAGING_WORKTREE" rev-parse --show-toplevel)"
[ "$staging_root" = "$git_root" ] ||
  die "Staging path is not the root of the Git worktree: $STAGING_WORKTREE"

if [ -n "$(git -C "$STAGING_WORKTREE" status --porcelain)" ]; then
  die "Staging worktree is dirty. Refusing to continue."
fi

git -C "$STAGING_WORKTREE" fetch --prune origin \
  '+refs/heads/*:refs/remotes/origin/*' \
  '+refs/tags/*:refs/tags/*'

if ! target_commit="$(git -C "$STAGING_WORKTREE" rev-parse --verify "${REF}^{commit}" 2>/dev/null)"; then
  die "Target ref does not resolve to a commit after fetch: $REF"
fi

current_branch="$(git -C "$STAGING_WORKTREE" branch --show-current || true)"
[ -n "$current_branch" ] || current_branch="DETACHED"
current_commit="$(git -C "$STAGING_WORKTREE" rev-parse HEAD)"

if [ "$EXECUTE" -ne 1 ]; then
  cat <<PLAN
DRY RUN: staging deploy helper

Staging worktree: $STAGING_WORKTREE
Current staging branch: $current_branch
Current staging commit: $current_commit
Target ref: $REF
Target commit: $target_commit

Commands that would run with --execute:
  git -C "$STAGING_WORKTREE" fetch --prune origin '+refs/heads/*:refs/remotes/origin/*' '+refs/tags/*:refs/tags/*'
  git -C "$STAGING_WORKTREE" checkout "$EXPECTED_BRANCH"
  git -C "$STAGING_WORKTREE" merge --ff-only "$target_commit"

No service commands would run.
No secrets, environment files, migrations, production paths, or runtime services would be touched.
PLAN
  exit 0
fi

git -C "$STAGING_WORKTREE" show-ref --verify --quiet "refs/heads/$EXPECTED_BRANCH" ||
  die "Local staging branch does not exist in the staging worktree."

echo "EXECUTE: updating staging worktree only."
echo "Staging worktree: $STAGING_WORKTREE"
echo "Target ref: $REF"
echo "Target commit: $target_commit"

git -C "$STAGING_WORKTREE" checkout "$EXPECTED_BRANCH"

if [ -n "$(git -C "$STAGING_WORKTREE" status --porcelain)" ]; then
  die "Staging worktree became dirty after checkout. Refusing to continue."
fi

git -C "$STAGING_WORKTREE" merge --ff-only "$target_commit"

echo "Staging worktree updated with a clean fast-forward merge."
echo "No services were started or restarted."
echo "No secrets, environment files, migrations, production paths, or runtime services were touched."
