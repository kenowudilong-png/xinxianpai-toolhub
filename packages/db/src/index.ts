import Database from "better-sqlite3";
import { dirname } from "node:path";
import { mkdirSync } from "node:fs";

export type MainDatabase = Database.Database;

export function openMainDatabase(dataDir: string): MainDatabase {
  mkdirSync(dataDir, { recursive: true });
  const db = new Database(`${dataDir}/main.sqlite`);
  db.pragma("journal_mode = WAL");
  migrateMainDatabase(db);
  return db;
}

export function openUserToolDatabase(path: string): MainDatabase {
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS tool_events (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      type TEXT NOT NULL,
      payload TEXT NOT NULL
    );
  `);
  return db;
}

function migrateMainDatabase(db: MainDatabase) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
      disabled INTEGER NOT NULL DEFAULT 0,
      must_change_password INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      last_login_at TEXT
    );

    CREATE TABLE IF NOT EXISTS api_configs (
      id TEXT PRIMARY KEY,
      provider TEXT,
      model TEXT,
      base_url TEXT NOT NULL,
      encrypted_key TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS usage_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      tool_id TEXT NOT NULL,
      provider TEXT,
      model TEXT,
      status TEXT NOT NULL,
      duration_ms INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      actor_user_id TEXT,
      action TEXT NOT NULL,
      target TEXT,
      created_at TEXT NOT NULL
    );


    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      level TEXT NOT NULL DEFAULT info CHECK(level IN (info, success, warning, danger)),
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS announcement_reads (
      user_id TEXT NOT NULL,
      announcement_id TEXT NOT NULL,
      read_at TEXT NOT NULL,
      PRIMARY KEY (user_id, announcement_id),
      FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE
    );
  `);

  ensureColumn(db, "announcements", "published_at", "TEXT");
  ensureColumn(db, "announcements", "pinned", "INTEGER NOT NULL DEFAULT 0");
  db.prepare("UPDATE announcements SET published_at = created_at WHERE published_at IS NULL OR published_at = ''").run();
  ensureColumn(db, "users", "display_name", "TEXT");
  ensureColumn(db, "api_configs", "tool_id", "TEXT");
  ensureColumn(db, "api_configs", "note", "TEXT");
  ensureColumn(db, "api_configs", "models_json", "TEXT");
  ensureColumn(db, "api_configs", "updated_at", "TEXT");
  db.exec(`
    CREATE TABLE IF NOT EXISTS tools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '🧰',
      path TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      tutorial_intro TEXT NOT NULL DEFAULT '',
      tutorial_content TEXT NOT NULL DEFAULT '',
      open_mode TEXT NOT NULL DEFAULT 'embedded' CHECK(open_mode IN ('embedded', 'new_tab')),
      visibility TEXT NOT NULL DEFAULT 'all' CHECK(visibility IN ('all', 'admin')),
      sort_order INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  ensureColumn(db, "tools", "tutorial_intro", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "tools", "tutorial_content", "TEXT NOT NULL DEFAULT ''");

  const now = new Date().toISOString();
  db.prepare(`INSERT OR IGNORE INTO tools (id, name, icon, path, description, tutorial_intro, tutorial_content, open_mode, visibility, sort_order, enabled, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run("gip", "生图站", "🎨", "/tools/gip", "文生图 / 改图 / 参考图", "文生图 / 改图 / 参考图", "📖 能做什么\n· 根据文字描述生成图片\n· 支持参考图与改图工作流\n\n🚀 怎么用(分步)\n1. 进入生图站\n2. 输入提示词或上传参考图\n3. 点击生成并查看历史\n\n💡 小技巧 / 注意\n· 提示词越具体，结果越稳定\n· 不要在提示词中包含敏感信息", "embedded", "all", 10, 1, now, now);
  db.prepare(`INSERT OR IGNORE INTO tools (id, name, icon, path, description, tutorial_intro, tutorial_content, open_mode, visibility, sort_order, enabled, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run("chat", "对话助手", "💬", "/tools/chat", "团队对话", "团队对话", "📖 能做什么\n· 帮助团队快速整理想法和文案\n· 支持日常问答与协作讨论\n\n🚀 怎么用(分步)\n1. 打开对话助手\n2. 输入问题或任务背景\n3. 复制结果并按需修改\n\n💡 小技巧 / 注意\n· 给出明确角色、目标和格式要求", "embedded", "all", 20, 1, now, now);
  db.prepare(`INSERT OR IGNORE INTO tools (id, name, icon, path, description, tutorial_intro, tutorial_content, open_mode, visibility, sort_order, enabled, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run("kb", "知识库", "📚", "/tools/kb", "文档问答", "文档问答", "📖 能做什么\n· 围绕内部资料进行问答\n· 帮助快速定位知识点\n\n🚀 怎么用(分步)\n1. 打开知识库\n2. 输入要查询的问题\n3. 查看答案并回到原文确认\n\n💡 小技巧 / 注意\n· 问题越具体，检索越准确", "embedded", "all", 30, 1, now, now);

  db.prepare("UPDATE tools SET tutorial_intro = description WHERE tutorial_intro IS NULL OR tutorial_intro = ''").run();
  db.prepare("UPDATE tools SET tutorial_content = printf('📖 能做什么\n· %s\n\n🚀 怎么用(分步)\n1. 打开工具\n2. 按页面提示输入内容\n\n💡 小技巧 / 注意\n· 如无法使用，请联系管理员', COALESCE(NULLIF(description, ''), name)) WHERE tutorial_content IS NULL OR tutorial_content = ''").run();
  db.prepare("UPDATE users SET display_name = username WHERE display_name IS NULL OR display_name = ''").run();
  db.prepare("UPDATE api_configs SET tool_id = 'gip' WHERE tool_id IS NULL OR tool_id = ''").run();
  db.prepare("UPDATE api_configs SET note = provider WHERE note IS NULL").run();
  db.prepare("UPDATE api_configs SET models_json = json_array(COALESCE(NULLIF(model, ''), 'gpt-image-1')) WHERE models_json IS NULL OR models_json = ''").run();
  db.prepare("UPDATE api_configs SET updated_at = created_at WHERE updated_at IS NULL").run();
}

function ensureColumn(db: MainDatabase, table: string, column: string, definition: string) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!rows.some(row => row.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
