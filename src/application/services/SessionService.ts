import { SessionRepository } from '../../infrastructure/persistence/SessionRepository'
import { WorkSession, SessionSource } from '../../domain/session/WorkSession'
import { getDb } from '../../infrastructure/db/database'
import { generateId, nowIso, todayString } from '../../shared/utils'

export class SessionService {
  constructor(private sessionRepo: SessionRepository) {}

  async switchToTask(taskId: string, source: SessionSource = 'tray'): Promise<WorkSession> {
    const db = await getDb()
    const now = nowIso()
    const newId = generateId()

    await db.execute('BEGIN IMMEDIATE')
    try {
      await db.execute(
        "UPDATE sessions SET ended_at = ? WHERE ended_at IS NULL",
        [now]
      )
      await db.execute(
        `INSERT INTO sessions (id, task_id, started_at, ended_at, source, created_at)
         VALUES (?, ?, ?, NULL, ?, ?)`,
        [newId, taskId, now, source, now]
      )
      await db.execute('COMMIT')
    } catch (e) {
      await db.execute('ROLLBACK')
      throw e
    }

    return (await this.sessionRepo.findById(newId))!
  }

  async stopTracking(): Promise<void> {
    const db = await getDb()
    await db.execute(
      "UPDATE sessions SET ended_at = ? WHERE ended_at IS NULL",
      [nowIso()]
    )
  }

  async getActiveSession(): Promise<WorkSession | null> {
    return this.sessionRepo.findActive()
  }

  async getTodaySessions(): Promise<WorkSession[]> {
    return this.sessionRepo.findByDate(todayString())
  }

  async getSessionsByDate(dateStr: string): Promise<WorkSession[]> {
    return this.sessionRepo.findByDate(dateStr)
  }

  async recoverCrashedSessions(appStartTime: string): Promise<number> {
    const db = await getDb()
    const result = await db.execute(
      "UPDATE sessions SET ended_at = ?, source = 'crash_recovery' WHERE ended_at IS NULL AND started_at < ?",
      [appStartTime, appStartTime]
    )
    return result.rowsAffected
  }
}
