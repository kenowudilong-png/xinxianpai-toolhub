"use server";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureUserToolSpace } from "@/lib/tool-data";

export async function gipMockGenerateAction(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const prompt = String(formData.get("prompt") || "").trim();
  const space = ensureUserToolSpace(user.id, "gip");
  db().prepare(`INSERT INTO usage_logs (id, user_id, tool_id, provider, model, status, duration_ms, error_message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(nanoid(), user.id, "gip", "platform-proxy", "mock", prompt ? "success" : "missing_prompt", 0, prompt ? null : "Prompt is empty", new Date().toISOString());
  redirect(`/tools/gip?generated=1&db=${encodeURIComponent(space.sqlitePath)}`);
}
