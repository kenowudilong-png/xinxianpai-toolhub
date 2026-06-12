# STATE

- 当前 VPS：ssh root@8.138.203.173
- 当前工作目录：/opt/xinxianpai-toolhub
- 当前平台端口：18083
- 当前 GIP 内部端口：127.0.0.1:18085
- 上一次备份路径：/var/backups/xinxianpai-toolhub/gip-integration/gip-web-before-<timestamp>.tar.gz
- 上一次验证命令：bash scripts/check.sh
- 失败次数：0
- 阻塞项：无
- 当前步骤：已修复 GIP 设置 iframe 路由识别；等待人工强刷 `/admin/app-settings/gip` 验证显示原 SettingsModal。

## 2026-06-01 17:43:12 +0800
- 当前步骤：修复用户端生图 HTTP 500
- 根因：用户级 gip.sqlite 父目录未创建，better-sqlite3 抛出 Cannot open database because the directory does not exist。
- 修改文件：apps/gip-team/server/index.ts
- 上一次验证命令：npm run build:all；curl http://127.0.0.1:18085/api/health；带平台 header curl /api/me/agent/sessions 与 /api/me/tasks
- 结果：通过
- 阻塞项：无

## 2026-06-01 17:51:58 +0800
- 当前步骤：根治新用户/新应用目录初始化
- 当前工作目录：/opt/xinxianpai-toolhub
- 修改文件：apps/web/src/lib/tool-data.ts；apps/web/src/lib/auth.ts；apps/web/src/lib/actions.ts；scripts/audit-integrity.sh
- 上一次验证命令：bash scripts/audit-integrity.sh；pnpm --filter web typecheck；pnpm --filter web build；临时 DATA_DIR 生命周期烟测；18083/18085 健康检查
- 结果：通过
- 阻塞项：无

## 2026-06-01 18:06:07 +0800
- 当前步骤：修复 GIP 刷新后预览图消失
- 根因：刷新后历史任务只保存图片 ID，需要重新从服务端拉取图片；getServerImage 使用裸 /me/files/:id，嵌入平台后该路径不会经过 /tools/gip/api 代理。
- 修改文件：apps/gip-team/src/team/serverState.ts；scripts/audit-integrity.sh
- 上一次验证命令：npm run build:all；curl 127.0.0.1:18085/api/me/files/<imageId>；bash scripts/audit-integrity.sh
- 结果：通过
- 阻塞项：无

## 2026-06-01 18:06:29 +0800
- 当前步骤：修复 GIP 刷新后预览图消失
- 根因：刷新后历史任务只保存图片 ID，需要重新从服务端拉取图片；getServerImage 使用裸 /me/files/:id，嵌入平台后该路径不会经过 /tools/gip/api 代理。
- 修改文件：apps/gip-team/src/team/serverState.ts；scripts/audit-integrity.sh
- 上一次验证命令：npm run build:all；curl 127.0.0.1:18085/api/me/files/<imageId>；bash scripts/audit-integrity.sh
- 结果：通过
- 阻塞项：无

## 2026-06-01 18:07:20 +0800
- 当前步骤：修复 GIP 刷新后预览图消失
- 根因：刷新后历史任务只保存图片 ID，需要重新从服务端拉取图片；getServerImage 使用裸 /me/files/:id，嵌入平台后该路径不会经过 /tools/gip/api 代理。
- 修改文件：apps/gip-team/src/team/serverState.ts；scripts/audit-integrity.sh
- 上一次验证命令：npm run build:all；curl 127.0.0.1:18085/api/me/files/<imageId>；bash scripts/audit-integrity.sh
- 结果：通过
- 阻塞项：无

## 2026-06-01 20:45:34 +0800
- 当前步骤：二次修复历史预览图刷新丢失
- 根因：图片文件请求已修通，但回填 IndexedDB 时重新计算了图片 ID，和历史任务 outputImages 中的服务端 SHA ID 不一致。
- 修改文件：apps/gip-team/src/lib/db.ts；apps/gip-team/src/store.ts；scripts/audit-integrity.sh
- 上一次验证命令：npm run build:all；bash scripts/audit-integrity.sh；curl http://127.0.0.1:18085/api/health
- 结果：通过
- 阻塞项：无

## 2026-06-02 08:16:43 +0800
- 当前步骤：永久摘除 GIP Agent 功能
- 修改文件：apps/gip-team/src/App.tsx；apps/gip-team/src/components/Header.tsx；apps/gip-team/src/components/HelpModal.tsx；apps/gip-team/src/components/SettingsModal.tsx；apps/gip-team/src/components/InputBar.tsx；apps/gip-team/src/store.ts；apps/gip-team/src/team/AdminApp.tsx；apps/gip-team/src/team/api.ts；apps/gip-team/src/team/serverState.ts；apps/gip-team/server/index.ts；scripts/audit-integrity.sh
- 上一次验证命令：npm run build:all；npm run build:server；bash scripts/audit-integrity.sh；curl /api/me/agent/sessions
- 结果：通过，Agent API 返回 410
- 阻塞项：无

## 2026-06-02 10:27:11 +0800
- 当前步骤：阿里云 OSS 存储迁移与重建
- 修改文件：packages/storage/src/index.ts；packages/storage/src/ali-oss.d.ts；packages/storage/package.json；apps/gip-team/server/index.ts；apps/gip-team/server/ali-oss.d.ts；apps/gip-team/package.json；package.json；pnpm-lock.yaml；scripts/migrate-local-files-to-oss.mjs；scripts/audit-integrity.sh；.env.production
- 迁移结果：GIP 本地图片 4 个、10984933 bytes 已上传 OSS，manifest=/var/log/xinxianpai-toolhub/oss-migration-gip-2026-06-02T02-17-33-705Z.json
- 存储策略：STORAGE_DRIVER=oss；SQLite 留 VPS；图片对象 key=gip/<userId>/<relativePath>；本地旧文件保留 7 天观察
- 上一次验证命令：pnpm --filter @xinxianpai/storage typecheck；pnpm --filter @xinxianpai/storage build；apps/gip-team npm run build:all；bash scripts/audit-integrity.sh；curl 18085 /api/health；图片接口 302 signed URL；OSS unsigned 403/signed 200
- 结果：通过
- 阻塞项：无

## 2026-06-02 10:40:27 +0800
- 当前步骤：项目完整性与功能 Bug 巡检
- 检查范围：pnpm typecheck/build；GIP build:all；audit-harness；audit-integrity；18083/18085 health；未登录权限；GIP header 鉴权；OSS 图片 302 signed URL；用户隔离；服务日志；磁盘内存
- 发现问题：伪造/不存在用户请求 GIP 文件接口时，后端使用 getUserDb 会创建空的用户 gip.sqlite 目录。
- 修复文件：apps/gip-team/server/index.ts；scripts/audit-integrity.sh
- 修复方式：新增 getExistingUserDb，只读文件查询和管理员文件查询不再自动创建用户库；清理巡检时误建的空目录。
- 上一次验证命令：bash scripts/check.sh；npm run build:server；bash scripts/audit-integrity.sh；pnpm typecheck；curl 18083/18085 health；probe-no-create 文件接口测试
- 结果：通过；probe_status=404 且 before=0 after=0
- 阻塞项：无

## 2026-06-02 10:56:41 +0800
- 当前步骤：删除 18081 旧 GIP 服务并盘点空间
- 操作：停止 pid=167784，删除 /opt/freshpixxp/app
- 结果：18081 已释放；/opt/freshpixxp/app 已删除；当前保留 18083 平台、127.0.0.1:18085 GIP、80 Nginx、8888 宝塔
- 空间：根分区 40G，已用约 13G，剩余约 25G；/opt/xinxianpai-toolhub 约 2.1G；/var/backups/xinxianpai-toolhub 约 862M；/opt/freshpixxp 剩余约 755M
- 阻塞项：无

## 2026-06-02 11:04:55 +0800
- 当前步骤：彻底删除旧 freshpixxp 项目残留
- 操作：复制旧 Node 运行时到 /opt/xinxianpai-toolhub/runtime/node；更新新项目脚本 PATH；重启 18083/18085；删除 /opt/freshpixxp
- 结果：/opt/freshpixxp 已删除；18081 不再监听；18083 和 127.0.0.1:18085 健康检查通过
- 当前主要占用：/opt/xinxianpai-toolhub 约 2.3G；/var/backups/xinxianpai-toolhub 约 862M；/www/server 宝塔约 703M；/var/lib/xinxianpai-toolhub 约 12M
- 阻塞项：无

## 2026-06-02 11:20:07 +0800
- 当前步骤：核查 API Key 全局应用、新图存储和预览图故障
- 结论：管理员在 GIP 原设置弹窗保存的新设置写入 /var/lib/xinxianpai-toolhub/gip-main.sqlite 的 global_configs.settings；GIP 生成接口通过 getEffectiveAdminSettings 读取该全局设置，所有用户共用。
- 新图位置：用户 wAZYEC8qtW14Ksfx0CZ7F 的最新图片写入用户库 /var/lib/xinxianpai-toolhub/users/<userId>/gip.sqlite，file_path=e8/a3/e8a3148eccf4023a84b17fded112a4ad12edd7dd2fa80746b6e35c6a3ba12034.png；OSS key=gip/<userId>/e8/a3/e8a3148eccf4023a84b17fded112a4ad12edd7dd2fa80746b6e35c6a3ba12034.png，大小 8890797 bytes。
- 发现问题：OSS signed URL GET 200 但响应没有 Access-Control-Allow-Origin，前端 getServerImage 使用 fetch().blob() 跨域跟随 302 时会被浏览器 CORS 拦截，导致刷新/回填预览图失败。
- 修复：配置 OSS Bucket CORS，允许 http://8.138.203.173:18083 等来源 GET/HEAD signed URL。
- 上一次验证命令：OSS signed GET with Origin 返回 200 且包含 Access-Control-Allow-Origin；pnpm --filter web typecheck；apps/gip-team npm run build:all；bash scripts/audit-integrity.sh；18083/18085 health
- 结果：通过
- 阻塞项：无

## 2026-06-02 11:32:48 +0800
- 当前步骤：补齐通知按钮对应的公告管理功能
- 发现问题：顶部通知按钮只渲染 Bell 图标，没有公告数据表、管理后台入口或前端弹窗内容。
- 修改文件：packages/db/src/index.ts；apps/web/src/lib/data.ts；apps/web/src/lib/actions.ts；apps/web/src/app/admin/announcements/page.tsx；apps/web/src/components/admin-tabs.tsx；apps/web/src/components/client-controls.tsx；apps/web/src/lib/layout.tsx；scripts/audit-integrity.sh
- 实现：新增 announcements 表；管理后台新增 /admin/announcements；支持发布、编辑、停用/启用、删除公告；顶部通知按钮显示公告数量并弹窗展示启用公告。
- 验证命令：pnpm --filter @xinxianpai/db typecheck；pnpm --filter web typecheck；pnpm --filter web build；bash scripts/audit-integrity.sh；curl 18083 /api/health
- 结果：通过；18083 已重启；/admin/announcements 未登录返回 307；测试公告 notice_smoke 已启用
- 阻塞项：无

## 2026-06-02 11:39:26 +0800
- 当前步骤：调整公告通知弹窗视觉样式
- 修改文件：apps/web/src/components/client-controls.tsx
- 调整：通知数量气泡由红色改为绿色；弹窗遮罩由深黑改浅；弹窗去掉强阴影；弹窗位置改为更接近视觉中心。
- 验证命令：pnpm --filter web typecheck；加载 .env.production 后 pnpm --filter web build；重启 18083；curl /api/health
- 结果：通过
- 阻塞项：无

## 2026-06-02 12:10:20 +0800
- 当前步骤：修复生图 HTTP 500
- 根因：GIP 后端生成耗时较长，本次约 424 秒；平台 Next 代理 /tools/gip/api/* 使用默认 fetch，等待上游响应头超时后抛出 UND_ERR_HEADERS_TIMEOUT，前端看到 HTTP 500；GIP 后端实际仍继续执行并最终写入 success。
- 修改文件：apps/web/src/app/tools/gip/api/[...path]/route.ts；apps/web/package.json；pnpm-lock.yaml
- 修复：平台代理引入 undici Agent，将 headersTimeout/bodyTimeout 提升到 15 分钟。
- 验证命令：pnpm --filter web typecheck；加载 .env.production 后 pnpm --filter web build；重启 18083；bash scripts/audit-integrity.sh；curl 18083 /api/health
- 结果：通过
- 阻塞项：无

## 2026-06-02 14:40:51 +0800
- 当前步骤：修复长时间生图 Failed to fetch
- 根因：用户最新生成任务后端成功，但 GIP 请求耗时约 1164 秒；之前平台代理超时为 15 分钟，超过后浏览器看到 Failed to fetch，刷新后因后端任务已成功所以能看到结果。
- 修改文件：apps/web/src/app/tools/gip/api/[...path]/route.ts；scripts/audit-integrity.sh
- 修复：将 /tools/gip/api 代理 headersTimeout/bodyTimeout 从 15 分钟提高到 30 分钟，并加入审计检查。
- 验证命令：pnpm --filter web typecheck；加载 .env.production 后 pnpm --filter web build；bash scripts/audit-integrity.sh；重启 18083；curl /api/health
- 结果：通过
- 阻塞项：无
