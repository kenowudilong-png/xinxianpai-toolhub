export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { changePasswordAction } from "@/lib/actions";
import { currentUser } from "@/lib/auth";
import { AppShell } from "@/lib/layout";
import { PasswordInput, SubmitButton } from "@/components/ClientControls";

export default async function PasswordPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return <AppShell user={user} title="修改密码"><section className="page-card" style={{ maxWidth: 520 }}><h1>修改密码</h1><form action={changePasswordAction}><label>新密码<PasswordInput name="newPassword" /></label><SubmitButton>保存</SubmitButton></form></section></AppShell>;
}
