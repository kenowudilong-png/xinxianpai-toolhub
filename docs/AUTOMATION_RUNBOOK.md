# 自动化执行 Runbook

固定入口：

```bash
ssh root@8.138.203.173
cd /opt/xinxianpai-toolhub
cat AGENTS.md TASK.md STATE.md LOG.md
```

每轮执行：

1. 读取 `STATE.md` 当前步骤。
2. 只实现当前步骤所需最小改动。
3. 运行相关验证；脚本可用后运行 `bash scripts/check.sh` 与 `bash scripts/audit-harness.sh`。
4. 失败先修根因，同类失败最多 3 次。
5. 更新 `STATE.md` 和 `LOG.md`。
6. 全部完成或阻塞时停止。
