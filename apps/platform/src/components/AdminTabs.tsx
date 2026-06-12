"use client";
import { usePathname } from "next/navigation";
const tabs = [
  ["/admin/users", "用户"],
  ["/admin/api-configs", "接口配置"],
  ["/admin/usage", "用量"],
  ["/admin/tools", "工具"]
];
export function AdminTabs() {
  const pathname = usePathname();
  return <nav className="admin-tabs">{tabs.map(([href, label]) => <a key={href} className={pathname === href ? "active" : ""} href={href}>{label}</a>)}</nav>;
}
