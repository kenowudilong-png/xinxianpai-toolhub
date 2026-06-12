export const dynamic = "force-dynamic";
import { AdminPageShell } from "@/lib/admin-page";
import { listTools } from "@/lib/data";
import { createToolAction, reorderToolAction, toggleToolAction } from "@/lib/actions";

export default async function ToolsPage() {
  const tools = listTools("admin", true);
  return <AdminPageShell title="工具管理">
    <form className="form-grid" action={createToolAction}>
      <label>ID<input className="input" name="id" placeholder="chat" /></label><label>名称<input className="input" name="name" required /></label><label>图标<input className="input" name="icon" defaultValue="🧰" /></label><label>地址<input className="input" name="path" placeholder="/tools/chat" required /></label><label>描述<input className="input" name="description" /></label><label>打开方式<select className="input" name="openMode"><option value="embedded">内置</option><option value="new_tab">新标签</option></select></label><label>谁可见<select className="input" name="visibility"><option value="all">全部成员</option><option value="admin">管理员</option></select></label><button className="btn" type="submit">+ 接入新工具</button>
    </form>
    <table className="table"><thead><tr><th>排序</th><th>名称</th><th>地址</th><th>方式</th><th>状态</th><th>操作</th></tr></thead><tbody>{tools.map(tool => <tr key={tool.id}><td className="actions"><form action={reorderToolAction}><input type="hidden" name="id" value={tool.id} /><input type="hidden" name="direction" value="up" /><button className="btn mini ghost">↑</button></form><form action={reorderToolAction}><input type="hidden" name="id" value={tool.id} /><input type="hidden" name="direction" value="down" /><button className="btn mini ghost">↓</button></form></td><td>{tool.icon} {tool.name}</td><td>{tool.path}</td><td>{tool.open_mode === "embedded" ? "内置" : "新标签"}</td><td>{tool.enabled ? "启用" : "停用"}</td><td className="actions"><form action={createToolAction}><input type="hidden" name="id" value={tool.id} /><input type="hidden" name="name" value={tool.name} /><input type="hidden" name="icon" value={tool.icon} /><input type="hidden" name="path" value={tool.path} /><input type="hidden" name="description" value={tool.description} /><input type="hidden" name="openMode" value={tool.open_mode} /><input type="hidden" name="visibility" value={tool.visibility} /><button className="btn mini ghost" type="submit">编辑</button></form><form action={toggleToolAction}><input type="hidden" name="id" value={tool.id} /><button className="btn mini ghost" type="submit">{tool.enabled ? "停用" : "启用"}</button></form></td></tr>)}</tbody></table>
  </AdminPageShell>;
}
