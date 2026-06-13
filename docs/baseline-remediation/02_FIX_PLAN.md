# Fix Plan

## `packages/storage`

- Classification: Fix now.
- Scope: recreate the minimal package structure already referenced by workspace metadata.
- Approach: add `package.json`, `tsconfig.json`, source entry, and local `ali-oss` type shim. Export a small local/OSS storage driver API matching behavior already embedded in `apps/gip-team/server/index.ts`.
- Risk: low to medium. Package is currently missing and blocks checks; adding it is source-only and reversible.
- Validation: `pnpm --filter @xinxianpai/storage typecheck`, root/web checks when safe.

## `/admin/users`

- Classification: Fix now.
- Scope: add minimal safe admin page using existing guard shell, `listUsers()`, and existing server actions.
- Approach: no new schema, no new auth logic, no weaker authorization.
- Risk: low. The route is already expected by navigation and redirects.
- Validation: web typecheck and integrity audit.

## Announcements Schema

- Classification: Fix now for source; production migration plan required separately.
- Scope: quote SQL string literals in source schema definition only.
- Risk: low for new DBs; existing production DBs require separate migration validation if already created.
- Validation: typecheck and source audit. Real DB migration is intentionally not run here.

## CI/check Env Coupling

- Classification: Fix now.
- Scope: make PR/local baseline checks safe by default and avoid `.env.production` reads.
- Approach: update `scripts/check.sh` so it does not source `.env.production`; add release-only opt-in for env/service health checks. Update `audit-integrity.sh` so the OSS env-file check is skipped unless explicitly enabled. Align PR workflow with safe mode.
- Risk: low to medium. Check script behavior changes, but keeps typecheck/build/audit meaningful.
- Validation: run `bash scripts/audit-integrity.sh` and `bash scripts/check.sh` after changes if safe.

## Stale API Config Audit

- Classification: Fix partially now.
- Scope: update integrity audit to match current `/admin/app-settings` flow while still checking action definitions and no key exposure.
- Risk: low.
- Validation: run `bash scripts/audit-integrity.sh`.
