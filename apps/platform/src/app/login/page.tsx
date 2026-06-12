export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { brand } from "@/lib/brand";
import { currentUser, isInitialized } from "@/lib/auth";
import { loginAction } from "@/lib/actions";
import { PasswordInput, SubmitButton } from "@/components/ClientControls";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!isInitialized()) redirect("/setup");
  const user = await currentUser();
  if (user) redirect(user.role === "admin" ? "/admin/users" : "/");
  const params = await searchParams;
  return <main className="login-page"><section className="login-card">
    <img className="login-logo" src={brand.logo} alt={brand.name} />
    <h1>芯鲜派工具站</h1><p className="muted">统一入口 · 统一密钥 · 统一数据边界</p>
    <form action={loginAction} style={{ textAlign: "left", marginTop: 22 }}>
      <label>用户名<input className="input" name="username" autoComplete="username" required /></label>
      <label>密码<PasswordInput /></label>
      <label className="check-row"><input name="rememberMe" type="checkbox" />记住我</label>
      <SubmitButton>登录</SubmitButton>
      {params.error ? <div className="error">账号或密码错误</div> : null}
    </form>
  </section></main>;
}
