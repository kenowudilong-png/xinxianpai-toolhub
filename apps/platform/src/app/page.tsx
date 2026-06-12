export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { currentUser, isInitialized } from "@/lib/auth";
import { AppShell } from "@/lib/layout";
import { listTools } from "@/lib/data";
import { ToolSearch } from "@/components/ClientControls";

export default async function HomePage() {
  if (!isInitialized()) redirect("/setup");
  const user = await currentUser();
  if (!user) redirect("/login");
  const tools = listTools(user.role);
  return <AppShell user={user} title="首页"><ToolSearch tools={tools} /></AppShell>;
}
