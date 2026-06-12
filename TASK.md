## 当前项目任务

**目标**：在 VPS `/opt/xinxianpai-toolhub` 开发并旁路运行芯鲜派工具站第一版：统一平台 + GIP-Team 内置工具。

**完成标准**：平台在 VPS 旁路端口可运行；管理员可 setup 和建号；用户可登录门户并进入 `/tools/gip`；密钥只在服务端；数据写入 `/var/lib/xinxianpai-toolhub`；自动检查脚本可运行；现有 `/opt/freshpixxp/app` 和 `18081` 服务不受影响。

### 步骤

- [x] 1. VPS 预检与备份  
  验证：`docs/VPS_INVENTORY.md` 存在，`/var/backups/xinxianpai-toolhub/preflight` 有 freshpixxp 与 nginx 备份。

- [ ] 2. 建立远程 Harness 与环境文件  
  验证：`AGENTS.md`、`TASK.md`、`STATE.md`、`LOG.md`、`.env.example`、`.env.production` 存在，且 `STATE.md` 写明 VPS 和工作目录。

- [ ] 3. 创建 monorepo 与基础包  
  验证：`package.json`、`pnpm-workspace.yaml`、`apps/platform`、`apps/gip-team`、`packages/shared`、`packages/db`、`packages/storage` 存在。

- [ ] 4. 实现平台身份、门户、管理后台  
  验证：setup/login/admin/portal 基础流程可通过本地 HTTP 验证，主库写入 `/var/lib/xinxianpai-toolhub/main.sqlite`。

- [ ] 5. 实现密钥代理、日志、存储隔离  
  验证：API Key 加密存储；代理调用写日志；用户文件路径按 `toolId/userId` 隔离。

- [ ] 6. 接入 GIP-Team 旁路工具  
  验证：`/tools/gip` 可打开，无二次登录和用户侧 Key 设置；不修改 `/opt/freshpixxp/app`。

- [ ] 7. 添加自动化检查和自修复脚本  
  验证：`bash scripts/check.sh` 与 `bash scripts/audit-harness.sh` 可运行。

- [ ] 8. 旁路启动与验收  
  验证：`curl http://127.0.0.1:18083/api/health` 返回健康，现有 `18081` 服务仍在。
