"use client";
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ToolRow } from "@/lib/data";

export function Sidebar({ tools, isAdmin }: { tools: ToolRow[]; isAdmin: boolean }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(() => typeof window !== "undefined" && localStorage.getItem("xxp-sidebar") === "1");
  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("xxp-sidebar", next ? "1" : "0");
  }
  return <aside className={collapsed ? "sidebar collapsed" : "sidebar"}>
    <a className={pathname === "/" ? "side-item active" : "side-item"} href="/"><span>🏠</span><b>首页</b></a>
    {tools.map(tool => <a key={tool.id} className={pathname.startsWith(tool.path) ? "side-item active" : "side-item"} href={tool.path}><span>{tool.icon}</span><b>{tool.name}</b></a>)}
    <div className="side-separator" />
    {isAdmin ? <a className={pathname.startsWith("/admin") ? "side-item active" : "side-item"} href="/admin/users"><span>⚙️</span><b>管理</b></a> : null}
    <button className="side-item side-collapse" onClick={toggle} type="button"><span>{collapsed ? "»" : "«"}</span><b>收起</b></button>
  </aside>;
}

export function UserMenu({ name, isAdmin, logoutAction }: { name: string; isAdmin: boolean; logoutAction: () => void }) {
  const [open, setOpen] = useState(false);
  return <div className="user-menu">
    <button className="avatar-btn" onClick={() => setOpen(!open)} type="button">👤 {name} ▾</button>
    {open ? <div className="menu-popover">
      <div className="menu-title">👤 {name}</div>
      <a href="/settings/profile">个人设置</a>
      <a href="/settings/password">修改密码</a>
      {isAdmin ? <span className="menu-badge">管理员</span> : null}
      <form action={logoutAction}><button type="submit">退出登录</button></form>
    </div> : null}
  </div>;
}

export function PasswordInput({ name = "password", placeholder }: { name?: string; placeholder?: string }) {
  const [visible, setVisible] = useState(false);
  return <div className="password-wrap"><input className="input" name={name} type={visible ? "text" : "password"} placeholder={placeholder} required /><button type="button" onClick={() => setVisible(!visible)}>{visible ? "🙈" : "👁"}</button></div>;
}

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  return <button className="btn" disabled={loading} onClick={() => setLoading(true)} type="submit">{loading ? "处理中…" : children}</button>;
}

export function ToolSearch({ tools }: { tools: ToolRow[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => tools.filter(tool => `${tool.name}${tool.description}`.toLowerCase().includes(query.toLowerCase())), [query, tools]);
  return <>
    <div className="section-head"><h1>我的工具</h1><label className="search">🔍<input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索工具..." /></label></div>
    {filtered.length ? <section className="tool-grid">{filtered.map(tool => <article className="tool-card" key={tool.id}>
      <div className="tool-icon">{tool.icon}</div><h2>{tool.name}</h2><p>{tool.description}</p><a className="btn" href={tool.path}>打开</a>
    </article>)}</section> : <div className="empty-state"><img src="/brand/logo-freshpi.png" alt="芯鲜派" /><p>暂无可用工具，请联系管理员。</p></div>}
  </>;
}

export function ToolToolbar({ path }: { path: string }) {
  const router = useRouter();
  return <div className="tool-actions"><button className="btn ghost" onClick={() => router.refresh()} type="button">⟳ 刷新</button><a className="btn ghost" href={path} target="_blank">⤢ 新标签</a><a className="btn ghost" href="/">← 返回</a></div>;
}

export function RandomPasswordButton({ targetName = "password" }: { targetName?: string }) {
  function fill() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#%";
    const password = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const input = document.querySelector<HTMLInputElement>(`input[name="${targetName}"]`);
    if (input) input.value = password;
  }
  return <button className="btn mini" type="button" onClick={fill}>🔄 随机</button>;
}

export function ModelFields() {
  const [items, setItems] = useState(["gpt-image-1"]);
  return <div className="model-list">{items.map((item, index) => <input key={index} className="input" name="models" defaultValue={item} placeholder="模型" />)}<button className="btn mini" type="button" onClick={() => setItems([...items, ""])}>+ 再加</button></div>;
}
