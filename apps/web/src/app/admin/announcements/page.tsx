import { AdminPageShell } from "@/lib/admin-page";
import { formatBeijingMinute, listAnnouncements } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { createAnnouncementAction, deleteAnnouncementAction, toggleAnnouncementAction, updateAnnouncementAction } from "@/lib/actions";

const levels = [
  ["info", "普通"],
  ["success", "喜报"],
  ["warning", "提醒"],
  ["danger", "重要"],
] as const;

export default async function AnnouncementsPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const announcements = listAnnouncements(true);
  const errorText = params?.error ? "请填写公告标题和内容。" : "";
  return (
    <AdminPageShell title="公告通知">
      {errorText && <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{errorText}</div>}
      <form action={createAnnouncementAction} className="mb-6 grid gap-3 rounded-2xl border bg-background/60 p-4 md:grid-cols-4">
        <input className="rounded-xl border bg-background px-3 py-2" name="title" placeholder="公告标题" required />
        <select className="rounded-xl border bg-background px-3 py-2" name="level" defaultValue="info">
          {levels.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <textarea className="min-h-24 rounded-xl border bg-background px-3 py-2 md:col-span-4" name="content" placeholder="公告内容：例如系统维护、使用说明、活动通知……" required />
        <Button className="md:col-start-4">发布公告</Button>
      </form>
      <div className="space-y-4">
        {announcements.length === 0 && <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">暂无公告。发布后，用户可通过顶部通知按钮查看。</div>}
        {announcements.map((item) => (
          <div key={item.id} className="rounded-2xl border bg-background/70 p-4">
            <form action={updateAnnouncementAction} className="grid gap-3 md:grid-cols-5">
              <input type="hidden" name="id" value={item.id} />
              <input className="rounded-xl border bg-background px-3 py-2 md:col-span-2" name="title" defaultValue={item.title} required />
              <select className="rounded-xl border bg-background px-3 py-2" name="level" defaultValue={item.level}>
                {levels.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <div className="flex items-center text-sm text-muted-foreground">{item.enabled ? "已发布" : "已停用"}</div>
              <Button variant="outline">保存</Button>
              <textarea className="min-h-24 rounded-xl border bg-background px-3 py-2 md:col-span-5" name="content" defaultValue={item.content} required />
            </form>
            <div className="mt-3 flex gap-2">
              <form action={toggleAnnouncementAction}>
                <input type="hidden" name="id" value={item.id} />
                <Button size="sm" variant="outline">{item.enabled ? "停用" : "启用"}</Button>
              </form>
              <form action={deleteAnnouncementAction}>
                <input type="hidden" name="id" value={item.id} />
                <Button size="sm" variant="destructive">删除</Button>
              </form>
              <span className="ml-auto text-xs text-muted-foreground">发布于 {formatBeijingMinute(item.published_at || item.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </AdminPageShell>
  );
}
