import type { AgentConversation, AgentMessage, AgentRound, TaskRecord } from '../types'
import { DEFAULT_PARAMS } from '../types'
import { apiFetch, gipApiPath } from './api'

export type ServerTaskRow = {
  id: string
  created_at: string
  updated_at?: string | null
  status: 'pending' | 'running' | 'success' | 'failed' | string
  mode: string
  provider?: string | null
  model?: string | null
  prompt?: string | null
  rewritten_prompt?: string | null
  params_json?: string | null
  effective_params_json?: string | null
  duration_ms?: number | null
  error_message?: string | null
  agent_session_id?: string | null
  images?: Array<{ id: string; file_path: string; mime?: string | null; favorite?: number | null; created_at?: string }>
}

type ServerAgentSession = {
  id: string
  title?: string | null
  created_at: string
  updated_at: string
  root_branch_id: string
  rounds?: AgentRound[]
  messages?: Array<{ id: string; parent_id?: string | null; branch_id: string; role: string; content_json: string; created_at: string }>
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try { return JSON.parse(value) as T } catch { return fallback }
}

function time(value: string | null | undefined) {
  return value ? Date.parse(value) || Date.now() : Date.now()
}

function serverStatus(status: string): TaskRecord['status'] {
  if (status === 'success') return 'done'
  if (status === 'failed') return 'error'
  return 'running'
}

export function serverTaskToClient(row: ServerTaskRow): TaskRecord {
  const params = parseJson(row.params_json, DEFAULT_PARAMS)
  const actualParams = parseJson(row.effective_params_json, undefined as TaskRecord['actualParams'])
  return {
    id: row.id,
    prompt: row.prompt || '',
    params,
    apiProvider: row.provider || undefined,
    apiMode: row.mode === 'responses' ? 'responses' : 'images',
    apiModel: row.model || undefined,
    inputImageIds: [],
    outputImages: (row.images || []).map((image) => image.id),
    actualParams,
    revisedPromptByImage: row.rewritten_prompt ? Object.fromEntries((row.images || []).map((image) => [image.id, row.rewritten_prompt as string])) : undefined,
    status: serverStatus(row.status),
    error: row.error_message || null,
    createdAt: time(row.created_at),
    finishedAt: row.status === 'success' || row.status === 'failed' ? time(row.updated_at || row.created_at) : null,
    elapsed: row.duration_ms ?? null,
    isFavorite: (row.images || []).some((image) => Boolean(image.favorite)),
    sourceMode: row.agent_session_id ? 'agent' : 'gallery',
    agentConversationId: row.agent_session_id || undefined,
  }
}

export async function getServerTasks(): Promise<TaskRecord[]> {
  const result = await apiFetch<{ tasks: ServerTaskRow[] }>('/me/tasks', { method: 'GET' })
  return result.tasks.map(serverTaskToClient)
}

export async function getServerImage(id: string) {
  const response = await fetch(gipApiPath(`/me/files/${encodeURIComponent(id)}`), { credentials: 'include' })
  if (!response.ok) return undefined
  const blob = await response.blob()
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return `data:${blob.type || 'image/png'};base64,${btoa(binary)}`
}

function serverSessionToConversation(session: ServerAgentSession): AgentConversation {
  const messages: AgentMessage[] = []
  const rounds: AgentRound[] = Array.isArray(session.rounds) ? session.rounds : []
  for (const item of session.messages || []) {
    const content = parseJson<any>(item.content_json, {})
    const roundId = content.roundId || item.branch_id || item.id
    if (item.role === 'user' || item.role === 'assistant') {
      messages.push({
        id: item.id,
        role: item.role,
        content: typeof content.content === 'string' ? content.content : String(content.text || ''),
        roundId,
        createdAt: time(item.created_at),
      })
    }
  }
  return {
    id: session.id,
    title: session.title || '会话',
    activeRoundId: rounds.length ? rounds[rounds.length - 1].id : null,
    createdAt: time(session.created_at),
    updatedAt: time(session.updated_at),
    rounds,
    messages,
  }
}

export async function getServerAgentConversations(): Promise<AgentConversation[]> {
  return []
}

export async function syncServerAgentConversations(_conversations: AgentConversation[]) {
  return
}


export async function deleteServerTask(id: string) {
  await apiFetch<{ deleted: boolean }>(`/me/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function exportServerTasks() {
  const response = await fetch(gipApiPath('/me/tasks/export'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gip-team-export_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`
  a.click()
  URL.revokeObjectURL(url)
}

export async function uploadServerImage(file: File) {
  const form = new FormData()
  form.append('file', file)
  const result = await apiFetch<{ id: string; sha256: string; mime: string; path: string }>('/me/files/upload', {
    method: 'POST',
    body: form,
  })
  return result
}
