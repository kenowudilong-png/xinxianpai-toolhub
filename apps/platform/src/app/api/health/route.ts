import { NextResponse } from "next/server";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export async function GET() {
  const marker = join(env.dataDir, ".healthcheck");
  db().prepare("SELECT 1").get();
  mkdirSync(env.dataDir, { recursive: true });
  writeFileSync(marker, new Date().toISOString());
  rmSync(marker, { force: true });
  return NextResponse.json({ ok: true, dataDir: env.dataDir, storage: "writable", time: new Date().toISOString() });
}
