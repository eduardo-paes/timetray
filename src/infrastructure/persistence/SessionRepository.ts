import Database from '@tauri-apps/plugin-sql'
import { WorkSession, WorkSessionRow, rowToSession } from '../../domain/session/WorkSession'
import { generateId, nowIso } from '../../shared/utils'

export class SessionRepository {
  constructor(private db: Database) {}

  async findActive(): Promise<WorkSession | null> {
    const rows = await this.db.select<WorkSessionRow[]>(
      'SELECT * FROM sessions WHERE ended_at IS NULL ORDER BY started_at DESC LIMIT 1',
    )
    return rows[0] ? rowToSession(rows[0]) : null
  }

  async findById(id: string): Promise<WorkSession | null> {
    const rows = await this.db.select<WorkSessionRow[]>('SELECT * FROM sessions WHERE id = ?', [id])
    return rows[0] ? rowToSession(rows[0]) : null
  }

  async findByDate(dateStr: string): Promise<WorkSession[]> {
    const rows = await this.db.select<WorkSessionRow[]>(
      `SELECT * FROM sessions
       WHERE started_at >= ? AND started_at < ?
       ORDER BY started_at ASC`,
      [`${dateStr}T00:00:00.000Z`, `${dateStr}T23:59:59.999Z`],
    )
    return rows.map(rowToSession)
  }

  async findByDateRange(fromDate: string, toDate: string): Promise<WorkSession[]> {
    const rows = await this.db.select<WorkSessionRow[]>(
      `SELECT * FROM sessions
       WHERE started_at >= ? AND started_at <= ?
       ORDER BY started_at ASC`,
      [`${fromDate}T00:00:00.000Z`, `${toDate}T23:59:59.999Z`],
    )
    return rows.map(rowToSession)
  }

  async switchToTask(taskId: string, source: WorkSession['source']): Promise<WorkSession> {
    const now = nowIso()
    const newId = generateId()

    await this.db.execute('UPDATE sessions SET ended_at = ? WHERE ended_at IS NULL', [now])
    await this.db.execute(
      `INSERT INTO sessions (id, task_id, started_at, ended_at, source, created_at)
       VALUES (?, ?, ?, NULL, ?, ?)`,
      [newId, taskId, now, source, now],
    )

    return (await this.findById(newId))!
  }

  async start(taskId: string, source: WorkSession['source']): Promise<WorkSession> {
    const now = nowIso()
    const id = generateId()
    await this.db.execute(
      `INSERT INTO sessions (id, task_id, started_at, ended_at, source, created_at)
       VALUES (?, ?, ?, NULL, ?, ?)`,
      [id, taskId, now, source, now],
    )
    return (await this.findById(id))!
  }

  async end(sessionId: string): Promise<WorkSession> {
    await this.db.execute('UPDATE sessions SET ended_at = ? WHERE id = ?', [nowIso(), sessionId])
    return (await this.findById(sessionId))!
  }

  async endAll(): Promise<void> {
    await this.db.execute('UPDATE sessions SET ended_at = ? WHERE ended_at IS NULL', [nowIso()])
  }

  async recoverCrashedSessions(appStartTime: string): Promise<number> {
    const result = await this.db.execute(
      "UPDATE sessions SET ended_at = ?, source = 'crash_recovery' WHERE ended_at IS NULL AND started_at < ?",
      [appStartTime, appStartTime],
    )
    return result.rowsAffected
  }
}
