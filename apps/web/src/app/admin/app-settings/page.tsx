export const dynamic = "force-dynamic";

import { AdminPageShell } from "@/lib/admin-page";
import { listTools } from "@/lib/data";
import { AppSettingsCards } from "@/components/app-settings-cards";

export default async function AppSettingsPage() {
  const tools = listTools("admin", true).map((tool) => ({ id: tool.id, name: tool.name, icon: tool.icon, description: tool.description }));
  return (
    <AdminPageShell title="应用设置">
      <AppSettingsCards tools={tools} mode="links" />
    </AdminPageShell>
  );
}
