import { useEffect, useState, type FormEvent } from 'react'
import { teamApi, type Role, type TeamUser } from './api'
import { useStore } from '../store'
import SettingsModal from '../components/SettingsModal'

export default function AdminApp({ user, siteName, onLogout }: { user: TeamUser; siteName: string; onLogout: () => Promise<void> }) {
  const [users, setUsers] = useState<TeamUser[]>([])
  const [dashboard, setDashboard] = useState<{ totalUsers: number; totalCalls: number; errors: number } | null>(null)
  const [logs, setLogs] = useState<unknown[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [userRecords, setUserRecords] = useState<{ tasks: unknown[] } | null>(null)
  const [error, setError] = useState('')
  const setShowSettings = useStore((s) => s.setShowSettings)
  const settingsOnlyMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('settings') === '1'
  useEffect(() => { if (settingsOnlyMode) setShowSettings(true, 'api') }, [settingsOnlyMode, setShowSettings])

  const refresh = async () => {
    const [usersResult, dashboardResult, logsResult] = await Promise.all([teamApi.listUsers(), teamApi.dashboard(), teamApi.logs()])
    setUsers(usersResult.users)
    setDashboard(dashboardResult)
    setLogs(logsResult.logs)
  }

  useEffect(() => { void refresh().catch((err) => setError(err instanceof Error ? err.message : '加载失败')) }, [])

  const loadUserRecords = async (userId: string) => {
    setSelectedUserId(userId)
    if (!userId) { setUserRecords(null); return }
    const tasksResult = await teamApi.adminUserTasks(userId)
    setUserRecords({ tasks: tasksResult.tasks })
  }

  if (settingsOnlyMode) return <SettingsModal />

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <header className="border-b bg-white dark:bg-gray-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div><div className="text-xl font-bold text-brand-primary">{siteName}</div><div className="text-xs text-gray-500">管理端 · {user.username}</div></div>
          <div className="flex items-center gap-3"><a className="text-sm text-brand-primary hover:underline" href="/">用户端</a><button className="rounded-lg border px-3 py-2 text-sm" onClick={onLogout}>登出</button></div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
        <section className="grid gap-4 md:grid-cols-3">
          <Metric label="用户数" value={dashboard?.totalUsers ?? '-'} />
          <Metric label="调用数" value={dashboard?.totalCalls ?? '-'} />
          <Metric label="错误数" value={dashboard?.errors ?? '-'} />
        </section>
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-gray-900"><h2 className="text-lg font-semibold">用户管理</h2><CreateUserForm onCreated={refresh} /><UserTable users={users} currentUserId={user.id} onChanged={refresh} /></div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-gray-900"><h2 className="text-lg font-semibold">调用日志</h2><pre className="mt-4 max-h-[520px] overflow-auto rounded-xl bg-gray-950 p-4 text-xs text-gray-100">{JSON.stringify(logs.slice(0, 20), null, 2)}</pre></div>
        </section>
        <section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-gray-900">
          <h2 className="text-lg font-semibold">用户记录查看</h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <select className="rounded-xl border px-3 py-2" value={selectedUserId} onChange={(event) => { void loadUserRecords(event.target.value) }}>
              <option value="">选择用户</option>
              {users.map((item) => <option key={item.id} value={item.id}>{item.username}</option>)}
            </select>
            {userRecords && <div className="text-sm text-gray-500">生图 {userRecords.tasks.length} 条</div>}
          </div>
          {userRecords && <UserRecords userId={selectedUserId} records={userRecords} />}
        </section>
        <section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-gray-900">
          <h2 className="text-lg font-semibold">全局使用设置</h2>
          <p className="mt-1 text-sm text-gray-500">这里复用原项目完整设置面板。管理员配置 API 和使用习惯后，用户端统一使用服务端配置。</p>
          <button className="mt-4 rounded-xl bg-brand-primary px-4 py-2 text-white" onClick={() => setShowSettings(true)}>打开完整设置</button>
        </section>
      </main>
      <SettingsModal />
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-gray-900"><div className="text-sm text-gray-500">{label}</div><div className="mt-2 text-3xl font-bold">{value}</div></div>
}

function CreateUserForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('user')
  const [error, setError] = useState('')
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('')
    try { await teamApi.createUser({ username, password, role }); setUsername(''); setPassword(''); await onCreated() }
    catch (err) { setError(err instanceof Error ? err.message : '创建失败') }
  }
  return <form className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_120px_100px]" onSubmit={submit}><input className="rounded-xl border px-3 py-2" placeholder="用户名" value={username} onChange={(event) => setUsername(event.target.value)} /><input className="rounded-xl border px-3 py-2" placeholder="密码（至少8位）" value={password} onChange={(event) => setPassword(event.target.value)} /><select className="rounded-xl border px-3 py-2" value={role} onChange={(event) => setRole(event.target.value as Role)}><option value="user">用户</option><option value="admin">管理员</option></select><button className="rounded-xl bg-brand-primary px-3 py-2 text-white">创建</button>{error && <div className="md:col-span-4 text-sm text-red-600">{error}</div>}</form>
}

function UserTable({ users, currentUserId, onChanged }: { users: TeamUser[]; currentUserId: string; onChanged: () => Promise<void> }) {
  const [message, setMessage] = useState('')
  return <div className="mt-5 overflow-auto"><table className="w-full text-sm"><thead className="text-left text-gray-500"><tr><th className="py-2">用户名</th><th>角色</th><th>状态</th><th>最近活跃</th><th>操作</th></tr></thead><tbody>{users.map((item) => <tr className="border-t" key={item.id}><td className="py-3 font-medium">{item.username}</td><td>{item.role}</td><td>{item.status}</td><td>{item.lastActiveAt || '-'}</td><td className="space-x-3"><button className="text-brand-primary disabled:text-gray-400" disabled={item.id === currentUserId} onClick={async () => { await teamApi.updateUser(item.id, { status: item.status === 'active' ? 'disabled' : 'active' }); await onChanged() }}>{item.status === 'active' ? '禁用' : '启用'}</button><button className="text-red-600 disabled:text-gray-400" disabled={item.id === currentUserId} onClick={async () => { if (!window.confirm(`确定删除用户 ${item.username}？该用户账号、独立数据库和文件都会删除。`)) return; await teamApi.deleteUser(item.id); setMessage(`已删除 ${item.username}`); await onChanged() }}>删除</button></td></tr>)}</tbody></table>{message && <div className="mt-3 text-sm text-gray-500">{message}</div>}</div>
}


function UserRecords({ userId, records }: { userId: string; records: { tasks: unknown[] } }) {
  const tasks = records.tasks as Array<{ id: string; status?: string; prompt?: string; created_at?: string; images?: Array<{ id: string; mime?: string }> }>
  return (
    <div className="mt-4 rounded-xl border p-4">
      <h3 className="font-semibold">生图记录</h3>
      <div className="mt-3 space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="rounded-xl bg-gray-50 p-3 dark:bg-gray-950">
            <div className="text-sm font-medium">{task.prompt || '(未记录提示词)'}</div>
            <div className="mt-1 text-xs text-gray-500">{task.status} · {task.created_at}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(task.images || []).map((image) => (
                <a key={image.id} href={`/admin/users/${userId}/files/${image.id}`} target="_blank" rel="noreferrer">
                  <img src={`/admin/users/${userId}/files/${image.id}`} className="h-24 w-24 rounded-lg object-cover" />
                </a>
              ))}
            </div>
          </div>
        ))}
        {tasks.length === 0 && <div className="text-sm text-gray-500">暂无生图记录</div>}
      </div>
    </div>
  )
}
