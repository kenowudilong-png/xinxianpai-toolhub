#!/usr/bin/env node
import OSS from 'ali-oss';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const dataDir = process.env.DATA_DIR || '/var/lib/xinxianpai-toolhub';
const toolId = process.env.MIGRATE_TOOL_ID || 'gip';
const usersRoot = path.join(dataDir, 'files', 'tools', toolId, 'users');
const manifestDir = process.env.MIGRATE_MANIFEST_DIR || path.join(dataDir, '..', '.local-logs');
const dryRun = process.argv.includes('--dry-run');

const required = ['OSS_REGION', 'OSS_BUCKET', 'OSS_ENDPOINT_INTERNAL', 'OSS_ACCESS_KEY_ID', 'OSS_ACCESS_KEY_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) throw new Error(`Missing OSS env: ${missing.join(', ')}`);

const client = new OSS({
  region: process.env.OSS_REGION,
  bucket: process.env.OSS_BUCKET,
  endpoint: process.env.OSS_ENDPOINT_INTERNAL,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  secure: true,
});

function normalizeKey(value) {
  return path.posix.normalize(value.replace(/\\/g, '/')).replace(/^\.\.(\/|$)/, '').replace(/^\/+/, '');
}

async function listFiles(dir) {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(fullPath));
    else if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

async function sha256File(file) {
  const hash = createHash('sha256');
  await new Promise((resolve, reject) => {
    createReadStream(file).on('data', (chunk) => hash.update(chunk)).on('end', resolve).on('error', reject);
  });
  return hash.digest('hex');
}

await mkdir(manifestDir, { recursive: true });
const startedAt = new Date().toISOString();
const manifestPath = path.join(manifestDir, `oss-migration-${toolId}-${startedAt.replace(/[:.]/g, '-')}${dryRun ? '-dry-run' : ''}.json`);
const rows = [];
let totalBytes = 0;

for (const userId of await readdir(usersRoot).catch(() => [])) {
  const userDir = path.join(usersRoot, userId);
  if (!statSync(userDir).isDirectory()) continue;
  for (const localPath of await listFiles(userDir)) {
    const relativePath = path.relative(userDir, localPath).split(path.sep).join('/');
    const key = normalizeKey(`${toolId}/${userId}/${relativePath}`);
    const size = statSync(localPath).size;
    totalBytes += size;
    const row = { userId, localPath, key, size, status: dryRun ? 'dry-run' : 'pending' };
    if (!dryRun) {
      try {
        await client.put(key, localPath);
        const head = await client.head(key);
        const remoteSize = Number(head.res.headers['content-length'] || 0);
        row.remoteSize = remoteSize;
        row.sha256 = await sha256File(localPath);
        row.status = remoteSize === size ? 'ok' : 'size-mismatch';
      } catch (error) {
        row.status = 'error';
        row.error = error instanceof Error ? error.message : String(error);
      }
    }
    rows.push(row);
  }
}

const summary = {
  toolId,
  dryRun,
  usersRoot,
  startedAt,
  finishedAt: new Date().toISOString(),
  count: rows.length,
  totalBytes,
  ok: rows.filter((row) => row.status === 'ok').length,
  errors: rows.filter((row) => row.status === 'error' || row.status === 'size-mismatch').length,
  rows,
};
await writeFile(manifestPath, JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ manifestPath, count: summary.count, totalBytes: summary.totalBytes, ok: summary.ok, errors: summary.errors, dryRun }, null, 2));
if (!dryRun && summary.errors > 0) process.exit(1);
