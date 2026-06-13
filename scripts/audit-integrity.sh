#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
fail(){ echo "integrity audit failed: $*" >&2; exit 1; }
require_file(){ test -f "$1" || fail "missing file $1"; }
require_grep(){ local pattern="$1"; shift; grep -RInE "$pattern" "$@" >/dev/null || fail "missing pattern '$pattern' in $*"; }
reject_grep(){ local pattern="$1"; shift; if grep -RInE "$pattern" "$@" >/dev/null; then fail "forbidden pattern '$pattern' found in $*"; fi }

require_file apps/web/src/lib/actions.ts
require_file apps/web/src/lib/data.ts
require_file apps/web/src/app/admin/users/page.tsx
require_file apps/web/src/app/admin/api-configs/page.tsx
require_file apps/web/src/app/admin/tools/page.tsx
require_file apps/web/src/app/admin/usage/page.tsx
require_file apps/web/src/app/admin/announcements/page.tsx
require_file apps/web/src/app/settings/password/page.tsx
require_file apps/web/src/app/api/proxy/route.ts

# Auth and admin guard coverage.
require_grep "if \(!user\) redirect\(\"/login\"\)|if \(!user\) return NextResponse\.json\(\{ error: \"unauthorized\" \}" apps/web/src/app apps/web/src/lib
require_grep "user\.role !== \"admin\"|user\.role!==\"admin\"|role !== \"admin\"" apps/web/src/lib apps/web/src/app/admin

# User-management contract: duplicate usernames must not bubble as raw SQLite 500s.
require_grep "SELECT id FROM users WHERE username = \?" apps/web/src/lib/actions.ts
require_grep "error=duplicate" apps/web/src/lib/actions.ts apps/web/src/app/admin/users/page.tsx
require_grep "name=\"username\"[^\n]*required" apps/web/src/app/admin/users/page.tsx
require_grep "name=\"password\"[^\n]*minLength=\{8\}[^\n]*required" apps/web/src/app/admin/users/page.tsx

# Password change must require current password, not only a new password.
require_grep "currentPassword" apps/web/src/lib/actions.ts apps/web/src/app/settings/password/page.tsx
require_grep "verifyPassword" apps/web/src/lib/actions.ts

# API config actions and app settings must be wired and never display encrypted key.
require_file apps/web/src/app/admin/app-settings/page.tsx
require_file apps/web/src/app/admin/app-settings/gip/page.tsx
require_grep "createApiConfigAction" apps/web/src/lib/actions.ts
require_grep "updateApiConfigAction" apps/web/src/lib/actions.ts
require_grep "deleteApiConfigAction" apps/web/src/lib/actions.ts
require_grep "toolId" apps/web/src/lib/actions.ts
require_grep "models_json" packages/db/src/index.ts apps/web/src/lib/data.ts
require_grep "/tools/gip/app/admin\\?settings=1" apps/web/src/app/admin/app-settings/gip/page.tsx apps/web/src/components/app-settings-cards.tsx
reject_grep "encrypted_key" apps/web/src/app/admin/api-configs/page.tsx apps/web/src/components

# Tool management create/update/toggle/reorder/tutorial must be wired to frontend forms.
require_grep "tutorial_intro" packages/db/src/index.ts apps/web/src/lib/data.ts
require_grep "tutorial_content" packages/db/src/index.ts apps/web/src/lib/data.ts
require_grep "tutorialIntro" apps/web/src/app/admin/tools/page.tsx apps/web/src/lib/actions.ts
require_grep "tutorialContent" apps/web/src/app/admin/tools/page.tsx apps/web/src/lib/actions.ts
require_grep "使用教程" apps/web/src/components/client-controls.tsx apps/web/src/app/admin/tools/page.tsx
require_grep "跳转使用" apps/web/src/components/client-controls.tsx
require_grep "createToolAction" apps/web/src/app/admin/tools/page.tsx apps/web/src/lib/actions.ts
require_grep "updateToolAction" apps/web/src/app/admin/tools/page.tsx apps/web/src/lib/actions.ts
require_grep "toggleToolAction" apps/web/src/app/admin/tools/page.tsx apps/web/src/lib/actions.ts
require_grep "reorderToolAction" apps/web/src/app/admin/tools/page.tsx apps/web/src/lib/actions.ts

# Usage filters must reach the DB query, not remain static controls.
require_grep "searchParams" apps/web/src/app/admin/usage/page.tsx
require_grep "listUsageLogs\(params\)" apps/web/src/app/admin/usage/page.tsx
require_grep "UsageFilters" apps/web/src/lib/data.ts
require_grep "usage_logs\.user_id = \?" apps/web/src/lib/data.ts
require_grep "usage_logs\.tool_id = \?" apps/web/src/lib/data.ts

# shadcn local components and imports.
require_file apps/web/src/components/ui/button.tsx
require_file apps/web/src/components/ui/card.tsx
require_file apps/web/src/components/ui/table.tsx
require_file apps/web/src/components/ui/badge.tsx
require_file apps/web/src/components/ui/dialog.tsx
reject_grep "@xinxianpai/ui/components/ui/button" apps/web/src

# Tailwind/shadcn style pipeline.
require_grep "@import \"tailwindcss\"" apps/web/src/app/globals.css
require_file apps/web/postcss.config.mjs
require_grep "@tailwindcss/postcss" apps/web/postcss.config.mjs
require_file apps/web/src/app/style-smoke-test/page.tsx

# API proxy safety and usage logging.
require_grep "currentUser" apps/web/src/app/api/proxy/route.ts
require_grep "tool_id = \?" apps/web/src/app/api/proxy/route.ts
require_grep "missing_config" apps/web/src/app/api/proxy/route.ts
require_grep "INSERT INTO usage_logs" apps/web/src/app/api/proxy/route.ts apps/gip-team/server/index.ts


# GIP full integration checks.
require_file apps/web/src/app/tools/gip/api/[...path]/route.ts
require_grep "headersTimeout: 30 \* 60 \* 1000" apps/web/src/app/tools/gip/api/[...path]/route.ts
require_file apps/web/src/app/tools/gip/app/[[...path]]/route.ts
require_file apps/web/src/components/gip-embed.tsx
require_grep "x-xp-user-id" apps/web/src/app/tools/gip/api/[...path]/route.ts apps/web/src/app/tools/gip/app/[[...path]]/route.ts
require_grep "GIP_API_BASE" apps/gip-team/src/team/api.ts
require_grep "'/tools/gip/api'" apps/gip-team/src/team/api.ts
require_grep "platformUserFromHeaders" apps/gip-team/server/index.ts
require_grep "files', 'tools', 'gip', 'users" apps/gip-team/server/index.ts
require_grep "mkdirSync\(userDbDir\(userId\), \{ recursive: true \}\)" apps/gip-team/server/index.ts
require_grep "getPlatformApiConfig" apps/gip-team/server/index.ts
require_grep "writePlatformUsageLog" apps/gip-team/server/index.ts

# User/tool data spaces must be initialized by platform lifecycle hooks.
require_grep "ensureUserToolSpaces\(id\)" apps/web/src/lib/auth.ts
require_grep "ensureToolSpaceForAllUsers\(id\)" apps/web/src/lib/actions.ts
require_grep "openUserToolDatabase" apps/web/src/lib/tool-data.ts
reject_grep "fetch\([[:space:]]*[\"']/me/" apps/gip-team/src
reject_grep "fetch\([[:space:]]*[\"']/me/" apps/gip-team/src
require_grep "gipApiPath" apps/gip-team/src/team/serverState.ts
require_grep "/me/files/" apps/gip-team/src/team/serverState.ts
require_grep "storeImageWithId\(id, serverImage" apps/gip-team/src/store.ts
reject_grep "storeImage\\(serverImage" apps/gip-team/src/store.ts
reject_grep "<SettingsModal|from './components/SettingsModal'" apps/gip-team/src/App.tsx

# Secrets should not appear in frontend/public source.
reject_grep "value=.*(sk-|AIza|AKIA)|NEXT_PUBLIC_.*KEY|encrypted_key" apps/web/src/app/admin apps/web/src/app/login apps/web/src/app/setup apps/web/src/app/settings apps/web/src/app/tools apps/web/src/components apps/web/public


# Agent feature is permanently removed from GIP runtime.
reject_grep "AgentWorkspace" apps/gip-team/src/App.tsx
reject_grep "智能助手|Agent 配置|setAppMode\('agent'\)" apps/gip-team/src/components/Header.tsx apps/gip-team/src/components/SettingsModal.tsx apps/gip-team/src/store.ts
require_grep "AGENT_REMOVED" apps/gip-team/server/index.ts

# Announcement management and notification button.
require_grep "CREATE TABLE IF NOT EXISTS announcements" packages/db/src/index.ts
require_grep "listAnnouncements" apps/web/src/lib/data.ts apps/web/src/lib/layout.tsx
require_grep "createAnnouncementAction" apps/web/src/lib/actions.ts apps/web/src/app/admin/announcements/page.tsx
require_grep "toggleAnnouncementAction" apps/web/src/lib/actions.ts apps/web/src/app/admin/announcements/page.tsx
require_grep "HeaderIcons\(\{announcements" apps/web/src/components/client-controls.tsx

# OSS storage migration checks.
require_file packages/storage/src/index.ts
require_file scripts/migrate-local-files-to-oss.mjs
require_grep "class OssStorageDriver" packages/storage/src/index.ts apps/gip-team/server/index.ts
require_grep "OSS_ENDPOINT_INTERNAL" packages/storage/src/index.ts apps/gip-team/server/index.ts scripts/migrate-local-files-to-oss.mjs
require_grep "OSS_ENDPOINT_PUBLIC" packages/storage/src/index.ts apps/gip-team/server/index.ts
require_grep "signGetUrl" packages/storage/src/index.ts apps/gip-team/server/index.ts
require_grep "storageDriver\.put" apps/gip-team/server/index.ts
require_grep "storageDriver\.get" apps/gip-team/server/index.ts
require_grep "storageDriver\.signGetUrl" apps/gip-team/server/index.ts
require_grep "getExistingUserDb" apps/gip-team/server/index.ts
require_grep "getExistingUserDb\(request\.user" apps/gip-team/server/index.ts
require_grep "getExistingUserDb\(userId\)" apps/gip-team/server/index.ts
require_grep "return storageKey.*gip.*userId.*relPath" apps/gip-team/server/index.ts
reject_grep "writeFileSync\(" apps/gip-team/server/index.ts
reject_grep "createReadStream\(" apps/gip-team/server/index.ts

echo "integrity audit ok"

# OSS CORS must allow browser fetch of signed image URLs for preview hydration.
if [ "${CHECK_PRODUCTION_ENV:-0}" = "1" ] && [ "${STORAGE_DRIVER:-local}" = "oss" ]; then
  require_grep "OSS_ENDPOINT_PUBLIC" .env.production
else
  echo "Skipping production env integrity check. Set CHECK_PRODUCTION_ENV=1 for release-only validation."
fi
