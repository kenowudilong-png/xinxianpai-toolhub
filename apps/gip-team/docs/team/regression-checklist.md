# Regression Checklist

- [ ] Setup is available only when no users exist.
- [ ] Admin can log in, create a user, disable a user, and save API config.
- [ ] Normal user cannot access `/admin` or `/api/admin/*`.
- [ ] User can upload a reference image.
- [ ] User can generate an image through `/api/me/generate` without browser API key exposure.
- [ ] Tasks load from `/api/me/tasks` after refresh.
- [ ] Task delete calls `/api/me/tasks/:id` and removes it from history.
- [ ] Agent sessions sync to `/api/me/agent/sessions/sync` and reload from `/api/me/agent/sessions`.
- [ ] Call logs appear in admin logs and CSV export.
- [ ] Backup endpoint creates a backup under `DATA_DIR/backups`.
- [ ] Caddy can switch to the new container port and roll back to the old container.
