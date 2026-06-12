import "server-only";
import { nanoid } from "nanoid";
import { db } from "./db";
import type { UserRole } from "@xinxianpai/shared";

export type ToolRow = {
  id: string;
  name: string;
  icon: string;
  path: string;
  description: string;
  open_mode: "embedded" | "new_tab";
  visibility: "all" | "admin";
  sort_order: number;
  enabled: number;
  created_at: string;
  updated_at: string;
};

export type UserRow = {
  id: string;
  username: string;
  display_name: string | null;
  role: UserRole;
  disabled: number;
  must_change_password: number;
  created_at: string;
  last_login_at: string | null;
};

export type ApiConfigRow = {
  id: string;
  tool_id: string;
  tool_name?: string;
  note: string | null;
  provider: string | null;
  base_url: string;
  models_json: string;
  enabled: number;
  is_default: number;
  created_at: string;
  updated_at: string | null;
};

export function listTools(role?: UserRole, includeDisabled = false): ToolRow[] {
  const clauses = [];
  if (!includeDisabled) clauses.push("enabled = 1");
  if (role !== "admin") clauses.push("visibility = 'all'");
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return db().prepare(`SELECT * FROM tools ${where} ORDER BY sort_order ASC, created_at ASC`).all() as ToolRow[];
}

export function getTool(id: string, role?: UserRole) {
  const tool = db().prepare("SELECT * FROM tools WHERE id = ?").get(id) as ToolRow | undefined;
  if (!tool || !tool.enabled) return null;
  if (tool.visibility === "admin" && role !== "admin") return null;
  return tool;
}

export function listUsers(): UserRow[] {
  return db().prepare("SELECT id, username, display_name, role, disabled, must_change_password, created_at, last_login_at FROM users ORDER BY created_at DESC").all() as UserRow[];
}

export function listApiConfigs(): ApiConfigRow[] {
  return db().prepare(`SELECT api_configs.*, tools.name AS tool_name FROM api_configs LEFT JOIN tools ON tools.id = api_configs.tool_id ORDER BY api_configs.created_at DESC`).all() as ApiConfigRow[];
}

export function listUsageLogs() {
  return db().prepare(`SELECT usage_logs.*, users.username, users.display_name, tools.name AS tool_name FROM usage_logs LEFT JOIN users ON users.id = usage_logs.user_id LEFT JOIN tools ON tools.id = usage_logs.tool_id ORDER BY usage_logs.created_at DESC LIMIT 200`).all() as any[];
}

export function usageSummary() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const month = new Date();
  month.setDate(1); month.setHours(0, 0, 0, 0);
  const todayCount = db().prepare("SELECT COUNT(*) AS count FROM usage_logs WHERE created_at >= ?").get(today.toISOString()) as { count: number };
  const monthCount = db().prepare("SELECT COUNT(*) AS count FROM usage_logs WHERE created_at >= ?").get(month.toISOString()) as { count: number };
  const active = db().prepare("SELECT COUNT(DISTINCT user_id) AS count FROM usage_logs WHERE user_id IS NOT NULL").get() as { count: number };
  return { today: todayCount.count, month: monthCount.count, active: active.count };
}

export function createAudit(actorUserId: string | null, action: string, target?: string) {
  db().prepare("INSERT INTO audit_log (id, actor_user_id, action, target, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(nanoid(), actorUserId, action, target || null, new Date().toISOString());
}
