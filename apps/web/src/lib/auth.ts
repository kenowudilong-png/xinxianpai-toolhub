import "server-only";
import { cookies } from "next/headers";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { nanoid } from "nanoid";
import { db } from "./db";
import { env } from "./env";
import type { UserRole } from "@xinxianpai/shared";
import { ensureUserToolSpaces } from "./tool-data";

export type SessionUser = { id: string; username: string; displayName: string; role: UserRole; mustChangePassword: boolean };
const cookieName = "xxp_session";

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 64).toString("base64url");
  return `scrypt$${salt}$${hash}`;
}

export async function verifyPassword(stored: string, password: string) {
  const [scheme, salt, expected] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !expected) return false;
  const actual = scryptSync(password, salt, 64).toString("base64url");
  const left = Buffer.from(actual);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function isInitialized() {
  const row = db().prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  return row.count > 0;
}

export async function createUser(input: { username: string; displayName?: string; password: string; role: UserRole; mustChangePassword?: boolean }) {
  const id = nanoid();
  const now = new Date().toISOString();
  db().prepare(`INSERT INTO users (id, username, display_name, password_hash, role, must_change_password, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(id, input.username, input.displayName || input.username, await hashPassword(input.password), input.role, input.mustChangePassword ? 1 : 0, now);
  ensureUserToolSpaces(id);
  return id;
}

export async function login(username: string, password: string) {
  const user = db().prepare("SELECT * FROM users WHERE username = ? AND disabled = 0").get(username) as any;
  if (!user || !(await verifyPassword(user.password_hash, password))) return null;
  db().prepare("UPDATE users SET last_login_at = ? WHERE id = ?").run(new Date().toISOString(), user.id);
  return { id: user.id, username: user.username, displayName: user.display_name || user.username, role: user.role, mustChangePassword: Boolean(user.must_change_password) } as SessionUser;
}

export async function setSession(user: SessionUser, rememberMe = false) {
  const maxAgeMs = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000;
  const expires = Date.now() + maxAgeMs;
  const body = Buffer.from(JSON.stringify({ ...user, expires })).toString("base64url");
  const sig = sign(body);
  (await cookies()).set(cookieName, `${body}.${sig}`, { httpOnly: true, sameSite: "lax", path: "/", expires: new Date(expires) });
}

export async function clearSession() { (await cookies()).delete(cookieName); }

export async function currentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig || !safeEqual(sign(body), sig)) return null;
  const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (!parsed.expires || parsed.expires < Date.now()) return null;
  const row = db().prepare("SELECT id, username, display_name, role, must_change_password, disabled FROM users WHERE id = ?").get(parsed.id) as any;
  if (!row || row.disabled) return null;
  return { id: row.id, username: row.username, displayName: row.display_name || row.username, role: row.role, mustChangePassword: Boolean(row.must_change_password) };
}

export async function requireAdmin() {
  const user = await currentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

function sign(body: string) { return createHmac("sha256", env.jwtSecret).update(body).digest("base64url"); }
function safeEqual(left: string, right: string) {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
