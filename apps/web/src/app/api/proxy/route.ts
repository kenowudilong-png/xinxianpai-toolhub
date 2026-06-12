import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const started = Date.now();
  const contentType = request.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await request.json().catch(() => ({})) : Object.fromEntries((await request.formData()).entries());
  const toolId = String((body as any).toolId || "gip");
  const requestedModel = String((body as any).model || "");
  const database = db();
  const config = database.prepare("SELECT * FROM api_configs WHERE enabled = 1 AND tool_id = ? ORDER BY is_default DESC, created_at ASC LIMIT 1").get(toolId) as any;
  if (!config) {
    writeLog(user.id, toolId, "missing_config", Date.now() - started, "No API config");
    return NextResponse.json({ error: "API config missing" }, { status: 400 });
  }
  try {
    const models = JSON.parse(config.models_json || "[]") as string[];
    const model = requestedModel || models[0] || config.model;
    if (model && models.length && !models.includes(model)) {
      writeLog(user.id, toolId, "failed", Date.now() - started, "Model not allowed", config.note || config.provider, model);
      return NextResponse.json({ error: "Model not configured for this tool" }, { status: 400 });
    }
    decryptSecret(config.encrypted_key);
    writeLog(user.id, toolId, "success", Date.now() - started, null, config.note || config.provider, model);
    return NextResponse.json({ ok: true, proxied: true, toolId, provider: config.note || config.provider, model, request: { hasPrompt: Boolean((body as any).prompt) } });
  } catch (error) {
    writeLog(user.id, toolId, "failed", Date.now() - started, error instanceof Error ? error.message : "proxy error", config.note || config.provider, config.model);
    return NextResponse.json({ error: "Proxy failed" }, { status: 502 });
  }
}

function writeLog(userId: string, toolId: string, status: string, durationMs: number, errorMessage?: string | null, provider?: string, model?: string) {
  db().prepare(`INSERT INTO usage_logs (id, user_id, tool_id, provider, model, status, duration_ms, error_message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(nanoid(), userId, toolId, provider || null, model || null, status, durationMs, errorMessage || null, new Date().toISOString());
}
