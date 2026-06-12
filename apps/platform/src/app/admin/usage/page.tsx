export const dynamic = "force-dynamic";
import { AdminPageShell } from "@/lib/admin-page";
import { listTools, listUsageLogs, listUsers, usageSummary } from "@/lib/data";

export default async function UsagePage() {
  const summary = usageSummary();
  const logs = listUsageLogs();
  const users = listUsers();
  const tools = listTools("admin", true);
  return <AdminPageShell title="用量统计">
    <div className="stat-grid"><div className="stat">今日<strong>{summary.today}</strong></div><div className="stat">本月<strong>{summary.month}</strong></div><div className="stat">活跃<strong>{summary.active}/{users.length}</strong></div></div>
    <div className="form-grid"><label>时间<select className="input"><option>近7天</option><option>近30天</option></select></label><label>用户<select className="input"><option>全部</option>{users.map(user => <option key={user.id}>{user.username}</option>)}</select></label><label>工具<select className="input"><option>全部</option>{tools.map(tool => <option key={tool.id}>{tool.name}</option>)}</select></label><button className="btn">查询</button><button className="btn ghost">重置</button><a className="btn ghost" href="/admin/usage/export">导出</a></div>
    <table className="table"><thead><tr><th>时间</th><th>用户</th><th>工具</th><th>服务商</th><th>状态</th></tr></thead><tbody>{logs.map(row => <tr key={row.id}><td>{row.created_at}</td><td>{row.display_name || row.username || "-"}</td><td>{row.tool_name || row.tool_id}</td><td>{row.provider || "-"}</td><td>{row.status === "success" ? "✅ 成功" : "❌ 失败"}</td></tr>)}</tbody></table><p className="muted">&lt; 1 2 &gt;</p>
  </AdminPageShell>;
}
