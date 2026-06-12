export const dynamic = "force-dynamic";
import { notFound, redirect } from "next/navigation";
import { currentUser, isInitialized } from "@/lib/auth";
import { AppShell } from "@/lib/layout";
import { getTool } from "@/lib/data";
import { ensureUserToolSpace } from "@/lib/tool-data";
import { ToolToolbar } from "@/components/ClientControls";

export default async function GenericToolPage({ params }: { params: Promise<{ toolId: string }> }) {
  if (!isInitialized()) redirect("/setup");
  const user = await currentUser();
  if (!user) redirect("/login");
  const { toolId } = await params;
  const tool = getTool(toolId, user.role);
  if (!tool) notFound();
  const space = ensureUserToolSpace(user.id, tool.id);
  return <AppShell user={user} title={tool.name}>
    <div className="tool-page-head"><div><h1>{tool.name}</h1><p className="muted">{tool.description}</p></div><ToolToolbar path={tool.path} /></div>
    <section className="tool-frame"><div className="frame-placeholder">
      <h2>{tool.icon} 正在打开 {tool.name}…</h2>
      <p className="muted">此工具已登记到工具站，后续可替换为真实内嵌应用。</p>
      <p className="muted">用户库：{space.sqlitePath}</p><p className="muted">文件目录：{space.fileDir}</p>
      {tool.open_mode === "new_tab" ? <a className="btn" href={tool.path} target="_blank">在新标签打开</a> : <button className="btn ghost">重试</button>}
    </div></section>
  </AppShell>;
}
