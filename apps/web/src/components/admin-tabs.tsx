"use client";
import {usePathname} from "next/navigation";
const tabs=[["/admin/users","用户"],["/admin/app-settings","应用设置"],["/admin/usage","用量"],["/admin/announcements","公告"],["/admin/tools","工具"]];
export function AdminTabs(){const p=usePathname();return <nav className="mb-5 flex gap-2">{tabs.map(([href,label])=>{const active=p===href || (href==="/admin/app-settings" && p.startsWith("/admin/app-settings/"));return <a key={href} href={href} className={`rounded-xl border px-4 py-2 text-sm ${active?"bg-primary text-primary-foreground":"bg-card hover:bg-accent"}`}>{label}</a>})}</nav>}
