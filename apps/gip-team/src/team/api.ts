export type Role = 'admin' | 'user'

export type TeamUser = {
  id: string
  username: string
  role: Role
  status: 'active' | 'disabled'
  mustChangePassword: boolean
  note?: string
  createdAt?: string
  updatedAt?: string
  lastActiveAt?: string
}

export type PublicConfig = {
  api: { profiles?: Array<Record<string, unknown>>; defaultProfileId?: string }
  preferences: Record<string, unknown>
  agent: { enabled?: boolean; webSearch?: boolean; maxBatchConcurrency?: number; systemPrompt?: string }
  system: { siteName?: string }
  settings?: unknown
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } }

export const GIP_API_BASE = (import.meta.env.VITE_GIP_API_BASE || '/tools/gip/api').replace(/\/$/, '')

export function gipApiPath(path: string) {
  return `${GIP_API_BASE}${path.startsWith('/') ? path : `/${path}`}`
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type') && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (!headers.has('X-Requested-With')) headers.set('X-Requested-With', 'XMLHttpRequest')
  const response = await fetch(gipApiPath(path), { ...init, headers, credentials: 'include' })
  const payload = await response.json().catch(() => null) as ApiResult<T> | null
  if (!response.ok || !payload?.ok) {
    throw new Error(payload && !payload.ok ? payload.error.message : `HTTP ${response.status}`)
  }
  return payload.data
}

export const teamApi = {
  setupStatus: () => apiFetch<{ needsSetup: boolean }>('/setup/status', { method: 'GET' }),
  setupInit: (body: { username: string; password: string }) => apiFetch<{ user: TeamUser }>('/setup/init', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { username: string; password: string }) => apiFetch<{ user: TeamUser }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => apiFetch<{ loggedOut: boolean }>('/auth/logout', { method: 'POST' }),
  me: () => apiFetch<{ user: TeamUser; publicConfig: PublicConfig }>('/auth/me', { method: 'GET' }),
  changePassword: (body: { currentPassword: string; newPassword: string }) => apiFetch<{ changed: boolean }>('/auth/change-password', { method: 'POST', body: JSON.stringify(body) }),
  listUsers: () => apiFetch<{ users: TeamUser[] }>('/admin/users', { method: 'GET' }),
  createUser: (body: { username: string; password: string; role: Role; note?: string }) => apiFetch<{ user: TeamUser }>('/admin/users', { method: 'POST', body: JSON.stringify(body) }),
  updateUser: (id: string, body: Partial<Pick<TeamUser, 'role' | 'status' | 'note'>>) => apiFetch<{ user: TeamUser }>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteUser: (id: string) => apiFetch<{ deleted: boolean }>(`/admin/users/${id}?confirm=${encodeURIComponent(id)}`, { method: 'DELETE' }),
  publicConfig: () => apiFetch<PublicConfig>('/me/configs/public', { method: 'GET' }),
  getConfig: (key: string) => apiFetch<{ key: string; value: unknown }>(`/admin/configs/${key}`, { method: 'GET' }),
  putConfig: (key: string, value: unknown) => apiFetch<{ key: string; value: unknown }>(`/admin/configs/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }),
  putSettings: (settings: unknown) => apiFetch<{ key: string; value: unknown }>('/admin/configs/settings', { method: 'PUT', body: JSON.stringify({ value: settings }) }),
  getSettings: () => apiFetch<{ key: string; value: unknown }>('/admin/configs/settings', { method: 'GET' }),
  dashboard: () => apiFetch<{ totalUsers: number; totalCalls: number; errors: number; recentErrors: unknown[] }>('/admin/dashboard', { method: 'GET' }),
  logs: () => apiFetch<{ logs: unknown[] }>('/admin/logs', { method: 'GET' }),
  adminUserTasks: (id: string) => apiFetch<{ tasks: unknown[] }>(`/admin/users/${id}/tasks`, { method: 'GET' }),
}
