import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { listAnnouncementsForUser, markAnnouncementRead } from "@/lib/data";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!markAnnouncementRead(user.id, id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(listAnnouncementsForUser(user.id));
}
