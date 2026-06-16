"use client"
import { useMemo, useState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bell, Check, ChevronDown, ChevronLeft, ChevronsLeft, ChevronsRight, ChevronUp, Eye, EyeOff, ExternalLink, Home, KeyRound, Loader2, RefreshCw, Search, Settings, User, Wrench, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { AnnouncementForUser, ToolRow } from "@/lib/data"

export function Sidebar({ tools, isAdmin }: { tools: ToolRow[]; isAdmin: boolean }) { const pathname = usePathname(); const [collapsed, setCollapsed] = useState(false); return <aside className={`${collapsed ? "w-16" : "w-64"} flex flex-col gap-2 border-r bg-card/80 p-3 backdrop-blur transition-all`}><Link className={navCls(pathname === "/")} href="/"><Home className="size-4"/><span className={collapsed ? "hidden" : ""}>首页</span></Link>{tools.map(t=><Link key={t.id} className={navCls(pathname.startsWith(t.path))} href={t.path}><span>{t.icon}</span><span className={collapsed ? "hidden" : ""}>{t.name}</span></Link>)}<div className="my-2 border-t" />{isAdmin && <Link className={navCls(pathname.startsWith("/admin"))} href="/admin/users"><Settings className="size-4"/><span className={collapsed ? "hidden" : ""}>管理</span></Link>}<button className={navCls(false)+" mt-auto"} onClick={()=>setCollapsed(!collapsed)} type="button">{collapsed ? <ChevronsRight className="size-4"/> : <ChevronsLeft className="size-4"/>}<span className={collapsed ? "hidden" : ""}>收起</span></button></aside> }
function navCls(active:boolean){return `flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${active?"bg-primary text-primary-foreground":"hover:bg-accent"}`}
export function TopUserMenu({ name, isAdmin, logoutAction }: { name:string; isAdmin:boolean; logoutAction:()=>void }) { const [open,setOpen]=useState(false); return <div className="relative"><Button variant="outline" onClick={()=>setOpen(!open)}><User className="size-4"/> {name} ▾</Button>{open&&<div className="absolute right-0 top-11 z-50 w-48 rounded-2xl border bg-popover p-2 shadow-xl"><div className="px-3 py-2 text-sm font-semibold">👤 {name}</div>{isAdmin&&<div className="px-3 py-1 text-xs text-primary">管理员</div>}<a className="block rounded-xl px-3 py-2 text-sm hover:bg-accent" href="/settings/profile">个人设置</a><a className="block rounded-xl px-3 py-2 text-sm hover:bg-accent" href="/settings/password">修改密码</a><form action={logoutAction}><button className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-accent">退出登录</button></form></div>}</div> }
export function PasswordField({ name="password" }: { name?:string }) { const [show,setShow]=useState(false); return <div className="relative"><input className="w-full rounded-xl border bg-background px-3 py-2 pr-10" name={name} type={show?"text":"password"} required/><button className="absolute right-2 top-2 rounded-md p-1" type="button" onClick={()=>setShow(!show)}>{show?<EyeOff className="size-4"/>:<Eye className="size-4"/>}</button></div> }
export function SubmitButton({children}:{children:React.ReactNode}){const { pending } = useFormStatus();return <Button type="submit" disabled={pending}>{pending&&<Loader2 className="size-4 animate-spin"/>}{children}</Button>}
export function ToolGrid({tools}:{tools:ToolRow[]}){const [q,setQ]=useState("");const [active,setActive]=useState<ToolRow|null>(null);const rows=useMemo(()=>tools.filter(t=>(t.name+t.description+t.tutorial_intro).toLowerCase().includes(q.toLowerCase())),[q,tools]);return <><div className="mb-6 flex items-center justify-between gap-4"><h1 className="text-2xl font-semibold">产品教学</h1><label className="flex w-72 items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm text-muted-foreground"><Search className="size-4"/><input className="w-full bg-transparent outline-none" value={q} onChange={e=>setQ(e.target.value)} placeholder="搜索工具..."/></label></div>{rows.length?<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{rows.map(t=><Card key={t.id} className="rounded-3xl"><CardContent className="p-6 text-center"><div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-accent text-4xl">{t.icon}</div><h2 className="text-lg font-semibold">{t.name}</h2><p className="mt-2 min-h-10 text-sm text-muted-foreground">{t.description}</p><Button className="mt-5" variant="outline" onClick={()=>setActive(t)}>详情</Button></CardContent></Card>)}</div>:<div className="grid min-h-72 place-items-center rounded-3xl border border-dashed bg-card text-muted-foreground">暂无可用工具，请联系管理员。</div>}{active&&<ToolTutorialDialog tool={active} onClose={()=>setActive(null)}/>}</>}
function ToolTutorialDialog({tool,onClose}:{tool:ToolRow;onClose:()=>void}){const lines=(tool.tutorial_content||defaultTutorial(tool)).split("\n").filter(Boolean);return <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/25 px-4 pt-[18vh]"><div role="dialog" aria-modal="true" aria-label={`${tool.name} · 使用教程`} className="w-full max-w-2xl rounded-3xl border bg-background p-6 shadow-2xl"><div className="mb-4 flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold">{tool.name} · 使用教程</h2><p className="mt-2 text-sm text-muted-foreground"><span className="mr-2 text-2xl">{tool.icon}</span>一句话简介：{tool.tutorial_intro||tool.description}</p></div><button className="rounded-full p-2 hover:bg-accent" onClick={onClose} aria-label="关闭"><X className="size-5"/></button></div><div className="space-y-2 border-y py-4 text-sm leading-7">{lines.map((line,index)=><p key={index} className={line.startsWith("📖")||line.startsWith("🚀")||line.startsWith("💡")?"font-semibold":"text-muted-foreground"}>{line}</p>)}</div><div className="mt-5 flex justify-end"><Button asChild onClick={onClose}><a href={tool.path}>跳转使用 →</a></Button></div></div></div>}
function defaultTutorial(tool:ToolRow){return `📖 能做什么\n· ${tool.description||"使用这个工具完成对应工作"}\n🚀 怎么用(分步)\n1. 点击右下角跳转使用\n2. 按页面提示输入内容\n💡 小技巧 / 注意\n· 如无法使用，请联系管理员确认工具配置`}
export function ToolToolbar({path}:{path:string}){const r=useRouter();return <div className="flex gap-2"><Button variant="outline" onClick={()=>r.refresh()}><RefreshCw className="size-4"/>刷新</Button><Button variant="outline" asChild><a href={path} target="_blank"><ExternalLink className="size-4"/>新标签</a></Button><Button variant="outline" asChild><Link href="/"><ChevronLeft className="size-4"/>返回</Link></Button></div>}
export function HeaderIcons({announcements: initialAnnouncements=[], unreadCount: initialUnreadCount=0}:{announcements?:AnnouncementForUser[];unreadCount?:number}){return <><Button variant="outline" size="icon" aria-label="搜索"><Search className="size-4"/></Button><AnnouncementDialog initialAnnouncements={initialAnnouncements} initialUnreadCount={initialUnreadCount}/></>}

type AnnouncementPayload={announcements:AnnouncementForUser[];unreadCount:number}

function AnnouncementDialog({initialAnnouncements,initialUnreadCount}:{initialAnnouncements:AnnouncementForUser[];initialUnreadCount:number}){
  const [open,setOpen]=useState(false)
  const [announcements,setAnnouncements]=useState(initialAnnouncements)
  const [unreadCount,setUnreadCount]=useState(initialUnreadCount)
  const [expanded,setExpanded]=useState<Record<string,boolean>>({})
  const [expandedGroups,setExpandedGroups]=useState<Record<string,boolean>>({})
  const [pending,setPending]=useState<string|null>(null)
  const latest=announcements[0]
  const history=announcements.slice(1)
  const groups=useMemo(()=>groupAnnouncementsByMonth(history),[history])
  const unreadLabel=unreadCount>0?`通知公告，${unreadCount} 条未读`:"通知公告，无未读"

  async function applyResponse(response:Response){
    if(!response.ok) return
    const payload=await response.json() as AnnouncementPayload
    setAnnouncements(payload.announcements)
    setUnreadCount(payload.unreadCount)
  }
  async function refresh(){
    await applyResponse(await fetch("/api/announcements",{cache:"no-store"}))
  }
  async function markRead(id:string){
    setPending(id)
    try{
      setAnnouncements(items=>items.map(item=>item.id===id?{...item,isRead:true,readAt:item.readAt||new Date().toISOString()}:item))
      setUnreadCount(count=>Math.max(0,count-1))
      await applyResponse(await fetch(`/api/announcements/${id}/read`,{method:"POST"}))
    }finally{setPending(null)}
  }
  async function markAllRead(){
    setPending("all")
    try{
      setAnnouncements(items=>items.map(item=>({...item,isRead:true,readAt:item.readAt||new Date().toISOString()})))
      setUnreadCount(0)
      await applyResponse(await fetch("/api/announcements/read-all",{method:"POST"}))
    }finally{setPending(null)}
  }

  return <Dialog open={open} onOpenChange={(next)=>{setOpen(next);if(next) void refresh()}}>
    <div className="relative">
      <Button variant="outline" size="icon" aria-label={unreadLabel} onClick={()=>setOpen(true)}>
        <Bell className="size-4"/>
      </Button>
      {unreadCount>0&&<span aria-label={`${unreadCount} 条未读公告`} className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-[#40AF36] px-1.5 text-[10px] font-semibold leading-5 text-white shadow-sm">{Math.min(unreadCount,99)}</span>}
    </div>
    <DialogContent className="flex max-h-[78vh] max-w-2xl flex-col overflow-hidden rounded-3xl p-0 shadow-xl sm:w-[min(680px,92vw)]">
      <DialogHeader className="border-b px-6 py-5">
        <div className="flex items-start justify-between gap-4 pr-8">
          <div>
            <DialogTitle className="text-xl">通知公告</DialogTitle>
            <DialogDescription className="mt-1">{unreadCount>0?`${unreadCount} 条未读公告`:"所有公告均已读"}</DialogDescription>
          </div>
          {announcements.length>0&&<Button type="button" size="sm" onClick={markAllRead} disabled={pending==="all"||unreadCount===0} className="bg-[#40AF36] text-white hover:bg-[#35962d]"><Check className="size-4"/>全部标为已读</Button>}
        </div>
      </DialogHeader>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {!announcements.length&&<div className="grid min-h-56 place-items-center rounded-2xl border border-dashed text-center text-sm text-muted-foreground">暂无公告，管理员发布后会显示在这里。</div>}
        {latest&&<article className="rounded-3xl border border-[#40AF36]/25 bg-[#40AF36]/5 p-5">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#40AF36]">最新公告 · {latest.beijingTime}</p>
              <h3 className="mt-2 text-lg font-semibold">{latest.title}</h3>
            </div>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{latest.body}</p>
          <div className="mt-4 flex justify-end">
            <Button variant={latest.isRead?"outline":"default"} size="sm" disabled={latest.isRead||pending===latest.id} onClick={()=>markRead(latest.id)} className={!latest.isRead?"bg-[#40AF36] text-white hover:bg-[#35962d]":""}>{latest.isRead?"已读":"标记已读"}</Button>
          </div>
        </article>}
        {history.length>0&&<section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">历史公告</h3>
            <span className="text-xs text-muted-foreground">按北京时间倒序</span>
          </div>
          <div className="space-y-4">{groups.map(group=>{
            const groupOpen=expandedGroups[group.month]??groups.indexOf(group)===0
            const visible=groupOpen?group.items.slice(0,5):[]
            const showAll=expandedGroups[`${group.month}:all`]||false
            const rows=showAll?group.items:visible
            return <div key={group.month} className="rounded-2xl border bg-card/60">
              <button type="button" className="flex w-full items-center justify-between px-4 py-3 text-left" onClick={()=>setExpandedGroups(state=>({...state,[group.month]:!groupOpen}))}>
                <span className="font-medium">{group.month}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">{group.items.length} 条{groupOpen?<ChevronUp className="size-4"/>:<ChevronDown className="size-4"/>}</span>
              </button>
              {groupOpen&&<div className="space-y-1 border-t px-4 py-3">
                {rows.map(item=><TimelineItem key={item.id} item={item} expanded={Boolean(expanded[item.id])} pending={pending===item.id} onToggle={()=>setExpanded(state=>({...state,[item.id]:!state[item.id]}))} onRead={()=>markRead(item.id)}/>) }
                {group.items.length>5&&<Button type="button" variant="ghost" size="sm" className="ml-7 mt-2 text-[#40AF36]" onClick={()=>setExpandedGroups(state=>({...state,[`${group.month}:all`]:!showAll}))}>{showAll?"收起":"展开更多"}</Button>}
              </div>}
            </div>
          })}</div>
        </section>}
      </div>
    </DialogContent>
  </Dialog>
}

function TimelineItem({item,expanded,pending,onToggle,onRead}:{item:AnnouncementForUser;expanded:boolean;pending:boolean;onToggle:()=>void;onRead:()=>void}){return <div className="relative border-l border-[#40AF36]/25 pl-5 before:absolute before:-left-[5px] before:top-3 before:size-2.5 before:rounded-full before:bg-[#40AF36]">
  <button type="button" className="flex w-full items-start justify-between gap-3 rounded-xl px-2 py-2 text-left hover:bg-accent" onClick={onToggle} aria-expanded={expanded}>
    <div>
      <p className="text-xs text-muted-foreground">{item.beijingTime}</p>
      <p className="mt-1 font-medium">{item.title}</p>
    </div>
    <span className="flex shrink-0 items-center gap-1 text-xs text-[#40AF36]">{expanded?"收起原文":"查看原文"}{expanded?<ChevronUp className="size-3.5"/>:<ChevronDown className="size-3.5"/>}</span>
  </button>
  {expanded&&<div className="mb-3 ml-2 rounded-2xl border border-[#40AF36]/15 bg-[#40AF36]/5 p-4 text-sm leading-7 text-foreground">
    <p className="mb-2 text-xs font-medium text-[#40AF36]">公告原文</p>
    <p className="whitespace-pre-wrap">{item.body}</p>
    <div className="mt-3 flex justify-end"><Button size="sm" variant="outline" disabled={item.isRead||pending} onClick={onRead}>{item.isRead?"已读":"标记已读"}</Button></div>
  </div>}
</div>}

function groupAnnouncementsByMonth(items:AnnouncementForUser[]){
  const map=new Map<string,AnnouncementForUser[]>()
  for(const item of items){
    const month=item.beijingTime.slice(0,7)
    map.set(month,[...(map.get(month)||[]),item])
  }
  return Array.from(map.entries()).map(([month,groupItems])=>({month,items:groupItems}))
}

export function RandomPasswordButton(){function fill(){const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#%";const p=Array.from({length:12},()=>chars[Math.floor(Math.random()*chars.length)]).join("");document.querySelectorAll<HTMLInputElement>('input[name="password"]').forEach(i=>i.value=p)}return <Button type="button" variant="outline" onClick={fill}>🔄 随机</Button>}
export function ModelFields(){const [n,setN]=useState(1);return <div className="space-y-2">{Array.from({length:n}).map((_,i)=><input key={i} className="w-full rounded-xl border bg-background px-3 py-2" name="models" placeholder="模型" defaultValue={i===0?"gpt-image-1":""}/>)}<Button type="button" variant="outline" onClick={()=>setN(n+1)}>+ 再加</Button></div>}
export { KeyRound, Wrench }
