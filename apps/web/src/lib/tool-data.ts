import "server-only";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { openUserToolDatabase } from "@xinxianpai/db";
import { userToolDataPath, userToolFilePrefix } from "@xinxianpai/shared";
import { env } from "./env";
import { db } from "./db";

export function ensureUserToolSpace(userId: string, toolId: string) {
  const sqlitePath = userToolDataPath(env.dataDir, userId, toolId);
  const database = openUserToolDatabase(sqlitePath);
  database.prepare("INSERT OR IGNORE INTO tool_events (id, created_at, type, payload) VALUES (?, ?, ?, ?)")
    .run(`${toolId}-init`, new Date().toISOString(), "init", JSON.stringify({ toolId, userId }));
  database.close();
  const filePrefix = userToolFilePrefix(toolId, userId);
  const fileDir = join(env.dataDir, "files", filePrefix);
  mkdirSync(fileDir, { recursive: true });
  return { sqlitePath, fileDir, filePrefix };
}

export function ensureUserToolSpaces(userId: string) {
  const tools = db().prepare("SELECT id FROM tools WHERE enabled = 1").all() as Array<{ id: string }>;
  for (const tool of tools) ensureUserToolSpace(userId, tool.id);
}

export function ensureToolSpaceForAllUsers(toolId: string) {
  const users = db().prepare("SELECT id FROM users").all() as Array<{ id: string }>;
  for (const user of users) ensureUserToolSpace(user.id, toolId);
}
