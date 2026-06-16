import Image from "next/image"
import Link from "next/link"
import { brand } from "./brand"
import { logoutAction } from "./actions"
import { listAnnouncementsForUser, listTools } from "./data"
import type { SessionUser } from "./auth"
import { HeaderIcons, Sidebar, TopUserMenu } from "@/components/client-controls"
export function AppShell({user,title,children}:{user:SessionUser;title:string;children:React.ReactNode}){const tools=listTools(user.role);const announcementState=listAnnouncementsForUser(user.id);return <div className="flex min-h-screen flex-col"><header className="flex h-16 items-center gap-4 border-b bg-card/80 px-5 backdrop-blur"><Link className="flex items-center" href="/" aria-label={brand.name}><Image src={brand.logo} alt={brand.name} width={88} height={32} className="h-8 w-auto object-contain"/></Link><div className="font-medium">{title}</div><div className="ml-auto flex items-center gap-2"><HeaderIcons announcements={announcementState.announcements} unreadCount={announcementState.unreadCount}/><TopUserMenu name={user.displayName||user.username} isAdmin={user.role==="admin"} logoutAction={logoutAction}/></div></header><div className="flex flex-1"><Sidebar tools={tools} isAdmin={user.role==="admin"}/><main className="flex-1 p-6">{children}</main></div></div>}
