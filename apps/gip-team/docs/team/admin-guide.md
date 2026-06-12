# Admin Guide

1. First visit creates the super admin through setup.
2. Use `/admin` to create users, disable users, inspect dashboard metrics, edit JSON API config, and export logs.
3. API config profiles must include `id`, `name`, `provider`, `baseUrl`, `apiKey`, `model`, `timeout`, and `apiMode`.
4. Saved API keys are encrypted server-side and later displayed as `••••••••`.
5. Admin cross-user task and agent reads are audited.
