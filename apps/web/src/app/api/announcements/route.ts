import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { listAnnouncementsForUser } from "@/lib/data";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(listAnnouncementsForUser(user.id));
}
