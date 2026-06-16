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
  tutorial_intro: string;
  tutorial_content: string;
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

export type UsageFilters = {
  range?: string;
  userId?: string;
  toolId?: string;
};

export type UsageLogRow = {
  id: string;
  user_id: string | null;
  tool_id: string | null;
  provider: string | null;
  model: string | null;
  status: string;
  duration_ms: number | null;
  error_message: string | null;
  created_at: string;
  username: string | null;
  display_name: string | null;
  tool_name: string | null;
};

export type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  level: "info" | "success" | "warning" | "danger";
  enabled: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  pinned: number;
};

export type AnnouncementForUser = {
  id: string;
  title: string;
  body: string;
  level: AnnouncementRow["level"];
  publishedAt: string;
  pinned: boolean;
  readAt: string | null;
  isRead: boolean;
  beijingTime: string;
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

export function listUsageLogs(filters: UsageFilters = {}) {
  const clauses: string[] = [];
  const params: string[] = [];
  const since = sinceForRange(filters.range);
  if (since) { clauses.push("usage_logs.created_at >= ?"); params.push(since); }
  if (filters.userId) { clauses.push("usage_logs.user_id = ?"); params.push(filters.userId); }
  if (filters.toolId) { clauses.push("usage_logs.tool_id = ?"); params.push(filters.toolId); }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return db().prepare(`SELECT usage_logs.*, users.username, users.display_name, tools.name AS tool_name FROM usage_logs LEFT JOIN users ON users.id = usage_logs.user_id LEFT JOIN tools ON tools.id = usage_logs.tool_id ${where} ORDER BY usage_logs.created_at DESC LIMIT 200`).all(...params) as UsageLogRow[];
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

export function listAnnouncements(includeDisabled = false): AnnouncementRow[] {
  const where = includeDisabled ? "" : "WHERE enabled = 1";
  return db().prepare(`SELECT * FROM announcements ${where} ORDER BY pinned DESC, COALESCE(published_at, created_at) DESC, created_at DESC`).all() as AnnouncementRow[];
}

export function listAnnouncementsForUser(userId: string): { announcements: AnnouncementForUser[]; unreadCount: number } {
  const rows = db().prepare(`
    SELECT announcements.*, announcement_reads.read_at
    FROM announcements
    LEFT JOIN announcement_reads
      ON announcement_reads.announcement_id = announcements.id
      AND announcement_reads.user_id = ?
    WHERE announcements.enabled = 1
    ORDER BY announcements.pinned DESC, COALESCE(announcements.published_at, announcements.created_at) DESC, announcements.created_at DESC
  `).all(userId) as Array<AnnouncementRow & { read_at: string | null }>;
  const announcements = rows.map((row) => {
    const publishedAt = row.published_at || row.created_at;
    return {
      id: row.id,
      title: row.title,
      body: row.content,
      level: row.level,
      publishedAt,
      pinned: Boolean(row.pinned),
      readAt: row.read_at || null,
      isRead: Boolean(row.read_at),
      beijingTime: formatBeijingMinute(publishedAt),
    };
  });
  return { announcements, unreadCount: announcements.filter((item) => !item.isRead).length };
}

export function markAnnouncementRead(userId: string, announcementId: string) {
  const row = db().prepare("SELECT id FROM announcements WHERE id = ? AND enabled = 1").get(announcementId) as { id: string } | undefined;
  if (!row) return false;
  db().prepare("INSERT OR IGNORE INTO announcement_reads (user_id, announcement_id, read_at) VALUES (?, ?, ?)")
    .run(userId, announcementId, new Date().toISOString());
  return true;
}

export function markAllAnnouncementsRead(userId: string) {
  const now = new Date().toISOString();
  const rows = db().prepare("SELECT id FROM announcements WHERE enabled = 1").all() as Array<{ id: string }>;
  const insert = db().prepare("INSERT OR IGNORE INTO announcement_reads (user_id, announcement_id, read_at) VALUES (?, ?, ?)");
  const tx = db().transaction(() => rows.forEach((row) => insert.run(userId, row.id, now)));
  tx();
  return rows.length;
}

export function formatBeijingMinute(iso: string) {
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "00";
  return `${value("year")}-${value("month")}-${value("day")} ${value("hour")}:${value("minute")}`;
}

export function createAudit(actorUserId: string | null, action: string, target?: string) {
  db().prepare("INSERT INTO audit_log (id, actor_user_id, action, target, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(nanoid(), actorUserId, action, target || null, new Date().toISOString());
}

function sinceForRange(range?: string) {
  const now = new Date();
  if (range === "today") now.setHours(0, 0, 0, 0);
  else if (range === "month") { now.setDate(1); now.setHours(0, 0, 0, 0); }
  else if (range === "7d") now.setDate(now.getDate() - 7);
  else return null;
  return now.toISOString();
}
