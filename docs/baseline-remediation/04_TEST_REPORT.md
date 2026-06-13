# Test Report

## Commands Run

### `pnpm install --frozen-lockfile`

- Result: passed.
- Purpose: install local workspace dependencies so allowed typecheck/build commands could run.
- Notes: no lockfile changes were produced.

### `pnpm --filter @xinxianpai/storage typecheck`

- First attempt: failed because `node_modules` was absent and `tsc` was not available.
- After `pnpm install --frozen-lockfile`: passed.

### `pnpm --filter web typecheck`

- Result: passed.

### `cd apps/gip-team && npm run build:server`

- Result: failed.
- Reason: `apps/gip-team` is outside the pnpm workspace and its npm dependencies were not installed locally. Errors were missing module/type declarations for Fastify, better-sqlite3, argon2, nanoid, lru-cache, fflate, and related packages.
- Follow-up taken: did not run `npm install` locally because it was not in the allowed command list. Updated PR workflow to run `npm ci` inside `apps/gip-team` before the server build.

### `bash scripts/audit-integrity.sh`

- Result: passed.
- Notes: skipped production env integrity check because `CHECK_PRODUCTION_ENV` was not enabled.

### `CHECK_MODE=pr bash scripts/check.sh`

- Result: passed.
- Covered:
  - root typecheck
  - root build
  - web build
  - audit harness
  - audit integrity
- Notes:
  - runtime health probes were skipped in PR mode.
  - GIP full build was skipped locally because `apps/gip-team/node_modules` was absent.
  - no `.env.production` was sourced.
  - audit harness warned that old `18081` service was not detected; warning did not fail the check.

## Commands Not Run

- No deploy scripts.
- No start/stop/restart scripts.
- No real DB migrations.
- No real SQLite database opens or queries.
- No external API or OSS calls.
- No `.env` or `.env.production` reads.
- No local `npm install` in `apps/gip-team`, because it was not an allowed command.

## Verification Summary

- Storage package typecheck: passed.
- Web typecheck: passed.
- Safe full check: passed.
- GIP server build: not locally validated due missing nested npm dependencies; CI workflow now installs them before build.
