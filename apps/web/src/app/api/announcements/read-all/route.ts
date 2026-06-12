import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { listAnnouncementsForUser, markAllAnnouncementsRead } from "@/lib/data";

export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  markAllAnnouncementsRead(user.id);
  return NextResponse.json(listAnnouncementsForUser(user.id));
}
