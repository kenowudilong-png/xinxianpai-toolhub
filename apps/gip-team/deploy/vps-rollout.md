# VPS Rollout

1. Build and run the new `gip-team` container on a parallel port, for example `18082`.
2. Verify `GET /api/health`, setup/login, admin page, and user page on the parallel port.
3. Back up `/opt/freshpixxp/caddy/Caddyfile` before switching reverse proxy target.
4. Switch Caddy from `127.0.0.1:18080` to the verified new port only after checks pass.
5. Keep the old `gpt-image-playground` container until rollback is no longer needed.
