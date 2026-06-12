# GIP-Team Deployment

## Local verification
1. Copy `.env.example` to `.env` and set `APP_SECRET` and `JWT_SECRET` to 32+ byte random strings.
2. Run `npm run build:all`.
3. Run `DATA_DIR=./data PORT=3000 npm run server:dev`.
4. Open `http://127.0.0.1:3000`, complete setup, create users, and configure API profiles in `/admin`.

## VPS rollout
1. Build the team image with `compose.team.yml` on a parallel port such as `18082`.
2. Verify `/api/health`, setup/login, admin config, user generate, logs, backup, and export.
3. Back up `/opt/freshpixxp/caddy/Caddyfile`.
4. Switch Caddy to the verified port only after checks pass.
5. Keep the old `gpt-image-playground` container until rollback is no longer needed.

## Required environment
- `APP_SECRET`: encrypts upstream API keys.
- `JWT_SECRET`: signs HttpOnly session cookies.
- `DATA_DIR`: defaults to `/data` in container.
- `LOG_PROMPTS`: defaults to `false`.
- `MAX_UPLOAD_MB`: defaults to `20`.
- `RATE_LIMIT_GENERATE`: defaults to `10` requests/min/user.
