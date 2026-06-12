export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { currentUser, isInitialized } from "@/lib/auth";
import { AppShell } from "@/lib/layout";
import { getTool } from "@/lib/data";
import { ensureUserToolSpace } from "@/lib/tool-data";
import { ToolToolbar } from "@/components/ClientControls";
import { gipMockGenerateAction } from "./actions";

export default async function GipToolPage({ searchParams }: { searchParams: Promise<{ generated?: string }> }) {
  if (!isInitialized()) redirect("/setup");
  const user = await currentUser();
  if (!user) redirect("/login");
  const tool = getTool("gip", user.role);
  if (!tool) redirect("/");
  const space = ensureUserToolSpace(user.id, "gip");
  const params = await searchParams;
  return <AppShell user={user} title="生图站">
    <div className="tool-page-head"><div><h1>生图站</h1><p className="muted">平台内置的团队生图工具，密钥由服务端代理统一注入。</p></div><ToolToolbar path="/tools/gip" /></div>
    {params.generated ? <p className="page-card">已写入本用户 GIP 空间与用量日志。</p> : null}
    <section className="tool-frame"><div className="frame-placeholder">
      <h2>🎨 生图请求验证</h2><p className="muted">此页面不提供 API Key 输入，所有请求由平台服务端处理。</p>
      <form action={gipMockGenerateAction}><textarea className="input" name="prompt" placeholder="输入提示词，用于验证代理链路" rows={5}></textarea><button className="btn" type="submit">发送到密钥代理</button></form>
      <hr style={{ margin: "24px 0", border: 0, borderTop: "1px solid #edf1f7" }} /><p className="muted">用户库：{space.sqlitePath}</p><p className="muted">文件目录：{space.fileDir}</p>
    </div></section>
  </AppShell>;
}
