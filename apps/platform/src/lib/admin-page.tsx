import { redirect } from "next/navigation";
import { currentUser, isInitialized } from "./auth";
import { AppShell } from "./layout";
import { AdminTabs } from "@/components/AdminTabs";

export async function AdminPageShell({ title, children }: { title: string; children: React.ReactNode }) {
  if (!isInitialized()) redirect("/setup");
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");
  return <AppShell user={user} title="管理后台"><h1>管理后台</h1><AdminTabs /><section className="page-card"><h2>{title}</h2>{children}</section></AppShell>;
}
