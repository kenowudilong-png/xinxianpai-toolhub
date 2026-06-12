import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify'
import cookie from '@fastify/cookie'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import Database from 'better-sqlite3'
import argon2 from 'argon2'
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Readable } from 'node:stream'
import { nanoid } from 'nanoid'
import { LRUCache } from 'lru-cache'
import { zipSync, strToU8 } from 'fflate'
import OSS from 'ali-oss'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const distDir = path.join(projectRoot, 'dist')
const dataDir = process.env.DATA_DIR || '/var/lib/xinxianpai-toolhub'
const appSecret = process.env.APP_SECRET || 'dev-app-secret-change-me-32-bytes-minimum'
const jwtSecret = process.env.JWT_SECRET || 'dev-jwt-secret-change-me-32-bytes-minimum'
const logPrompts = process.env.LOG_PROMPTS === 'true'
const maxUploadMb = Number(process.env.MAX_UPLOAD_MB || 20)
const port = Number(process.env.PORT || 3000)
const host = process.env.HOST || '127.0.0.1'
const platformDbPath = process.env.PLATFORM_DB_PATH || path.join(dataDir, 'main.sqlite')

type StoragePutOptions = { mime?: string }
type StorageHead = { size: number }
type SignedStorageUrl = { url: string; expiresAt: string }

interface StorageDriver {
  put(key: string, body: Buffer | Uint8Array, options?: StoragePutOptions): Promise<{ key: string; size: number }>
  get(key: string): Promise<Buffer>
  delete(key: string): Promise<void>
  exists(key: string): Promise<boolean>
  head(key: string): Promise<StorageHead>
  signGetUrl(key: string, expiresSeconds?: number): Promise<SignedStorageUrl>
}

function normalizeObjectKey(key: string) {
  return path.posix.normalize(key.replace(/\\/g, '/')).replace(/^\.\.(\/|$)/, '').replace(/^\/+/, '')
}

class LocalStorageDriver implements StorageDriver {
  constructor(private readonly rootDir: string) {}
  async put(key: string, body: Buffer | Uint8Array) {
    const buffer = Buffer.from(body)
    const fullPath = path.join(this.rootDir, normalizeObjectKey(key))
    await mkdir(path.dirname(fullPath), { recursive: true })
    await writeFile(fullPath, buffer)
    return { key: normalizeObjectKey(key), size: buffer.length }
  }
  async get(key: string) { return readFile(path.join(this.rootDir, normalizeObjectKey(key))) }
  async delete(key: string) { await rm(path.join(this.rootDir, normalizeObjectKey(key)), { force: true }) }
  async exists(key: string) { try { await stat(path.join(this.rootDir, normalizeObjectKey(key))); return true } catch { return false } }
  async head(key: string) { const info = await stat(path.join(this.rootDir, normalizeObjectKey(key))); return { size: info.size } }
  async signGetUrl(key: string, expiresSeconds = 600) {
    return { url: `/api/me/files/raw/${encodeURIComponent(normalizeObjectKey(key))}`, expiresAt: new Date(Date.now() + expiresSeconds * 1000).toISOString() }
  }
}

class OssStorageDriver implements StorageDriver {
  private readonly internalClient: OSS
  private readonly publicClient: OSS
  constructor() {
    const required = ['OSS_REGION', 'OSS_BUCKET', 'OSS_ENDPOINT_INTERNAL', 'OSS_ENDPOINT_PUBLIC', 'OSS_ACCESS_KEY_ID', 'OSS_ACCESS_KEY_SECRET']
    const missing = required.filter((key) => !process.env[key])
    if (missing.length) throw new Error(`Missing OSS env: ${missing.join(', ')}`)
    const base = {
      region: process.env.OSS_REGION!,
      bucket: process.env.OSS_BUCKET!,
      accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
      secure: true,
    }
    this.internalClient = new OSS({ ...base, endpoint: process.env.OSS_ENDPOINT_INTERNAL! })
    this.publicClient = new OSS({ ...base, endpoint: process.env.OSS_ENDPOINT_PUBLIC! })
  }
  async put(key: string, body: Buffer | Uint8Array, options?: StoragePutOptions) {
    const normalized = normalizeObjectKey(key)
    const buffer = Buffer.from(body)
    await this.internalClient.put(normalized, buffer, options?.mime ? { headers: { 'Content-Type': options.mime } } : undefined)
    return { key: normalized, size: buffer.length }
  }
  async get(key: string) {
    const result = await this.internalClient.get(normalizeObjectKey(key))
    return Buffer.isBuffer(result.content) ? result.content : Buffer.from(result.content as ArrayBuffer)
  }
  async delete(key: string) { await this.internalClient.delete(normalizeObjectKey(key)) }
  async exists(key: string) { try { await this.head(key); return true } catch { return false } }
  async head(key: string) {
    const result = await this.internalClient.head(normalizeObjectKey(key))
    return { size: Number(result.res.headers['content-length'] || 0) }
  }
  async signGetUrl(key: string, expiresSeconds = Number(process.env.STORAGE_SIGN_EXPIRES_SECONDS || 600)) {
    return { url: this.publicClient.signatureUrl(normalizeObjectKey(key), { expires: expiresSeconds, method: 'GET' }), expiresAt: new Date(Date.now() + expiresSeconds * 1000).toISOString() }
  }
}

const storageDriver: StorageDriver = process.env.STORAGE_DRIVER === 'oss'
  ? new OssStorageDriver()
  : new LocalStorageDriver(path.join(dataDir, 'files'))

function storageKey(toolId: string, userId: string, relPath: string) {
  return normalizeObjectKey(`${toolId}/${safeId(userId)}/${relPath}`)
}

function gipStorageKey(userId: string, relPath: string) {
  return storageKey('gip', userId, relPath)
}

type Role = 'admin' | 'user'
type UserStatus = 'active' | 'disabled'

type AuthUser = {
  id: string
  username: string
  role: Role
  status: UserStatus
  mustChangePassword: boolean
}

type ApiError = { code: string; message: string }
type ApiReply<T> = { ok: true; data: T } | { ok: false; error: ApiError }

type AuthRequest = FastifyRequest & { user?: AuthUser; sessionId?: string }

function ensureDirs() {
  mkdirSync(dataDir, { recursive: true })
  mkdirSync(path.join(dataDir, 'users'), { recursive: true })
  mkdirSync(path.join(dataDir, 'files'), { recursive: true })
  mkdirSync(path.join(dataDir, 'backups'), { recursive: true })
}

ensureDirs()

const mainDb = new Database(path.join(dataDir, 'gip-main.sqlite'))
mainDb.pragma('journal_mode = WAL')
mainDb.pragma('foreign_keys = ON')
const platformDb = new Database(platformDbPath)
platformDb.pragma('journal_mode = WAL')

function migrateMainDb() {
  mainDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'disabled')),
      must_change_password INTEGER NOT NULL DEFAULT 0,
      note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_active_at TEXT
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      revoked_at TEXT,
      ua TEXT,
      ip TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS login_failures (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      ip TEXT NOT NULL,
      failed_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_login_failures_lookup ON login_failures(username, ip, failed_at);
    CREATE TABLE IF NOT EXISTS global_configs (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS call_logs (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      user_id TEXT,
      username TEXT,
      model TEXT,
      provider TEXT,
      mode TEXT,
      duration_ms INTEGER,
      status TEXT NOT NULL,
      error_code TEXT,
      request_id TEXT,
      prompt TEXT
    );
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      actor_user_id TEXT,
      action TEXT NOT NULL,
      target TEXT,
      ip TEXT,
      detail_json TEXT
    );
  `)

  const defaults = [
    ['api', { profiles: [], defaultProfileId: '', updatedAt: nowIso() }],
    ['preferences', { clearInputAfterSubmit: false, persistInputOnRestart: true, defaultSize: 'auto', defaultQuality: 'auto', defaultApiMode: 'images' }],
    ['agent', { enabled: true, webSearch: false, maxBatchConcurrency: 2, systemPrompt: '' }],
    ['system', { siteName: '芯鲜派图像工作台' }],
    ['settings', null],
  ] as const

  const insert = mainDb.prepare('INSERT OR IGNORE INTO global_configs (key, value_json, updated_at) VALUES (?, ?, ?)')
  for (const [key, value] of defaults) insert.run(key, JSON.stringify(value), nowIso())
}

function migrateUserDb(db: Database.Database) {
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  function ensureColumn(db: Database.Database, table: string, column: string, definition: string) {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>
    if (!columns.some((item) => item.name === column)) db.prepare(`ALTER TABLE ${table} ADD COLUMN ${definition}`).run()
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT,
      status TEXT NOT NULL,
      mode TEXT NOT NULL,
      provider TEXT,
      model TEXT,
      prompt TEXT,
      rewritten_prompt TEXT,
      params_json TEXT,
      effective_params_json TEXT,
      duration_ms INTEGER,
      error_message TEXT,
      agent_session_id TEXT
    );
    CREATE TABLE IF NOT EXISTS task_images (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      file_sha256 TEXT NOT NULL,
      file_path TEXT NOT NULL,
      mime TEXT,
      width INTEGER,
      height INTEGER,
      created_at TEXT NOT NULL,
      favorite INTEGER DEFAULT 0,
      FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS uniq_user_image_sha ON task_images(file_sha256);
    CREATE TABLE IF NOT EXISTS uploads (
      id TEXT PRIMARY KEY,
      file_sha256 TEXT NOT NULL UNIQUE,
      file_path TEXT NOT NULL,
      mime TEXT,
      width INTEGER,
      height INTEGER,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS agent_sessions (
      id TEXT PRIMARY KEY,
      title TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      root_branch_id TEXT NOT NULL,
      rounds_json TEXT
    );
    CREATE TABLE IF NOT EXISTS agent_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      parent_id TEXT,
      branch_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_agent_msg_session ON agent_messages(session_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_agent_msg_branch ON agent_messages(branch_id);
    CREATE TABLE IF NOT EXISTS input_history (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `)
  ensureColumn(db, 'agent_sessions', 'rounds_json', 'rounds_json TEXT')
}

migrateMainDb()
mainDb.prepare('UPDATE users SET must_change_password = 0 WHERE must_change_password != 0').run()

const userDbPool = new LRUCache<string, Database.Database>({
  max: 100,
  dispose: (db) => db.close(),
})

function userDbDir(userId: string) {
  return path.join(dataDir, 'users', safeId(userId))
}

function userDbPath(userId: string) {
  return path.join(userDbDir(userId), 'gip.sqlite')
}

function getUserDb(userId: string) {
  const existing = userDbPool.get(userId)
  if (existing) return existing
  mkdirSync(userDbDir(userId), { recursive: true })
  const db = new Database(userDbPath(userId))
  migrateUserDb(db)
  userDbPool.set(userId, db)
  return db
}

function getExistingUserDb(userId: string) {
  const existing = userDbPool.get(userId)
  if (existing) return existing
  if (!existsSync(userDbPath(userId))) return null
  const db = new Database(userDbPath(userId))
  migrateUserDb(db)
  userDbPool.set(userId, db)
  return db
}

function nowIso() {
  return new Date().toISOString()
}

function safeId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_')
}

function ok<T>(data: T): ApiReply<T> {
  return { ok: true, data }
}

function fail(reply: FastifyReply, statusCode: number, code: string, message: string) {
  return reply.code(statusCode).send({ ok: false, error: { code, message } })
}

function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function secretKey() {
  return createHash('sha256').update(appSecret).digest()
}

function platformSecretKey() {
  return createHmac('sha256', appSecret).update('xinxianpai-key-encryption').digest()
}

function encryptSecret(value: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', secretKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`
}

function decryptSecret(value: string) {
  if (value.includes('.') && !value.startsWith('v1:')) {
    const [ivB64, tagB64, encryptedB64] = value.split('.')
    if (!ivB64 || !tagB64 || !encryptedB64) throw new Error('Invalid encrypted secret')
    const decipher = createDecipheriv('aes-256-gcm', platformSecretKey(), Buffer.from(ivB64, 'base64'))
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
    return Buffer.concat([decipher.update(Buffer.from(encryptedB64, 'base64')), decipher.final()]).toString('utf8')
  }
  const [version, ivB64, tagB64, encryptedB64] = value.split(':')
  if (version !== 'v1' || !ivB64 || !tagB64 || !encryptedB64) throw new Error('Invalid encrypted secret')
  const decipher = createDecipheriv('aes-256-gcm', secretKey(), Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(encryptedB64, 'base64')), decipher.final()]).toString('utf8')
}

function platformUserFileDir(userId: string) {
  return path.join(dataDir, 'files', 'tools', 'gip', 'users', safeId(userId))
}

function getPlatformApiConfig(requestedModel?: string) {
  const row = platformDb.prepare("SELECT * FROM api_configs WHERE enabled = 1 AND tool_id = ? ORDER BY is_default DESC, created_at ASC LIMIT 1").get('gip') as any
  if (!row) return null
  const models = JSON.parse(row.models_json || '[]') as string[]
  const model = requestedModel || models[0] || row.model || 'gpt-image-1'
  if (models.length && !models.includes(model)) throw new Error('Model not configured for GIP')
  return {
    provider: row.provider || row.note || 'platform',
    model,
    baseUrl: row.base_url,
    apiMode: 'images',
    encryptedApiKey: row.encrypted_key,
  }
}

function writePlatformUsageLog(user: AuthUser, status: string, durationMs: number, errorMessage?: string | null, provider?: string | null, model?: string | null) {
  platformDb.prepare('INSERT INTO usage_logs (id, user_id, tool_id, provider, model, status, duration_ms, error_message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(nanoid(), user.id, 'gip', provider || null, model || null, status, durationMs, errorMessage || null, nowIso())
}

function writePlatformAudit(actorUserId: string | null, action: string, target?: string, detail?: unknown) {
  const hasDetail = (platformDb.prepare("PRAGMA table_info(audit_log)").all() as Array<{ name: string }>).some(row => row.name === 'detail_json')
  if (hasDetail) {
    platformDb.prepare('INSERT INTO audit_log (id, actor_user_id, action, target, created_at, detail_json) VALUES (?, ?, ?, ?, ?, ?)')
      .run(nanoid(), actorUserId, action, target || null, nowIso(), detail ? JSON.stringify(detail) : null)
  } else {
    platformDb.prepare('INSERT INTO audit_log (id, actor_user_id, action, target, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(nanoid(), actorUserId, action, target || null, nowIso())
  }
}

function getConfig<T>(key: string): T {
  const row = mainDb.prepare('SELECT value_json FROM global_configs WHERE key = ?').get(key) as { value_json: string } | undefined
  return row ? JSON.parse(row.value_json) as T : undefined as T
}

function setConfig(key: string, value: unknown) {
  mainDb.prepare(`
    INSERT INTO global_configs (key, value_json, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
  `).run(key, JSON.stringify(value), nowIso())
}

function sanitizeApiConfig(config: any) {
  const profiles = Array.isArray(config?.profiles) ? config.profiles : []
  return {
    ...config,
    profiles: profiles.map((profile: any) => ({
      ...profile,
      apiKey: profile?.apiKey ? '••••••••' : '',
      encryptedApiKey: undefined,
    })),
  }
}

function normalizeSettingsConfigForStorage(nextConfig: any, previousConfig: any) {
  const previousProfiles = new Map<string, any>((Array.isArray(previousConfig?.profiles) ? previousConfig.profiles : []).map((profile: any) => [profile.id, profile]))
  const profiles = Array.isArray(nextConfig?.profiles) ? nextConfig.profiles : []
  return {
    ...nextConfig,
    profiles: profiles.map((profile: any) => {
      const previous = previousProfiles.get(profile.id)
      let encryptedApiKey = previous?.encryptedApiKey || ''
      if (typeof profile.apiKey === 'string' && profile.apiKey && profile.apiKey !== '••••••••') {
        encryptedApiKey = encryptSecret(profile.apiKey)
      }
      const { apiKey: _apiKey, encryptedApiKey: _ignored, ...rest } = profile
      return { ...rest, apiKey: encryptedApiKey ? '••••••••' : '', encryptedApiKey }
    }),
  }
}

function sanitizeSettingsConfig(config: any) {
  if (!config || typeof config !== 'object') return config
  return {
    ...config,
    profiles: Array.isArray(config.profiles) ? config.profiles.map((profile: any) => {
      const { encryptedApiKey: _encryptedApiKey, ...rest } = profile || {}
      return { ...rest, apiProxy: true, apiKey: profile?.encryptedApiKey || profile?.apiKey ? '••••••••' : '' }
    }) : config.profiles,
  }
}

function getAdminSettings() {
  return getConfig<any>('settings') || null
}

function getActiveProfileFromSettings(settings: any) {
  const profiles = Array.isArray(settings?.profiles) ? settings.profiles : []
  return profiles.find((item: any) => item.id === settings?.activeProfileId) || profiles[0] || null
}

function settingsFromPlatformApiConfig() {
  const row = platformDb.prepare("SELECT * FROM api_configs WHERE enabled = 1 AND tool_id = ? ORDER BY is_default DESC, created_at ASC LIMIT 1").get('gip') as any
  if (!row) return null
  const models = JSON.parse(row.models_json || '[]') as string[]
  const model = row.model || models[0] || 'gpt-image-1'
  const profileId = 'gip-platform-default'
  return {
    baseUrl: row.base_url,
    apiKey: row.encrypted_key ? '••••••••' : '',
    model,
    timeout: 60000,
    apiMode: 'images',
    codexCli: false,
    apiProxy: true,
    streamImages: true,
    streamPartialImages: 2,
    customProviders: [],
    clearInputAfterSubmit: false,
    persistInputOnRestart: true,
    reuseTaskApiProfileTemporarily: false,
    alwaysShowRetryButton: false,
    enterSubmit: false,
    referenceImageEditAction: 'ask',
    agentScrollToBottomAfterSubmit: true,
    agentMaxToolRounds: 5,
    agentWebSearch: false,
    profiles: [{
      id: profileId,
      name: row.note || '生图站默认配置',
      provider: row.provider || 'openai',
      baseUrl: row.base_url,
      apiKey: row.encrypted_key ? '••••••••' : '',
      encryptedApiKey: row.encrypted_key,
      model,
      timeout: 60000,
      apiMode: 'images',
      codexCli: false,
      apiProxy: true,
      streamImages: true,
      streamPartialImages: 2,
      models,
    }],
    activeProfileId: profileId,
    updatedAt: row.updated_at || row.created_at || nowIso(),
  }
}

function getEffectiveAdminSettings() {
  return getAdminSettings() || settingsFromPlatformApiConfig()
}

function getActivePlatformProfile(requestedModel?: string) {
  const settings = getEffectiveAdminSettings()
  const profile = getActiveProfileFromSettings(settings)
  if (!profile) return null
  const allowedModels = Array.isArray(profile.models) ? profile.models : []
  const model = requestedModel || profile.model || allowedModels[0]
  if (model && allowedModels.length && !allowedModels.includes(model)) throw new Error('Model not configured for GIP')
  return { ...profile, model }
}

function countInputImages(value: unknown): number {
  if (!value) return 0
  if (Array.isArray(value)) return value.reduce((sum, item) => sum + countInputImages(item), 0)
  if (typeof value !== 'object') return 0
  const record = value as Record<string, unknown>
  let count = record.type === 'input_image' ? 1 : 0
  for (const item of Object.values(record)) count += countInputImages(item)
  return count
}

function normalizeApiConfigForStorage(nextConfig: any, previousConfig: any) {
  const previousProfiles = new Map<string, any>((Array.isArray(previousConfig?.profiles) ? previousConfig.profiles : []).map((profile: any) => [profile.id, profile]))
  const profiles = Array.isArray(nextConfig?.profiles) ? nextConfig.profiles : []
  return {
    ...nextConfig,
    profiles: profiles.map((profile: any) => {
      const previous = previousProfiles.get(profile.id)
      let encryptedApiKey = previous?.encryptedApiKey || ''
      if (typeof profile.apiKey === 'string' && profile.apiKey && profile.apiKey !== '••••••••') {
        encryptedApiKey = encryptSecret(profile.apiKey)
      }
      const { apiKey: _apiKey, encryptedApiKey: _ignored, ...rest } = profile
      return { ...rest, encryptedApiKey }
    }),
  }
}

function publicConfig() {
  const api = sanitizeApiConfig(getConfig<any>('api') || {})
  const preferences = getConfig<any>('preferences') || {}
  const agent = getConfig<any>('agent') || {}
  const system = getConfig<any>('system') || {}
  return { api, preferences, agent, system, settings: sanitizeSettingsConfig(getEffectiveAdminSettings()) }
}

function createUserDbAndFiles(userId: string) {
  getUserDb(userId)
  mkdirSync(platformUserFileDir(userId), { recursive: true })
}

function deleteUserDbAndFiles(userId: string) {
  userDbPool.delete(userId)
  rmSync(userDbPath(userId), { force: true })
  rmSync(`${userDbPath(userId)}-wal`, { force: true })
  rmSync(`${userDbPath(userId)}-shm`, { force: true })
  rmSync(platformUserFileDir(userId), { recursive: true, force: true })
}

function audit(actor: AuthUser | undefined, action: string, target: string | null, request: FastifyRequest, detail?: unknown) {
  mainDb.prepare('INSERT INTO audit_log (id, created_at, actor_user_id, action, target, ip, detail_json) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(nanoid(), nowIso(), actor?.id || null, action, target, request.ip, detail ? JSON.stringify(detail) : null)
}


const rateBuckets = new Map<string, number[]>()
function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const bucket = (rateBuckets.get(key) || []).filter((item) => now - item < windowMs)
  if (bucket.length >= limit) {
    rateBuckets.set(key, bucket)
    return false
  }
  bucket.push(now)
  rateBuckets.set(key, bucket)
  return true
}

function assertGenerateRateLimit(request: AuthRequest, reply: FastifyReply) {
  const allowed = checkRateLimit(`generate:${request.user!.id}`, Number.parseInt(process.env.RATE_LIMIT_GENERATE || '10', 10) || 10, 60_000)
  if (!allowed) return fail(reply, 429, 'RATE_LIMITED', '生图请求过于频繁，请稍后再试')
}


function hasUsers() {
  const row = mainDb.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number }
  return row.count > 0
}

async function getSessionUser(request: FastifyRequest): Promise<{ user: AuthUser; sessionId: string } | null> {
  const token = request.cookies.session
  if (!token) return null
  const row = mainDb.prepare(`
    SELECT s.id AS session_id, s.expires_at, s.revoked_at, u.id, u.username, u.role, u.status, u.must_change_password
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ?
  `).get(tokenHash(token)) as any
  if (!row || row.revoked_at || Date.parse(row.expires_at) <= Date.now() || row.status !== 'active') return null
  mainDb.prepare('UPDATE users SET last_active_at = ? WHERE id = ?').run(nowIso(), row.id)
  return {
    sessionId: row.session_id,
    user: {
      id: row.id,
      username: row.username,
      role: row.role,
      status: row.status,
      mustChangePassword: Boolean(row.must_change_password),
    },
  }
}

function platformUserFromHeaders(request: FastifyRequest): AuthUser | null {
  const remote = request.ip || ''
  if (!['127.0.0.1', '::1', 'localhost'].includes(remote) && !remote.endsWith('127.0.0.1')) return null
  const userId = String(request.headers['x-xp-user-id'] || '').trim()
  const username = String(request.headers['x-xp-username'] || '').trim()
  const role = String(request.headers['x-xp-role'] || 'user') === 'admin' ? 'admin' : 'user'
  const toolId = String(request.headers['x-xp-tool-id'] || '').trim()
  if (!userId || !username || toolId !== 'gip') return null
  return { id: userId, username, role, status: 'active', mustChangePassword: false }
}

async function requireAuth(request: AuthRequest, reply: FastifyReply) {
  const user = platformUserFromHeaders(request)
  if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请从芯鲜派工具站进入生图站')
  request.user = user
  request.sessionId = `platform:${user.id}`
}

async function requireAdmin(request: AuthRequest, reply: FastifyReply) {
  await requireAuth(request, reply)
  if (reply.sent) return
  if (request.user?.role !== 'admin') return fail(reply, 403, 'FORBIDDEN', '需要管理员权限')
}

async function requireCsrf(request: AuthRequest, reply: FastifyReply) {
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') return
  if (request.headers['x-requested-with'] !== 'XMLHttpRequest') {
    return fail(reply, 403, 'CSRF_REQUIRED', '缺少请求来源校验')
  }
}

function recentLoginFailureCount(username: string, ip: string) {
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  const row = mainDb.prepare('SELECT COUNT(*) AS count FROM login_failures WHERE username = ? AND ip = ? AND failed_at > ?')
    .get(username, ip, since) as { count: number }
  return row.count
}


function userToPublic(user: any) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    status: user.status,
    mustChangePassword: Boolean(user.must_change_password ?? user.mustChangePassword),
    note: user.note ?? '',
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    lastActiveAt: user.last_active_at,
  }
}

function listTasksForUser(userId: string, limit = 50, offset = 0) {
  const db = getUserDb(userId)
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset) as any[]
  const imagesStmt = db.prepare('SELECT * FROM task_images WHERE task_id = ? ORDER BY created_at ASC')
  return tasks.map((task) => ({ ...task, images: imagesStmt.all(task.id) }))
}

function listAgentSessionsForUser(userId: string, limit = 50, offset = 0) {
  const db = getUserDb(userId)
  const sessions = db.prepare('SELECT * FROM agent_sessions ORDER BY updated_at DESC LIMIT ? OFFSET ?').all(limit, offset) as any[]
  const messagesStmt = db.prepare('SELECT * FROM agent_messages WHERE session_id = ? ORDER BY created_at ASC')
  return sessions.map((session) => ({ ...session, rounds: session.rounds_json ? JSON.parse(session.rounds_json) : [], messages: messagesStmt.all(session.id) }))
}

function replaceAgentSessionsForUser(userId: string, conversations: any[]) {
  const db = getUserDb(userId)
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM agent_messages').run()
    db.prepare('DELETE FROM agent_sessions').run()
    const insertSession = db.prepare('INSERT INTO agent_sessions (id, title, created_at, updated_at, root_branch_id, rounds_json) VALUES (?, ?, ?, ?, ?, ?)')
    const insertMessage = db.prepare('INSERT INTO agent_messages (id, session_id, parent_id, branch_id, role, content_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    for (const conversation of conversations) {
      const sessionId = String(conversation.id || `agt_${nanoid()}`)
      insertSession.run(sessionId, conversation.title || '智能助手会话', new Date(conversation.createdAt || Date.now()).toISOString(), new Date(conversation.updatedAt || Date.now()).toISOString(), conversation.activeRoundId || sessionId, JSON.stringify(Array.isArray(conversation.rounds) ? conversation.rounds : []))
      for (const message of Array.isArray(conversation.messages) ? conversation.messages : []) {
        insertMessage.run(String(message.id || nanoid()), sessionId, null, String(message.roundId || conversation.activeRoundId || sessionId), message.role === 'assistant' ? 'assistant' : 'user', JSON.stringify({ content: message.content || '', roundId: message.roundId || null }), new Date(message.createdAt || Date.now()).toISOString())
      }
    }
  })
  tx()
}

const app = Fastify({ logger: true, bodyLimit: maxUploadMb * 1024 * 1024 })
await app.register(cookie, { secret: jwtSecret })
await app.register(multipart, { limits: { fileSize: maxUploadMb * 1024 * 1024 } })

app.addHook('preHandler', async (request, reply) => {
  if (request.url.startsWith('/api/') && !request.url.startsWith('/api/auth/login') && !request.url.startsWith('/api/setup/')) {
    if (request.headers['x-xp-tool-id'] === 'gip') return
    await requireCsrf(request as AuthRequest, reply)
  }
})

app.get('/api/health', async () => ok({ status: 'ok', time: nowIso() }))

app.get('/api/setup/status', async (_request, reply) => fail(reply, 404, 'DISABLED', '平台模式已禁用 GIP 初始化'))

app.post('/api/setup/init', async (_request, reply) => fail(reply, 404, 'DISABLED', '平台模式已禁用 GIP 初始化'))

app.post('/api/auth/login', async (_request, reply) => fail(reply, 404, 'DISABLED', '请从芯鲜派工具站登录'))

app.post('/api/auth/logout', { preHandler: requireAuth }, async () => ok({ loggedOut: true }))

app.get('/api/auth/me', { preHandler: requireAuth }, async (request: AuthRequest) => ok({ user: request.user, publicConfig: publicConfig() }))

app.post('/api/auth/change-password', { preHandler: requireAuth }, async (_request: AuthRequest, reply) => fail(reply, 404, 'DISABLED', '请在芯鲜派工具站修改密码'))

app.get('/api/admin/users', { preHandler: requireAdmin }, async (_request, reply) => fail(reply, 404, 'DISABLED', '平台模式已禁用 GIP 用户管理'))

app.post('/api/admin/users', { preHandler: requireAdmin }, async (_request, reply) => fail(reply, 404, 'DISABLED', '平台模式已禁用 GIP 用户管理'))

app.patch('/api/admin/users/:id', { preHandler: requireAdmin }, async (_request, reply) => fail(reply, 404, 'DISABLED', '平台模式已禁用 GIP 用户管理'))

app.post('/api/admin/users/:id/reset-password', { preHandler: requireAdmin }, async (_request, reply) => fail(reply, 404, 'DISABLED', '平台模式已禁用 GIP 用户管理'))

app.delete('/api/admin/users/:id', { preHandler: requireAdmin }, async (_request, reply) => fail(reply, 404, 'DISABLED', '平台模式已禁用 GIP 用户管理'))

app.get('/api/admin/configs/:key', { preHandler: requireAdmin }, async (request, reply) => {
  const key = (request.params as any).key
  if (key !== 'settings') return fail(reply, 404, 'NOT_FOUND', '配置不存在')
  return ok({ key, value: sanitizeSettingsConfig(getEffectiveAdminSettings()) })
})

app.put('/api/admin/configs/:key', { preHandler: requireAdmin }, async (request: AuthRequest, reply) => {
  const key = (request.params as any).key
  if (key !== 'settings') return fail(reply, 404, 'NOT_FOUND', '配置不存在')
  const incoming = (request.body as any)?.value
  const stored = normalizeSettingsConfigForStorage(incoming, getEffectiveAdminSettings())
  setConfig('settings', { ...stored, updatedAt: nowIso() })
  writePlatformAudit(request.user?.id || null, 'update_gip_app_settings', 'gip')
  return ok({ key, value: sanitizeSettingsConfig(stored) })
})

app.get('/api/me/configs/public', { preHandler: requireAuth }, async () => ok(publicConfig()))

app.all('/api-proxy/*', { preHandler: requireAuth }, async (request: AuthRequest, reply) => {
  const settings = getEffectiveAdminSettings()
  const profile = getActiveProfileFromSettings(settings)
  if (!profile) return fail(reply, 400, 'NO_API_PROFILE', '管理员尚未配置 API 服务商')
  const apiKey = profile.encryptedApiKey ? decryptSecret(profile.encryptedApiKey) : profile.apiKey
  if (!apiKey || apiKey === '••••••••') return fail(reply, 400, 'NO_API_KEY', '管理员尚未配置 API Key')

  const wildcard = (request.params as any)['*'] || ''
  const baseUrl = profile.baseUrl || (profile.provider === 'fal' ? 'https://fal.run' : 'https://api.openai.com/v1')
  const upstreamUrl = joinApiUrl(baseUrl, wildcard)
  request.log.info({ path: wildcard, inputImages: countInputImages(request.body), hasInput: Boolean((request.body as any)?.input) }, 'api proxy request')
  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': request.headers['content-type'] || 'application/json',
      Accept: request.headers.accept || '*/*',
    },
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : JSON.stringify(request.body ?? {}),
  })

  reply.code(upstream.status)
  upstream.headers.forEach((value, key) => {
    if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) reply.header(key, value)
  })
  if (!upstream.body) return reply.send(await upstream.text())
  return reply.send(Readable.fromWeb(upstream.body as any))
})

app.post('/api/me/files/upload', { preHandler: requireAuth }, async (request: AuthRequest, reply) => {
  const file = await request.file()
  if (!file) return fail(reply, 400, 'NO_FILE', '请选择文件')
  const bytes = await file.toBuffer()
  const sha = createHash('sha256').update(bytes).digest('hex')
  const ext = path.extname(file.filename || '') || '.bin'
  const rel = path.join(sha.slice(0, 2), sha.slice(2, 4), `${sha}${ext}`)
  await storageDriver.put(gipStorageKey(request.user!.id, rel), bytes, { mime: file.mimetype })
  const db = getUserDb(request.user!.id)
  const existing = db.prepare('SELECT id, file_path, mime FROM uploads WHERE file_sha256 = ?').get(sha) as any
  if (existing) return ok({ id: existing.id, sha256: sha, mime: existing.mime || file.mimetype, path: existing.file_path })
  const uploadId = `upl_${nanoid()}`
  db.prepare('INSERT INTO uploads (id, file_sha256, file_path, mime, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(uploadId, sha, rel, file.mimetype, nowIso())
  return ok({ id: uploadId, sha256: sha, mime: file.mimetype, path: rel })
})

app.get('/api/me/files/:id', { preHandler: requireAuth }, async (request: AuthRequest, reply) => {
  const db = getExistingUserDb(request.user!.id)
  if (!db) return fail(reply, 404, 'NOT_FOUND', '文件不存在')
  const fileId = (request.params as any).id
  const row = (db.prepare('SELECT id, file_sha256, file_path, mime, width, height, created_at FROM uploads WHERE id = ?').get(fileId)
    || db.prepare('SELECT id, file_sha256, file_path, mime, width, height, created_at FROM task_images WHERE id = ?').get(fileId)) as any
  if (!row) return fail(reply, 404, 'NOT_FOUND', '文件不存在')
  const key = gipStorageKey(request.user!.id, row.file_path)
  if (!(await storageDriver.exists(key))) return fail(reply, 404, 'NOT_FOUND', '文件不存在')
  const signed = await storageDriver.signGetUrl(key)
  return reply.redirect(signed.url, 302)
})

app.get('/api/me/tasks', { preHandler: requireAuth }, async (request: AuthRequest) => ok({ tasks: listTasksForUser(request.user!.id) }))


app.post('/api/me/tasks/export', { preHandler: requireAuth }, async (request: AuthRequest, reply) => {
  const tasks = listTasksForUser(request.user!.id, 10000, 0) as any[]
  const files: Record<string, Uint8Array | [Uint8Array, { mtime: Date }]> = {}
  files['manifest.json'] = strToU8(JSON.stringify({ version: 1, exportedAt: nowIso(), tasks }, null, 2))
  for (const task of tasks) {
    for (const image of task.images || []) {
      const key = gipStorageKey(request.user!.id, image.file_path)
      if (await storageDriver.exists(key)) files[`images/${image.id}${path.extname(image.file_path) || '.png'}`] = await storageDriver.get(key)
    }
  }
  const zipped = zipSync(files, { level: 6 })
  reply.header('content-type', 'application/zip')
  reply.header('content-disposition', `attachment; filename="gip-team-export-${Date.now()}.zip"`)
  return reply.send(Buffer.from(zipped))
})

app.get('/api/me/tasks/:id', { preHandler: requireAuth }, async (request: AuthRequest, reply) => {
  const db = getUserDb(request.user!.id)
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get((request.params as any).id)
  if (!task) return fail(reply, 404, 'NOT_FOUND', '任务不存在')
  const images = db.prepare('SELECT * FROM task_images WHERE task_id = ? ORDER BY created_at ASC').all((request.params as any).id)
  return ok({ task, images })
})

app.delete('/api/me/tasks/:id', { preHandler: requireAuth }, async (request: AuthRequest, reply) => {
  const taskId = (request.params as any).id
  const userId = request.user!.id
  const db = getUserDb(userId)
  const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(taskId) as { id: string } | undefined
  if (!task) return fail(reply, 404, 'NOT_FOUND', '任务不存在')

  const images = db.prepare('SELECT file_path FROM task_images WHERE task_id = ?').all(taskId) as Array<{ file_path: string }>
  for (const image of images) {
    await storageDriver.delete(gipStorageKey(userId, image.file_path))
  }

  db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId)
  return ok({ deleted: true, filesDeleted: images.length })
})


function joinApiUrl(baseUrl: string, endpoint: string) {
  return `${baseUrl.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`
}

function dataUrlToBuffer(dataUrl: string) {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUrl)
  if (!match) throw new Error('Invalid data URL')
  const mime = match[1] || 'application/octet-stream'
  const isBase64 = Boolean(match[2])
  const payload = match[3] || ''
  const buffer = isBase64 ? Buffer.from(payload, 'base64') : Buffer.from(decodeURIComponent(payload), 'utf8')
  return { mime, buffer }
}

function bufferToDataUrl(buffer: Buffer, mime: string) {
  return `data:${mime};base64,${buffer.toString('base64')}`
}

function redactUpstreamErrorText(text: string) {
  return text
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer ***REDACTED***')
    .replace(/sk-[A-Za-z0-9_-]{8,}/gi, 'sk-***REDACTED***')
}

async function throwUpstreamError(response: Response, endpoint: string, meta: Record<string, unknown>) {
  const text = redactUpstreamErrorText(await response.text())
  throw new Error(`Upstream ${endpoint} failed: HTTP ${response.status} ${response.statusText}; meta=${JSON.stringify(meta)}; body=${text}`)
}

async function fetchImageAsDataUrl(url: string, fallbackMime: string) {
  if (url.startsWith('data:')) return url
  const response = await fetch(url)
  if (!response.ok) throw new Error(`图片下载失败：HTTP ${response.status}`)
  const mime = response.headers.get('content-type') || fallbackMime
  return bufferToDataUrl(Buffer.from(await response.arrayBuffer()), mime)
}

function pickMime(outputFormat: string | undefined) {
  if (outputFormat === 'jpeg') return 'image/jpeg'
  if (outputFormat === 'webp') return 'image/webp'
  return 'image/png'
}

function isAipaiBoxBaseUrl(baseUrl: string) {
  try {
    return new URL(baseUrl).hostname.toLowerCase() === 'api.aipaibox.com'
  } catch {
    return /(^|\/\/)api\.aipaibox\.com(\/|$)/i.test(baseUrl)
  }
}

function normalizeAipaiBoxQuality(quality: string | undefined) {
  if (quality === 'high' || quality === 'hd') return 'hd'
  if (quality === 'medium') return 'medium'
  return 'standard'
}

function normalizeAipaiBoxSize(size: string | undefined) {
  return size && size !== 'auto' ? size : '1024x1024'
}

async function normalizeImageResults(payload: any, mime: string) {
  const items = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []
  const images: string[] = []
  const rawImageUrls: string[] = []
  const revisedPrompts: Array<string | undefined> = []
  for (const item of items) {
    if (typeof item?.b64_json === 'string' && item.b64_json) {
      images.push(bufferToDataUrl(Buffer.from(item.b64_json, 'base64'), mime))
      revisedPrompts.push(typeof item.revised_prompt === 'string' ? item.revised_prompt : undefined)
    } else if (typeof item?.url === 'string' && item.url) {
      rawImageUrls.push(item.url)
      images.push(await fetchImageAsDataUrl(item.url, mime))
      revisedPrompts.push(typeof item.revised_prompt === 'string' ? item.revised_prompt : undefined)
    }
  }
  if (!images.length) throw new Error('上游未返回可识别图片数据')
  return { images, rawImageUrls, revisedPrompts }
}

function walkResponsesOutput(value: unknown, results: any[] = []) {
  if (!value) return results
  if (Array.isArray(value)) {
    for (const item of value) walkResponsesOutput(item, results)
    return results
  }
  if (typeof value !== 'object') return results
  const record = value as Record<string, unknown>
  const result = record.result
  if (record.type === 'image_generation_call' && result) results.push({ b64_json: typeof result === 'string' ? result : (result as any).b64_json || (result as any).base64 || (result as any).image || (result as any).data })
  for (const item of Object.values(record)) walkResponsesOutput(item, results)
  return results
}

async function callUpstreamGenerate(profile: any, body: any) {
  const apiKey = profile.encryptedApiKey ? decryptSecret(profile.encryptedApiKey) : profile.apiKey
  if (!apiKey) throw new Error('管理员尚未配置 API Key')
  const baseUrl = profile.baseUrl || (profile.provider === 'fal' ? 'https://fal.run' : 'https://api.openai.com/v1')
  const params = body?.params || {}
  const prompt = String(body?.prompt || '')
  const inputImages: string[] = Array.isArray(body?.inputImageDataUrls) ? body.inputImageDataUrls : []
  const mime = pickMime(params.output_format)
  const headers = { Authorization: `Bearer ${apiKey}` }

  if (profile.provider === 'fal') {
    const response = await fetch(joinApiUrl(baseUrl, profile.model || ''), {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, image_size: params.size, num_images: params.n || 1 }),
    })
    if (!response.ok) await throwUpstreamError(response, profile.model || 'fal', { provider: profile.provider, model: profile.model, size: params.size, n: params.n || 1 })
    const payload = await response.json() as any
    const urls = [payload?.image?.url, ...(Array.isArray(payload?.images) ? payload.images.map((item: any) => item.url) : [])].filter(Boolean)
    const images = await Promise.all(urls.map((url: string) => fetchImageAsDataUrl(url, mime)))
    if (!images.length) throw new Error('fal.ai 未返回图片')
    return { images, actualParams: { n: images.length }, actualParamsList: images.map(() => ({ n: images.length })), rawImageUrls: urls }
  }

  if (profile.apiMode === 'responses' || body?.mode === 'responses') {
    const response = await fetch(joinApiUrl(baseUrl, 'responses'), {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: profile.model,
        input: prompt,
        tools: [{ type: 'image_generation', size: params.size, quality: params.quality, output_format: params.output_format }],
        tool_choice: 'required',
      }),
    })
    if (!response.ok) await throwUpstreamError(response, 'responses', { provider: profile.provider, model: profile.model, size: params.size, quality: params.quality, n: params.n || 1 })
    const payload = await response.json()
    const parsed = await normalizeImageResults(walkResponsesOutput(payload), mime)
    return { ...parsed, actualParams: { n: parsed.images.length }, actualParamsList: parsed.images.map(() => ({ n: parsed.images.length })) }
  }

  if (inputImages.length > 0 || body?.maskDataUrl) {
    const formData = new FormData()
    formData.append('model', profile.model)
    formData.append('prompt', prompt)
    formData.append('size', params.size || 'auto')
    formData.append('output_format', params.output_format || 'png')
    formData.append('moderation', params.moderation || 'auto')
    if (!profile.codexCli) formData.append('quality', params.quality || 'auto')
    if (params.output_compression != null) formData.append('output_compression', String(params.output_compression))
    if (params.n > 1) formData.append('n', String(params.n))
    formData.append('response_format', 'b64_json')
    inputImages.forEach((dataUrl, index) => {
      const file = dataUrlToBuffer(dataUrl)
      formData.append('image[]', new Blob([file.buffer], { type: file.mime }), `input-${index + 1}.png`)
    })
    if (body?.maskDataUrl) {
      const mask = dataUrlToBuffer(body.maskDataUrl)
      formData.append('mask', new Blob([mask.buffer], { type: mask.mime }), 'mask.png')
    }
    const response = await fetch(joinApiUrl(baseUrl, 'images/edits'), { method: 'POST', headers, body: formData })
    if (!response.ok) await throwUpstreamError(response, 'images/edits', { provider: profile.provider, model: profile.model, size: params.size, quality: params.quality, n: params.n || 1, inputImages: inputImages.length, hasMask: Boolean(body?.maskDataUrl) })
    const parsed = await normalizeImageResults(await response.json(), mime)
    return { ...parsed, actualParams: { n: parsed.images.length }, actualParamsList: parsed.images.map(() => ({ n: parsed.images.length })) }
  }

  if (isAipaiBoxBaseUrl(baseUrl)) {
    const response = await fetch(joinApiUrl(baseUrl, 'images/generations'), {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: profile.model,
        prompt,
        n: params.n || 1,
        size: normalizeAipaiBoxSize(params.size),
        quality: normalizeAipaiBoxQuality(profile.codexCli ? undefined : params.quality),
        response_format: 'url',
      }),
    })
    if (!response.ok) await throwUpstreamError(response, 'images/generations', { provider: profile.provider, model: profile.model, size: params.size, quality: params.quality, n: params.n || 1 })
    const parsed = await normalizeImageResults(await response.json(), mime)
    return { ...parsed, actualParams: { n: parsed.images.length }, actualParamsList: parsed.images.map(() => ({ n: parsed.images.length })) }
  }

  const response = await fetch(joinApiUrl(baseUrl, 'images/generations'), {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: profile.model,
      prompt,
      size: params.size || 'auto',
      output_format: params.output_format || 'png',
      moderation: params.moderation || 'auto',
      quality: profile.codexCli ? undefined : (params.quality || 'auto'),
      output_compression: params.output_compression ?? undefined,
      n: params.n > 1 ? params.n : undefined,
      response_format: 'b64_json',
    }),
  })
  if (!response.ok) await throwUpstreamError(response, 'images/generations', { provider: profile.provider, model: profile.model, size: params.size, quality: params.quality, n: params.n || 1 })
  const parsed = await normalizeImageResults(await response.json(), mime)
  return { ...parsed, actualParams: { n: parsed.images.length }, actualParamsList: parsed.images.map(() => ({ n: parsed.images.length })) }
}

async function saveGeneratedImages(userId: string, taskId: string, images: string[]) {
  const outputIds: string[] = []
  const db = getUserDb(userId)
  for (const dataUrl of images) {
    const { mime, buffer } = dataUrlToBuffer(dataUrl)
    const sha = createHash('sha256').update(buffer).digest('hex')
    const ext = mime === 'image/jpeg' ? '.jpg' : mime === 'image/webp' ? '.webp' : '.png'
    const rel = path.join(sha.slice(0, 2), sha.slice(2, 4), `${sha}${ext}`)
    await storageDriver.put(gipStorageKey(userId, rel), buffer, { mime })
    const imageId = sha
    db.prepare('INSERT OR IGNORE INTO task_images (id, task_id, file_sha256, file_path, mime, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(imageId, taskId, sha, rel, mime, nowIso())
    outputIds.push(imageId)
  }
  return outputIds
}

app.post('/api/me/generate', { preHandler: requireAuth }, async (request: AuthRequest, reply) => {
  const started = Date.now()
  const body = request.body as any
  const requestedTaskId = typeof body?.taskId === 'string' && /^[a-zA-Z0-9_-]{3,80}$/.test(body.taskId) ? body.taskId : null
  const taskId = requestedTaskId || `tsk_${nanoid()}`
  const requestedModel = typeof body?.model === 'string' ? body.model : undefined
  const defaultProfile = getActivePlatformProfile(requestedModel)
  if (!defaultProfile) {
    writePlatformUsageLog(request.user!, 'missing_config', Date.now() - started, 'No API config', null, requestedModel || null)
    return fail(reply, 400, 'NO_API_PROFILE', '管理员尚未配置 GIP 接口')
  }
  const rateLimited = assertGenerateRateLimit(request, reply)
  if (reply.sent || rateLimited) return

  const db = getUserDb(request.user!.id)
  const agentSessionId = typeof body?.agentSessionId === 'string' && body.agentSessionId.trim() ? body.agentSessionId.trim() : null
  db.prepare('INSERT OR REPLACE INTO tasks (id, created_at, updated_at, status, mode, provider, model, prompt, params_json, error_message, agent_session_id) VALUES (?, COALESCE((SELECT created_at FROM tasks WHERE id = ?), ?), ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(taskId, taskId, nowIso(), nowIso(), 'running', body?.mode || defaultProfile.apiMode || 'images', defaultProfile.provider || null, defaultProfile.model || null, body?.prompt || '', JSON.stringify(body?.params || {}), null, agentSessionId)

  try {
    const result = await callUpstreamGenerate(defaultProfile, body)
    const imageIds = await saveGeneratedImages(request.user!.id, taskId, result.images)
    db.prepare('UPDATE tasks SET status = ?, updated_at = ?, effective_params_json = ?, duration_ms = ? WHERE id = ?')
      .run('success', nowIso(), JSON.stringify(result.actualParams || {}), Date.now() - started, taskId)
    writePlatformUsageLog(request.user!, 'success', Date.now() - started, null, defaultProfile.provider || null, defaultProfile.model || null)
    return ok({
      taskId,
      imageIds,
      images: [],
      actualParams: result.actualParams,
      actualParamsList: result.actualParamsList,
      revisedPrompts: 'revisedPrompts' in result ? result.revisedPrompts : undefined,
      rawImageUrls: result.rawImageUrls,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    db.prepare('UPDATE tasks SET status = ?, updated_at = ?, duration_ms = ?, error_message = ? WHERE id = ?')
      .run('failed', nowIso(), Date.now() - started, message, taskId)
    writePlatformUsageLog(request.user!, 'failed', Date.now() - started, message, defaultProfile.provider || null, defaultProfile.model || null)
    return fail(reply, 502, 'UPSTREAM_ERROR', message)
  }
})
function agentGone(reply: FastifyReply) {
  return fail(reply, 410, 'AGENT_REMOVED', 'Agent 功能已永久移除')
}

app.get('/api/me/agent/sessions', { preHandler: requireAuth }, async (_request: AuthRequest, reply) => agentGone(reply))
app.put('/api/me/agent/sessions/sync', { preHandler: requireAuth }, async (_request: AuthRequest, reply) => agentGone(reply))
app.get('/api/me/agent/sessions/:id', { preHandler: requireAuth }, async (_request: AuthRequest, reply) => agentGone(reply))
app.post('/api/me/agent/send', { preHandler: requireAuth }, async (_request: AuthRequest, reply) => agentGone(reply))

app.get('/api/admin/users/:id/tasks', { preHandler: requireAdmin }, async (request: AuthRequest) => {
  const id = (request.params as any).id
  audit(request.user, 'view_user_tasks', id, request)
  return ok({ tasks: listTasksForUser(id) })
})

app.get('/api/admin/users/:id/agent/sessions', { preHandler: requireAdmin }, async (_request: AuthRequest, reply) => agentGone(reply))

app.get('/api/admin/users/:id/files/:fileId', { preHandler: requireAdmin }, async (request: AuthRequest, reply) => {
  const userId = (request.params as any).id
  const fileId = (request.params as any).fileId
  const db = getExistingUserDb(userId)
  if (!db) return fail(reply, 404, 'NOT_FOUND', '文件不存在')
  const row = (db.prepare('SELECT id, file_sha256, file_path, mime, width, height, created_at FROM uploads WHERE id = ?').get(fileId)
    || db.prepare('SELECT id, file_sha256, file_path, mime, width, height, created_at FROM task_images WHERE id = ?').get(fileId)) as any
  if (!row) return fail(reply, 404, 'NOT_FOUND', '文件不存在')
  const key = gipStorageKey(userId, row.file_path)
  if (!(await storageDriver.exists(key))) return fail(reply, 404, 'NOT_FOUND', '文件不存在')
  audit(request.user, 'view_user_file', userId, request, { fileId })
  const signed = await storageDriver.signGetUrl(key)
  return reply.redirect(signed.url, 302)
})

app.get('/api/admin/logs', { preHandler: requireAdmin }, async () => {
  const logs = mainDb.prepare('SELECT * FROM call_logs ORDER BY created_at DESC LIMIT 200').all()
  return ok({ logs })
})

app.get('/api/admin/dashboard', { preHandler: requireAdmin }, async () => {
  const totalUsers = (mainDb.prepare('SELECT COUNT(*) AS count FROM users').get() as any).count
  const totalCalls = (mainDb.prepare('SELECT COUNT(*) AS count FROM call_logs').get() as any).count
  const errors = (mainDb.prepare("SELECT COUNT(*) AS count FROM call_logs WHERE status != 'success'").get() as any).count
  const recentErrors = mainDb.prepare("SELECT * FROM call_logs WHERE status != 'success' ORDER BY created_at DESC LIMIT 50").all()
  return ok({ totalUsers, totalCalls, errors, recentErrors })
})

app.get('/api/admin/logs.csv', { preHandler: requireAdmin }, async (_request, reply) => {
  const logs = mainDb.prepare('SELECT * FROM call_logs ORDER BY created_at DESC LIMIT 10000').all() as any[]
  const headers = ['created_at','username','provider','model','mode','duration_ms','status','error_code','request_id']
  const csv = [headers.join(','), ...logs.map((row) => headers.map((key) => JSON.stringify(row[key] ?? '')).join(','))].join('\n')
  reply.header('content-type', 'text/csv; charset=utf-8')
  reply.header('content-disposition', 'attachment; filename=call_logs.csv')
  return reply.send(csv)
})

app.get('/api/admin/backup', { preHandler: requireAdmin }, async (request: AuthRequest) => {
  const backupDir = path.join(dataDir, 'backups', `backup-${new Date().toISOString().replace(/[:.]/g, '-')}`)
  await mkdir(backupDir, { recursive: true })
  for (const item of readdirSync(dataDir)) {
    if (item === 'backups') continue
    const source = path.join(dataDir, item)
    const target = path.join(backupDir, item)
    if (statSync(source).isDirectory()) await cp(source, target, { recursive: true })
    else await writeFile(target, await readFile(source))
  }
  const backupsRoot = path.join(dataDir, 'backups')
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
  for (const item of readdirSync(backupsRoot)) {
    const full = path.join(backupsRoot, item)
    if (statSync(full).isDirectory() && statSync(full).mtimeMs < cutoff) rmSync(full, { recursive: true, force: true })
  }
  audit(request.user, 'create_backup', backupDir, request)
  return ok({ path: backupDir })
})

if (existsSync(distDir)) {
  await app.register(fastifyStatic, { root: distDir, prefix: '/' })
  app.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith('/api/')) return fail(reply, 404, 'NOT_FOUND', '接口不存在')
    return reply.sendFile('index.html')
  })
}

app.listen({ port, host })
