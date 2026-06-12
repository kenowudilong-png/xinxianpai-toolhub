export const dynamic = "force-dynamic";
import { AdminPageShell } from "@/lib/admin-page";
import { listApiConfigs, listTools } from "@/lib/data";
import { createApiConfigAction, deleteApiConfigAction } from "@/lib/actions";
import { ModelFields, PasswordInput } from "@/components/ClientControls";

export default async function ApiConfigsPage() {
  const configs = listApiConfigs();
  const tools = listTools("admin", true);
  return <AdminPageShell title="接口配置（每个工具单独填 URL/Key/模型）">
    <form className="form-grid" action={createApiConfigAction}>
      <label>所属工具<select className="input" name="toolId">{tools.map(tool => <option value={tool.id} key={tool.id}>{tool.name}</option>)}</select></label>
      <label>备注<input className="input" name="note" placeholder="主接口 / 备用" /></label>
      <label>接口地址 URL<input className="input" name="baseUrl" placeholder="https://api.example.com/v1" required /></label>
      <label>API Key<PasswordInput name="apiKey" /></label>
      <label>模型<ModelFields /></label>
      <button className="btn" type="submit">+ 新增配置</button>
    </form>
    <table className="table"><thead><tr><th>所属工具</th><th>接口地址(URL)</th><th>模型</th><th>密钥</th><th>操作</th></tr></thead><tbody>{configs.map(config => <tr key={config.id}><td>{config.tool_name || config.tool_id}</td><td>{config.base_url}</td><td>{JSON.parse(config.models_json || "[]").join(" / ")}</td><td>{config.enabled ? "已配置" : "未配置"}</td><td><form action={deleteApiConfigAction}><input type="hidden" name="id" value={config.id} /><button className="btn mini danger" type="submit">删除</button></form></td></tr>)}</tbody></table>
    <p className="muted">列表不显示密钥明文，只标“已配置/未配置”。</p>
  </AdminPageShell>;
}
