import "server-only";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { openUserToolDatabase } from "@xinxianpai/db";
import { userToolDataPath, userToolFilePrefix } from "@xinxianpai/shared";
import { env } from "./env";

export function ensureUserToolSpace(userId: string, toolId: string) {
  const sqlitePath = userToolDataPath(env.dataDir, userId, toolId);
  const db = openUserToolDatabase(sqlitePath);
  db.prepare("INSERT OR IGNORE INTO tool_events (id, created_at, type, payload) VALUES (?, ?, ?, ?)")
    .run(`${toolId}-init`, new Date().toISOString(), "init", JSON.stringify({ toolId, userId }));
  db.close();
  const filePrefix = userToolFilePrefix(toolId, userId);
  const fileDir = join(env.dataDir, "files", filePrefix);
  mkdirSync(fileDir, { recursive: true });
  return { sqlitePath, fileDir, filePrefix };
}
