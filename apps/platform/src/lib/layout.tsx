import { brand } from "./brand";
import { logoutAction } from "./actions";
import { listTools } from "./data";
import type { SessionUser } from "./auth";
import { Sidebar, UserMenu } from "@/components/ClientControls";

export function AppShell({ user, title, children }: { user: SessionUser; title: string; children: React.ReactNode }) {
  const tools = listTools(user.role);
  return <div className="workspace-shell">
    <header className="topbar">
      <a className="top-brand" href="/"><img src={brand.logo} alt={brand.name} /><span>{brand.name}</span></a>
      <div className="top-title">{title}</div>
      <label className="top-search">🔍<input placeholder="搜索" /></label>
      <button className="icon-btn" type="button">🔔</button>
      <UserMenu name={user.displayName || user.username} isAdmin={user.role === "admin"} logoutAction={logoutAction} />
    </header>
    <div className="workspace-body"><Sidebar tools={tools} isAdmin={user.role === "admin"} /><main className="content-area">{children}</main></div>
  </div>;
}

export const Shell = AppShell;
