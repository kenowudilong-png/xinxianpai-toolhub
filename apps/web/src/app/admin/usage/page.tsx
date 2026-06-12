export const dynamic = "force-dynamic";
import { AdminPageShell } from "@/lib/admin-page";
import { listTools, listUsageLogs, listUsers, usageSummary } from "@/lib/data";
import { Button } from "@/components/ui/button";

export default async function Usage({ searchParams }: { searchParams: Promise<{ range?: string; userId?: string; toolId?: string }> }) {
  const params = await searchParams;
  const s = usageSummary();
  const users = listUsers();
  const tools = listTools("admin", true);
  const logs = listUsageLogs(params);
  return <AdminPageShell title="用量统计"><div className="mb-5 grid gap-3 md:grid-cols-3"><div className="rounded-2xl border p-4">今日<strong className="block text-3xl">{s.today}</strong></div><div className="rounded-2xl border p-4">本月<strong className="block text-3xl">{s.month}</strong></div><div className="rounded-2xl border p-4">活跃<strong className="block text-3xl">{s.active}/{users.length}</strong></div></div><form className="mb-5 flex flex-wrap gap-2"><select className="rounded-xl border bg-background px-3 py-2" name="range" defaultValue={params.range || "7d"}><option value="7d">近7天</option><option value="today">今日</option><option value="month">本月</option><option value="all">全部</option></select><select className="rounded-xl border bg-background px-3 py-2" name="userId" defaultValue={params.userId || ""}><option value="">全部用户</option>{users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}</select><select className="rounded-xl border bg-background px-3 py-2" name="toolId" defaultValue={params.toolId || ""}><option value="">全部工具</option>{tools.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select><Button>查询</Button><Button asChild variant="outline"><a href="/admin/usage">重置</a></Button><Button asChild variant="outline"><a href="/admin/usage/export">导出</a></Button></form><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-3">时间</th><th>用户</th><th>工具</th><th>服务商</th><th>状态</th></tr></thead><tbody>{logs.map(r => <tr key={r.id} className="border-b"><td className="p-3">{r.created_at}</td><td>{r.display_name || r.username || "-"}</td><td>{r.tool_name || r.tool_id}</td><td>{r.provider || "-"}</td><td>{r.status === "success" ? "✅ 成功" : r.status === "missing_config" ? "⚠️ 缺配置" : "❌ 失败"}</td></tr>)}</tbody></table></AdminPageShell>;
}
