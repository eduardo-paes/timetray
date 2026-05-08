import Database from '@tauri-apps/plugin-sql'

let _db: Database | null = null

export async function getDb(): Promise<Database> {
  if (_db) return _db
  _db = await Database.load('sqlite:timetray.db')
  await runMigrations(_db)
  return _db
}

const MIGRATIONS: Array<{ version: number; sql: string }> = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS tasks (
        id         TEXT PRIMARY KEY,
        name       TEXT NOT NULL UNIQUE,
        color      TEXT,
        enabled    INTEGER NOT NULL DEFAULT 1,
        task_order INTEGER NOT NULL,
        hotkey     TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id         TEXT PRIMARY KEY,
        task_id    TEXT NOT NULL,
        started_at TEXT NOT NULL,
        ended_at   TEXT,
        source     TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(task_id) REFERENCES tasks(id)
      );

      CREATE TABLE IF NOT EXISTS settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_task_id    ON sessions(task_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
      CREATE INDEX IF NOT EXISTS idx_sessions_ended_at   ON sessions(ended_at);
    `,
  },
  {
    version: 2,
    sql: `
      INSERT OR IGNORE INTO settings (key, value) VALUES
        ('theme', 'system'),
        ('startWithSystem', 'false'),
        ('restoreLastTask', 'false'),
        ('showTimerInTray', 'true'),
        ('confirmOnQuit', 'false');
    `,
  },
]

async function runMigrations(db: Database): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY)
  `)

  const rows = await db.select<Array<{ version: number }>>(
    'SELECT COALESCE(MAX(version), 0) as version FROM schema_version'
  )
  let currentVersion = rows[0]?.version ?? 0

  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      await db.execute(migration.sql)
      await db.execute(
        'INSERT OR REPLACE INTO schema_version (version) VALUES (?)',
        [migration.version]
      )
      currentVersion = migration.version
    }
  }
}
