#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { createRequire } = require('module')
const appRequire = createRequire(path.join(__dirname, '../apps/gip-team/package.json'))
const OSS = appRequire('ali-oss')
const Database = appRequire('better-sqlite3')

const shouldDelete = process.argv.includes('--delete')
const root = process.env.DATA_DIR ? path.join(process.env.DATA_DIR, 'users') : '/var/lib/xinxianpai-toolhub/users'
const bucket = process.env.OSS_BUCKET
if (process.env.STORAGE_DRIVER !== 'oss') {
  console.error('STORAGE_DRIVER is not oss; aborting')
  process.exit(1)
}
const client = new OSS({
  region: process.env.OSS_REGION,
  bucket,
  endpoint: process.env.OSS_ENDPOINT_INTERNAL,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
})

function collectReferences() {
  const referenced = new Set()
  if (!fs.existsSync(root)) return referenced
  for (const userId of fs.readdirSync(root)) {
    const dbPath = path.join(root, userId, 'gip.sqlite')
    if (!fs.existsSync(dbPath)) continue
    const db = new Database(dbPath, { readonly: true })
    const tables = new Set(db.prepare("select name from sqlite_master where type='table'").all().map((row) => row.name))
    if (tables.has('task_images')) {
      for (const row of db.prepare('select file_path from task_images').all()) referenced.add(`gip/${userId}/${row.file_path}`)
    }
    if (tables.has('uploads')) {
      for (const row of db.prepare('select file_path from uploads').all()) referenced.add(`gip/${userId}/${row.file_path}`)
    }
    db.close()
  }
  return referenced
}

async function listObjects() {
  const objects = []
  let marker
  do {
    const result = await client.list({ prefix: 'gip/', marker, 'max-keys': 1000 })
    for (const object of result.objects || []) objects.push(object)
    marker = result.nextMarker
  } while (marker)
  return objects
}

async function main() {
  const referenced = collectReferences()
  const objects = await listObjects()
  const orphans = objects.filter((object) => !referenced.has(object.name))
  console.log(JSON.stringify({ bucket, objectCount: objects.length, referencedCount: referenced.size, orphanCount: orphans.length, orphans: orphans.map((object) => ({ name: object.name, size: object.size, lastModified: object.lastModified })) }, null, 2))
  if (shouldDelete) {
    for (const object of orphans) await client.delete(object.name)
    console.log(`Deleted ${orphans.length} orphan OSS object(s).`)
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
