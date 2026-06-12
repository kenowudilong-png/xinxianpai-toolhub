"use server";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { db } from "./db";
import { createUser, currentUser, hashPassword, isInitialized, login, setSession, clearSession } from "./auth";
import { encryptSecret } from "./crypto";
import { createAudit } from "./data";

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
  const newPassword = String(formData.get("newPassword") || "");
  if (newPassword.length < 8) redirect("/settings/password?error=invalid");
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
  const id = await createUser({ username, displayName, password, role, mustChangePassword: true });
  createAudit(actor.id, "create_user", id);
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

export async function createToolAction(formData: FormData) {
  const actor = adminOrRedirect(await currentUser());
  const id = value(formData, "id") || nanoid(8);
  const name = value(formData, "name");
  const icon = value(formData, "icon") || "🧰";
  const path = value(formData, "path");
  const description = value(formData, "description");
  const openMode = value(formData, "openMode") === "new_tab" ? "new_tab" : "embedded";
  const visibility = value(formData, "visibility") === "admin" ? "admin" : "all";
  if (!id || !name || !path) redirect("/admin/tools?error=tool");
  const now = new Date().toISOString();
  db().prepare(`INSERT OR REPLACE INTO tools (id, name, icon, path, description, open_mode, visibility, sort_order, enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT sort_order FROM tools WHERE id = ?), 100), COALESCE((SELECT enabled FROM tools WHERE id = ?), 1), COALESCE((SELECT created_at FROM tools WHERE id = ?), ?), ?)`)
    .run(id, name, icon, path, description, openMode, visibility, id, id, id, now, now);
  createAudit(actor.id, "upsert_tool", id);
  redirect("/admin/tools");
}

export async function toggleToolAction(formData: FormData) {
  const actor = adminOrRedirect(await currentUser());
  const id = value(formData, "id");
  const row = db().prepare("SELECT enabled FROM tools WHERE id = ?").get(id) as { enabled: number } | undefined;
  if (row) db().prepare("UPDATE tools SET enabled = ?, updated_at = ? WHERE id = ?").run(row.enabled ? 0 : 1, new Date().toISOString(), id);
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
