export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { brand } from "@/lib/brand";
import { isInitialized } from "@/lib/auth";
import { setupAction } from "@/lib/actions";
import { PasswordInput, SubmitButton } from "@/components/ClientControls";

export default function SetupPage() {
  if (isInitialized()) redirect("/login");
  return <main className="login-page"><section className="login-card">
    <img className="login-logo" src={brand.logo} alt={brand.name} />
    <h1>初始化工具站</h1><p className="muted">创建第一个管理员账号，完成后入口会关闭。</p>
    <form action={setupAction} style={{ textAlign: "left", marginTop: 22 }}>
      <label>管理员用户名<input className="input" name="username" required /></label>
      <label>管理员密码<PasswordInput /></label>
      <SubmitButton>创建管理员</SubmitButton>
    </form>
  </section></main>;
}
