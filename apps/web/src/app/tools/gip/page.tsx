export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { currentUser, isInitialized } from "@/lib/auth";
import { AppShell } from "@/lib/layout";
import { getTool } from "@/lib/data";
import { GipEmbed } from "@/components/gip-embed";

export default async function GipPage() {
  if (!isInitialized()) redirect("/setup");
  const user = await currentUser();
  if (!user) redirect("/login");
  const tool = getTool("gip", user.role);
  if (!tool) redirect("/");
  return (
    <AppShell user={user} title="生图站">
      <GipEmbed />
    </AppShell>
  );
}
