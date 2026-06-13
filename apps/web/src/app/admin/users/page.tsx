export const dynamic = "force-dynamic";

import { AdminPageShell } from "@/lib/admin-page";
import { listUsers } from "@/lib/data";
import { createUserAction, resetPasswordAction, toggleUserDisabledAction, updateUserAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const users = listUsers();
  const errorText = errorMessage(params.error);

  return (
    <AdminPageShell title="用户管理">
      {errorText ? <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{errorText}</div> : null}

      <form action={createUserAction} className="mb-6 grid gap-3 rounded-2xl border bg-background/60 p-4 md:grid-cols-5">
        <input className="rounded-xl border bg-background px-3 py-2" name="username" placeholder="用户名" required />
        <input className="rounded-xl border bg-background px-3 py-2" name="displayName" placeholder="显示名" />
        <input className="rounded-xl border bg-background px-3 py-2" name="password" type="password" placeholder="初始密码" minLength={8} required />
        <select className="rounded-xl border bg-background px-3 py-2" name="role" defaultValue="user">
          <option value="user">成员</option>
          <option value="admin">管理员</option>
        </select>
        <div className="flex gap-2">
          <Button type="submit">创建用户</Button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="p-3">用户</th>
              <th>角色</th>
              <th>状态</th>
              <th>最近登录</th>
              <th className="min-w-96">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b align-top">
                <td className="p-3">
                  <div className="font-medium">{user.display_name || user.username}</div>
                  <div className="text-xs text-muted-foreground">{user.username}</div>
                </td>
                <td>{user.role === "admin" ? "管理员" : "成员"}</td>
                <td>
                  <Badge variant={user.disabled ? "secondary" : "default"}>{user.disabled ? "已停用" : "启用"}</Badge>
                  {user.must_change_password ? <Badge className="ml-2" variant="outline">需改密</Badge> : null}
                </td>
                <td className="text-muted-foreground">{user.last_login_at || "-"}</td>
                <td className="space-y-3 py-2">
                  <form action={updateUserAction} className="flex flex-wrap gap-2">
                    <input type="hidden" name="id" value={user.id} />
                    <input className="min-w-40 rounded-lg border bg-background px-2 py-1" name="displayName" defaultValue={user.display_name || user.username} />
                    <select className="rounded-lg border bg-background px-2 py-1" name="role" defaultValue={user.role}>
                      <option value="user">成员</option>
                      <option value="admin">管理员</option>
                    </select>
                    <Button size="sm" variant="outline" type="submit">保存</Button>
                  </form>
                  <div className="flex flex-wrap gap-2">
                    <form action={toggleUserDisabledAction}>
                      <input type="hidden" name="id" value={user.id} />
                      <Button size="sm" variant="outline" type="submit">{user.disabled ? "启用" : "停用"}</Button>
                    </form>
                    <form action={resetPasswordAction} className="flex gap-2">
                      <input type="hidden" name="id" value={user.id} />
                      <input className="w-36 rounded-lg border bg-background px-2 py-1" name="password" type="password" placeholder="新密码" minLength={8} required />
                      <Button size="sm" variant="outline" type="submit">重置密码</Button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminPageShell>
  );
}

function errorMessage(error?: string) {
  if (error === "duplicate") return "用户名已存在。";
  if (error === "password") return "密码至少 8 位。";
  if (error === "user") return "请填写用户名并设置至少 8 位密码。";
  return "";
}
