# Changes Made

## Files Changed

- `.env.example`
- `.github/workflows/pr-check.yml`
- `.gitignore`
- `apps/web/src/app/admin/users/page.tsx`
- `docs/baseline-remediation/00_SCOPE.md`
- `docs/baseline-remediation/01_VERIFICATION_REPORT.md`
- `docs/baseline-remediation/02_FIX_PLAN.md`
- `docs/baseline-remediation/03_CHANGES_MADE.md`
- `docs/baseline-remediation/04_TEST_REPORT.md`
- `docs/baseline-remediation/05_REMAINING_RISKS.md`
- `docs/baseline-remediation/06_NEXT_ACTIONS.md`
- `packages/db/src/index.ts`
- `packages/storage/package.json`
- `packages/storage/src/ali-oss.d.ts`
- `packages/storage/src/index.ts`
- `packages/storage/tsconfig.json`
- `scripts/audit-integrity.sh`
- `scripts/check.sh`

## Change Details

### Restored `packages/storage`

- Finding addressed: missing `packages/storage`.
- Change: added minimal workspace package with TypeScript config, source exports, local storage driver, OSS storage driver, key normalization helpers, and ali-oss type shim.
- Risk level: low to medium.
- Rollback: remove `packages/storage/*` and revert package graph expectations. This would reintroduce the known build blocker.

### Added `/admin/users`

- Finding addressed: missing admin users route.
- Change: added `apps/web/src/app/admin/users/page.tsx` using existing `AdminPageShell`, `listUsers()`, and existing user-management server actions.
- Risk level: low.
- Rollback: remove the page. This would restore the missing-route failure.

### Fixed Announcement SQL Literals

- Finding addressed: suspicious announcements schema.
- Change: quoted string literals in the `level` default/check constraint.
- Risk level: low for source/new DBs; production migration validation remains separate.
- Rollback: revert the one-line schema change. Not recommended.

### Decoupled PR Checks From Production Env

- Finding addressed: CI/check `.env.production` coupling.
- Change: `scripts/check.sh` now defaults to `CHECK_MODE=pr`, does not source `.env.production` in PR mode, injects safe placeholder compile-time values, and skips runtime health probes outside release mode.
- Change: `scripts/audit-integrity.sh` only inspects `.env.production` when `CHECK_PRODUCTION_ENV=1`.
- Change: PR workflow invokes scripts with `CHECK_MODE=pr`.
- Risk level: low to medium.
- Rollback: revert script/workflow changes; this would restore production-env coupling.

### Updated PR GIP Dependency Handling

- Finding addressed: nested `apps/gip-team` is outside pnpm workspace.
- Change: PR workflow now runs `npm ci` in `apps/gip-team` before `npm run build:server`.
- Risk level: low.
- Rollback: remove the `npm ci` step; GIP server build can fail on clean runners without nested npm dependencies.

### Added Documentation And Ignore Exceptions

- Finding addressed: baseline audit trail and ignored source paths.
- Change: added remediation docs and `.env.example` with variable names only.
- Change: added narrow `.gitignore` exceptions for `packages/storage/**` and `apps/web/src/app/admin/users/**`, because broad runtime-data ignore rules hid those source paths.
- Risk level: low.
- Rollback: revert docs/ignore changes if no longer needed.
