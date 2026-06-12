export const dynamic="force-dynamic";
import {redirect} from "next/navigation";import {currentUser,isInitialized} from "@/lib/auth";import {AppShell} from "@/lib/layout";import {listTools} from "@/lib/data";import {ToolGrid} from "@/components/client-controls";
export default async function Home(){if(!isInitialized())redirect("/setup");const user=await currentUser();if(!user)redirect("/login");return <AppShell user={user} title="首页"><ToolGrid tools={listTools(user.role)}/></AppShell>}
