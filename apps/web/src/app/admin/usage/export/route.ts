import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { listUsageLogs } from "@/lib/data";
export async function GET() {
  const user = await currentUser();
  if (!user || user.role !== "admin") return new NextResponse("forbidden", { status: 403 });
  const rows = listUsageLogs();
  const header = "time,user,tool,provider,status\n";
  const csv = header + rows.map(row => [row.created_at, row.username || "", row.tool_name || row.tool_id, row.provider || "", row.status].map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  return new NextResponse(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=usage.csv" } });
}
