"use server";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { db } from "./db";
import { createUser, currentUser, hashPassword, isInitialized, login, setSession, clearSession, verifyPassword } from "./auth";
import { encryptSecret } from "./crypto";
import { createAudit } from "./data";
import { ensureToolSpaceForAllUsers } from "./tool-data";

function value(formData: FormData, key: string) { return String(formData.get(key) || "").trim(); }
function adminOrRedirect(user: Awaited<ReturnType<typeof currentUser>>) { if (!user || user.role !== "admin") redirect("/login"); return user; }

export async function setupAction(formData: FormData) {
  if (isInitialized()) redirect("/login");
  const username = value(formData, "username");
  const password = String(formData.get("password") || "");
  if (!username || password.length < 8) redirect("/setup?error=invalid");
  const id = await createUser({ username, displayName: username, password, role: "admin" });
  await setSession({ id, username, displayName: username, role: "admin", mustChangePassword: false }, true);
  redirect("/admin/users");
}

export async function loginAction(formData: FormData) {
  const username = value(formData, "username");
  const password = String(formData.get("password") || "");
  const rememberMe = formData.get("rememberMe") === "on";
  const user = await login(username, password);
  if (!user) redirect("/login?error=invalid");
  await setSession(user, rememberMe);
  redirect(user.role === "admin" ? "/admin/users" : "/");
}

export async function logoutAction() { await clearSession(); redirect("/login"); }

export async function changePasswordAction(formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  if (newPassword.length < 8 || !currentPassword) redirect("/settings/password?error=invalid");
  const row = db().prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as { password_hash: string } | undefined;
  if (!row || !(await verifyPassword(row.password_hash, currentPassword))) redirect("/settings/password?error=current");
  db().prepare("UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?").run(await hashPassword(newPassword), user.id);
  createAudit(user.id, "change_password", user.id);
  redirect("/settings/password?ok=1");
}

export async function createUserAction(formData: FormData) {
  const actor = adminOrRedirect(await currentUser());
  const username = value(formData, "username");
  const displayName = value(formData, "displayName") || username;
  const password = String(formData.get("password") || "");
  const role = value(formData, "role") === "admin" ? "admin" : "user";
  if (!username || password.length < 8) redirect("/admin/users?error=user");
  const existing = db().prepare("SELECT id FROM users WHERE username = ?").get(username) as { id: string } | undefined;
  if (existing) redirect("/admin/users?error=duplicate");
  try {
    const id = await createUser({ username, displayName, password, role, mustChangePassword: true });
    createAudit(actor.id, "create_user", id);
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) redirect("/admin/users?error=duplicate");
    throw error;
  }
  redirect("/admin/users");
}

export async function updateUserAction(formData: FormData) {
  const actor = adminOrRedirect(await currentUser());
  const id = value(formData, "id");
  const displayName = value(formData, "displayName");
  const role = value(formData, "role") === "admin" ? "admin" : "user";
  db().prepare("UPDATE users SET display_name = ?, role = ? WHERE id = ?").run(displayName, role, id);
  createAudit(actor.id, "update_user", id);
  redirect("/admin/users");
}

export async function toggleUserDisabledAction(formData: FormData) {
  const actor = adminOrRedirect(await currentUser());
  const id = value(formData, "id");
  const row = db().prepare("SELECT disabled FROM users WHERE id = ?").get(id) as { disabled: number } | undefined;
  if (row) db().prepare("UPDATE users SET disabled = ? WHERE id = ?").run(row.disabled ? 0 : 1, id);
  createAudit(actor.id, "toggle_user", id);
  redirect("/admin/users");
}

export async function resetPasswordAction(formData: FormData) {
  const actor = adminOrRedirect(await currentUser());
  const id = value(formData, "id");
  const password = String(formData.get("password") || "");
  if (password.length < 8) redirect("/admin/users?error=password");
  db().prepare("UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?").run(await hashPassword(password), id);
  createAudit(actor.id, "reset_password", id);
  redirect("/admin/users");
}

export async function createApiConfigAction(formData: FormData) {
  const actor = adminOrRedirect(await currentUser());
  const toolId = value(formData, "toolId");
  const note = value(formData, "note");
  const baseUrl = value(formData, "baseUrl");
  const apiKey = String(formData.get("apiKey") || "");
  const models = formData.getAll("models").map(item => String(item).trim()).filter(Boolean);
  if (!toolId || !baseUrl || !apiKey || models.length === 0) redirect("/admin/api-configs?error=api");
  const database = db();
  const count = database.prepare("SELECT COUNT(*) as count FROM api_configs WHERE tool_id = ?").get(toolId) as { count: number };
  database.prepare(`INSERT INTO api_configs (id, tool_id, note, provider, model, base_url, encrypted_key, models_json, is_default, enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(nanoid(), toolId, note || null, note || toolId, models[0], baseUrl, encryptSecret(apiKey), JSON.stringify(models), count.count === 0 ? 1 : 0, 1, new Date().toISOString(), new Date().toISOString());
  createAudit(actor.id, "create_api_config", toolId);
  redirect("/admin/api-configs");
}

export async function deleteApiConfigAction(formData: FormData) {
  const actor = adminOrRedirect(await currentUser());
  const id = value(formData, "id");
  db().prepare("DELETE FROM api_configs WHERE id = ?").run(id);
  createAudit(actor.id, "delete_api_config", id);
  redirect("/admin/api-configs");
}

export async function updateApiConfigAction(formData: FormData) {
  const actor = adminOrRedirect(await currentUser());
  const id = value(formData, "id");
  const toolId = value(formData, "toolId");
  const note = value(formData, "note");
  const baseUrl = value(formData, "baseUrl");
  const apiKey = String(formData.get("apiKey") || "");
  const models = formData.getAll("models").map(item => String(item).trim()).filter(Boolean);
  if (!id || !toolId || !baseUrl || models.length === 0) redirect("/admin/api-configs?error=api");
  const params = apiKey
    ? [toolId, note || null, note || toolId, models[0], baseUrl, JSON.stringify(models), encryptSecret(apiKey), new Date().toISOString(), id]
    : [toolId, note || null, note || toolId, models[0], baseUrl, JSON.stringify(models), new Date().toISOString(), id];
  const sql = apiKey
    ? "UPDATE api_configs SET tool_id = ?, note = ?, provider = ?, model = ?, base_url = ?, models_json = ?, encrypted_key = ?, updated_at = ? WHERE id = ?"
    : "UPDATE api_configs SET tool_id = ?, note = ?, provider = ?, model = ?, base_url = ?, models_json = ?, updated_at = ? WHERE id = ?";
  db().prepare(sql).run(...params);
  createAudit(actor.id, "update_api_config", id);
  redirect("/admin/api-configs");
}

export async function createToolAction(formData: FormData) {
  const actor = adminOrRedirect(await currentUser());
  const id = value(formData, "id") || nanoid(8);
  const name = value(formData, "name");
  const icon = value(formData, "icon") || "🧰";
  const path = value(formData, "path");
  const description = value(formData, "description");
  const tutorialIntro = value(formData, "tutorialIntro") || description;
  const tutorialContent = String(formData.get("tutorialContent") || "").trim();
  const openMode = value(formData, "openMode") === "new_tab" ? "new_tab" : "embedded";
  const visibility = value(formData, "visibility") === "admin" ? "admin" : "all";
  if (!id || !name || !path) redirect("/admin/tools?error=tool");
  const now = new Date().toISOString();
  db().prepare(`INSERT OR REPLACE INTO tools (id, name, icon, path, description, tutorial_intro, tutorial_content, open_mode, visibility, sort_order, enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT sort_order FROM tools WHERE id = ?), 100), COALESCE((SELECT enabled FROM tools WHERE id = ?), 1), COALESCE((SELECT created_at FROM tools WHERE id = ?), ?), ?)`)
    .run(id, name, icon, path, description, tutorialIntro, tutorialContent, openMode, visibility, id, id, id, now, now);
  ensureToolSpaceForAllUsers(id);
  createAudit(actor.id, "upsert_tool", id);
  redirect("/admin/tools");
}

export async function updateToolAction(formData: FormData) {
  const actor = adminOrRedirect(await currentUser());
  const id = value(formData, "id");
  const name = value(formData, "name");
  const icon = value(formData, "icon") || "🧰";
  const path = value(formData, "path");
  const description = value(formData, "description");
  const tutorialIntro = value(formData, "tutorialIntro") || description;
  const tutorialContent = String(formData.get("tutorialContent") || "").trim();
  const openMode = value(formData, "openMode") === "new_tab" ? "new_tab" : "embedded";
  const visibility = value(formData, "visibility") === "admin" ? "admin" : "all";
  if (!id || !name || !path) redirect("/admin/tools?error=tool");
  db().prepare("UPDATE tools SET name = ?, icon = ?, path = ?, description = ?, tutorial_intro = ?, tutorial_content = ?, open_mode = ?, visibility = ?, updated_at = ? WHERE id = ?")
    .run(name, icon, path, description, tutorialIntro, tutorialContent, openMode, visibility, new Date().toISOString(), id);
  createAudit(actor.id, "update_tool", id);
  redirect("/admin/tools");
}

export async function toggleToolAction(formData: FormData) {
  const actor = adminOrRedirect(await currentUser());
  const id = value(formData, "id");
  const row = db().prepare("SELECT enabled FROM tools WHERE id = ?").get(id) as { enabled: number } | undefined;
  if (row) {
    const nextEnabled = row.enabled ? 0 : 1;
    db().prepare("UPDATE tools SET enabled = ?, updated_at = ? WHERE id = ?").run(nextEnabled, new Date().toISOString(), id);
    if (nextEnabled) ensureToolSpaceForAllUsers(id);
  }
  createAudit(actor.id, "toggle_tool", id);
  redirect("/admin/tools");
}

export async function reorderToolAction(formData: FormData) {
  const actor = adminOrRedirect(await currentUser());
  const id = value(formData, "id");
  const direction = value(formData, "direction") === "down" ? 10 : -10;
  db().prepare("UPDATE tools SET sort_order = sort_order + ?, updated_at = ? WHERE id = ?").run(direction, new Date().toISOString(), id);
  createAudit(actor.id, "reorder_tool", id);
  redirect("/admin/tools");
}


export async function createAnnouncementAction(formData: FormData) {
  const actor = adminOrRedirect(await currentUser());
  const title = value(formData, "title");
  const content = String(formData.get("content") || "").trim();
  const levelValue = value(formData, "level");
  const level = ["info", "success", "warning", "danger"].includes(levelValue) ? levelValue : "info";
  if (!title || !content) redirect("/admin/announcements?error=announcement");
  const now = new Date().toISOString();
  const id = nanoid();
  db().prepare("INSERT INTO announcements (id, title, content, level, enabled, created_at, updated_at, published_at, pinned) VALUES (?, ?, ?, ?, 1, ?, ?, ?, 0)")
    .run(id, title, content, level, now, now, now);
  createAudit(actor.id, "create_announcement", id);
  redirect("/admin/announcements");
}

export async function updateAnnouncementAction(formData: FormData) {
  const actor = adminOrRedirect(await currentUser());
  const id = value(formData, "id");
  const title = value(formData, "title");
  const content = String(formData.get("content") || "").trim();
  const levelValue = value(formData, "level");
  const level = ["info", "success", "warning", "danger"].includes(levelValue) ? levelValue : "info";
  if (!id || !title || !content) redirect("/admin/announcements?error=announcement");
  db().prepare("UPDATE announcements SET title = ?, content = ?, level = ?, updated_at = ? WHERE id = ?")
    .run(title, content, level, new Date().toISOString(), id);
  createAudit(actor.id, "update_announcement", id);
  redirect("/admin/announcements");
}

export async function toggleAnnouncementAction(formData: FormData) {
  const actor = adminOrRedirect(await currentUser());
  const id = value(formData, "id");
  const row = db().prepare("SELECT enabled FROM announcements WHERE id = ?").get(id) as { enabled: number } | undefined;
  if (row) db().prepare("UPDATE announcements SET enabled = ?, updated_at = ? WHERE id = ?").run(row.enabled ? 0 : 1, new Date().toISOString(), id);
  createAudit(actor.id, "toggle_announcement", id);
  redirect("/admin/announcements");
}

export async function deleteAnnouncementAction(formData: FormData) {
  const actor = adminOrRedirect(await currentUser());
  const id = value(formData, "id");
  db().prepare("DELETE FROM announcement_reads WHERE announcement_id = ?").run(id);
  db().prepare("DELETE FROM announcements WHERE id = ?").run(id);
  createAudit(actor.id, "delete_announcement", id);
  redirect("/admin/announcements");
}
