export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { changePasswordAction } from "@/lib/actions";
import { currentUser } from "@/lib/auth";
import { AppShell } from "@/lib/layout";
import { PasswordField, SubmitButton } from "@/components/client-controls";

export default async function Password({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  return <AppShell user={user} title="修改密码"><section className="max-w-lg rounded-3xl border bg-card p-6"><h1 className="mb-5 text-2xl font-semibold">修改密码</h1><form action={changePasswordAction} className="space-y-4"><label className="block text-sm">当前密码<div className="mt-2"><PasswordField name="currentPassword"/></div></label><label className="block text-sm">新密码<div className="mt-2"><PasswordField name="newPassword"/></div></label><SubmitButton>保存</SubmitButton>{params.error && <p className="text-sm text-destructive">{params.error === "current" ? "当前密码不正确" : "密码至少 8 位"}</p>}{params.ok && <p className="text-sm text-muted-foreground">密码已更新</p>}</form></section></AppShell>;
}
