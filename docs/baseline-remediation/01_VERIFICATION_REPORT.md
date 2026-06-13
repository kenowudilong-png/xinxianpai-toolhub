# Verification Report

## A. `packages/storage`

Status: verified missing.

Evidence:

- `pnpm-workspace.yaml` includes `packages/*`.
- Root `package.json` runs `pnpm --filter @xinxianpai/storage build` and `typecheck`.
- `apps/web/package.json` and `apps/platform/package.json` depend on `@xinxianpai/storage`.
- `apps/web/tsconfig.json` and `apps/platform/tsconfig.json` map `@xinxianpai/storage` to `../../packages/storage/src/index.ts`.
- `pnpm-lock.yaml` contains a `packages/storage` entry and links web/platform to `../../packages/storage`.
- `scripts/audit-integrity.sh` requires `packages/storage/src/index.ts`.
- `find packages -maxdepth 3 -type f` showed only `db`, `shared`, and `ui`.

Impact:

- Root typecheck/build and integrity audit are expected to fail in a clean checkout.
- The missing package is build-blocking even though current app code does not directly import its API.

## B. `/admin/users`

Status: verified missing.

Evidence:

- `apps/web/src/app/admin/page.tsx`, setup/login actions, login page, sidebar, admin tabs, and user actions all route to `/admin/users`.
- `scripts/audit-integrity.sh` requires `apps/web/src/app/admin/users/page.tsx`.
- `find apps/web/src/app -maxdepth 5 -type f` did not show that route.
- Existing safe actions are present in `apps/web/src/lib/actions.ts`: create, update, disable/enable, reset password.
- Existing `listUsers()` data helper is present in `apps/web/src/lib/data.ts`.

Impact:

- First setup/admin login can land on a missing page.
- User management is functionally unavailable despite existing backend actions.

## C. Announcements Schema

Status: source SQL issue verified.

Evidence:

- `packages/db/src/index.ts` defined `level TEXT NOT NULL DEFAULT info CHECK(level IN (info, success, warning, danger))`.
- In SQLite, those unquoted words are parsed as identifiers rather than string literals.

Impact:

- Clean database initialization may fail or produce unsafe behavior for the announcements table.
- Source-only correction is safe; production DB migration validation must be handled separately without touching real DBs here.

## D. CI/check `.env.production` Coupling

Status: verified.

Evidence:

- `scripts/check.sh` sources `.env.production` if present.
- `scripts/check.sh` also runs broad build checks and optional health curls.
- `scripts/audit-integrity.sh` conditionally reads `.env.production` when `STORAGE_DRIVER=oss`.
- `.github/workflows/pr-check.yml` runs `scripts/audit-integrity.sh` and `scripts/check.sh`.

Impact:

- PR checks can read production env files if they exist on a runner.
- PR check behavior conflicts with the stated safety goal of not reading secrets.

## Related Finding: Stale Integrity Audit Expectations

Status: verified.

Evidence:

- `apps/web/src/app/admin/api-configs/page.tsx` now redirects to `/admin/app-settings`.
- `scripts/audit-integrity.sh` still requires `createApiConfigAction`, `updateApiConfigAction`, `deleteApiConfigAction`, `toolId`, and `models_json` inside the legacy API config page.

Impact:

- Integrity audit can fail against the current app-settings route structure even after the four known findings are remediated.
