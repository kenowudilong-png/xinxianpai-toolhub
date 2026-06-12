import { NextRequest, NextResponse } from "next/server";
import { currentUser, isInitialized } from "@/lib/auth";

const gipOrigin = process.env.GIP_INTERNAL_ORIGIN || "http://127.0.0.1:18085";
const MODE = "app" as const;

async function proxy(request: NextRequest, path: string[], mode: "api" | "app") {
  if (!isInitialized()) return NextResponse.redirect(new URL("/setup", request.url));
  const user = await currentUser();
  if (!user) return mode === "api"
    ? NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED", message: "请先登录" } }, { status: 401 })
    : NextResponse.redirect(new URL("/login", request.url));

  const suffix = path.join("/");
  const upstreamPath = mode === "api" ? `/api/${suffix}` : `/${suffix}`;
  const upstreamUrl = new URL(upstreamPath, gipOrigin);
  upstreamUrl.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  headers.set("x-xp-user-id", user.id);
  headers.set("x-xp-username", user.username);
  headers.set("x-xp-role", user.role);
  headers.set("x-xp-tool-id", "gip");
  headers.set("x-requested-with", "XMLHttpRequest");
  headers.delete("host");

  const method = request.method;
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();
  const upstream = await fetch(upstreamUrl, { method, headers, body, redirect: "manual" });
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");
  return new NextResponse(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: responseHeaders });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const params = await context.params;
  return proxy(request, params.path || [], MODE);
}
export async function POST(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const params = await context.params;
  return proxy(request, params.path || [], MODE);
}
export async function PUT(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const params = await context.params;
  return proxy(request, params.path || [], MODE);
}
export async function PATCH(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const params = await context.params;
  return proxy(request, params.path || [], MODE);
}
export async function DELETE(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const params = await context.params;
  return proxy(request, params.path || [], MODE);
}
