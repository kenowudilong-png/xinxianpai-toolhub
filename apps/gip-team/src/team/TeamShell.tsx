import { createContext, useContext, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import type { AppSettings } from '../types'
import { useStore } from '../store'
import { teamApi, type PublicConfig, type TeamUser } from './api'
import AdminApp from './AdminApp'

type TeamShellContextValue = { user: TeamUser; logout: () => Promise<void> } | null

const TeamShellContext = createContext<TeamShellContextValue>(null)

export function useTeamShell() {
  return useContext(TeamShellContext)
}

type AuthState =
  | { status: 'loading' }
  | { status: 'setup' }
  | { status: 'login' }
  | { status: 'ready'; user: TeamUser; publicConfig: PublicConfig }

export default function TeamShell({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })
  const setSettings = useStore((store) => store.setSettings)
  const [error, setError] = useState('')

  const refresh = async () => {
    setError('')
    try {
      const me = await teamApi.me()
      if (me.publicConfig.settings) setSettings(me.publicConfig.settings as AppSettings)
      setState({ status: 'ready', user: me.user, publicConfig: me.publicConfig })
    } catch {
      const setup = await teamApi.setupStatus()
      setState({ status: setup.needsSetup ? 'setup' : 'login' })
    }
  }

  useEffect(() => {
    void refresh().catch((err) => {
      setError(err instanceof Error ? err.message : '初始化失败')
      setState({ status: 'login' })
    })
  }, [])

  const siteName = useMemo(() => state.status === 'ready' ? state.publicConfig.system.siteName || '芯鲜派图像工作台' : '芯鲜派图像工作台', [state])

  if (state.status === 'loading') return <FullPage title="正在加载" subtitle="正在连接团队工作台…" />
  if (state.status === 'setup') return <SetupPage error={error} onError={setError} onDone={refresh} />
  if (state.status === 'login') return <LoginPage error={error} onError={setError} onDone={refresh} />


  const logout = async () => {
    await teamApi.logout()
    setState({ status: 'login' })
  }

  if (state.user.role === 'admin' && (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/tools/gip/app/admin'))) {
    return <AdminApp user={state.user} siteName={siteName} onLogout={logout} />
  }

  return <TeamShellContext.Provider value={{ user: state.user, logout }}><div data-team-role={state.user.role}>{children}</div></TeamShellContext.Provider>
}


function FullPage({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="min-h-screen bg-brand-soft/30 text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-brand-primary/15 bg-white p-8 shadow-xl dark:bg-gray-900">
        <Brand />
        <h1 className="mt-6 text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>
    </div>
  )
}

function Brand() {
  return <div className="inline-flex items-center gap-3"><img src="/freshpi-logo.png" alt="芯鲜派" className="h-12 w-auto max-w-[220px] object-contain" /><div><div className="text-xs text-gray-500">企业内部使用</div></div></div>
}

function AuthCard({ title, subtitle, error, children }: { title: string; subtitle: string; error?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#E9F0C8,transparent_35%),linear-gradient(135deg,#fff,#f7faf5)] p-6 text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-brand-primary/15 bg-white/95 p-8 shadow-2xl dark:bg-gray-900/95">
        <Brand />
        <h1 className="mt-8 text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {children}
      </div>
    </div>
  )
}

function SetupPage({ error, onError, onDone }: { error: string; onError: (value: string) => void; onDone: () => Promise<void> }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); onError('')
    try { await teamApi.setupInit({ username, password }); await onDone() }
    catch (err) { onError(err instanceof Error ? err.message : '初始化失败') }
    finally { setLoading(false) }
  }
  return <AuthCard title="首次初始化" subtitle="创建第一个超级管理员账号，完成后该入口会关闭。" error={error}><AuthForm username={username} password={password} setUsername={setUsername} setPassword={setPassword} submitText={loading ? '创建中…' : '创建管理员'} onSubmit={submit} /></AuthCard>
}

function LoginPage({ error, onError, onDone }: { error: string; onError: (value: string) => void; onDone: () => Promise<void> }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); onError('')
    try { await teamApi.login({ username, password }); await onDone() }
    catch (err) { onError(err instanceof Error ? err.message : '登录失败') }
    finally { setLoading(false) }
  }
  return <AuthCard title="登录" subtitle="请输入管理员分配的账号密码。" error={error}><AuthForm username={username} password={password} setUsername={setUsername} setPassword={setPassword} submitText={loading ? '登录中…' : '登录'} onSubmit={submit} /></AuthCard>
}

function AuthForm({ username, password, setUsername, setPassword, submitText, onSubmit }: { username: string; password: string; setUsername: (value: string) => void; setPassword: (value: string) => void; submitText: string; onSubmit: (event: FormEvent) => void }) {
  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      <label className="block text-sm font-medium">用户名<input className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-brand-primary dark:bg-gray-950" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" /></label>
      <label className="block text-sm font-medium">密码<input className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-brand-primary dark:bg-gray-950" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label>
      <button className="w-full rounded-xl bg-brand-primary px-4 py-3 font-semibold text-white hover:bg-brand-primary/90" type="submit">{submitText}</button>
    </form>
  )
}
