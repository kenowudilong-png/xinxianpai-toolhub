export const dynamic = "force-dynamic";

import { AdminPageShell } from "@/lib/admin-page";

export default async function GipAppSettingsPage() {
  return (
    <AdminPageShell title="生图应用设置">
      <div className="h-[calc(100vh-14rem)] min-h-[720px] overflow-hidden rounded-2xl border bg-background">
        <iframe
          className="h-full w-full border-0 bg-background"
          src="/tools/gip/app/admin?settings=1&embed=settings"
          title="生图应用设置"
        />
      </div>
    </AdminPageShell>
  );
}
