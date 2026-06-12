export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { AppShell } from "@/lib/layout";
export default async function ProfilePage() { const user = await currentUser(); if (!user) redirect("/login"); return <AppShell user={user} title="个人设置"><section className="page-card"><h1>个人设置</h1><p>用户名：{user.username}</p><p>姓名：{user.displayName}</p><p>角色：{user.role === "admin" ? "管理员" : "成员"}</p></section></AppShell>; }
