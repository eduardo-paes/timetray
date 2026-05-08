export type SessionSource = 'tray' | 'hotkey' | 'dashboard' | 'crash_recovery'

export interface WorkSession {
  id: string
  taskId: string
  startedAt: string
  endedAt: string | null
  source: SessionSource
  createdAt: string
}

export interface WorkSessionRow {
  id: string
  task_id: string
  started_at: string
  ended_at: string | null
  source: string
  created_at: string
}

export function rowToSession(row: WorkSessionRow): WorkSession {
  return {
    id: row.id,
    taskId: row.task_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    source: row.source as SessionSource,
    createdAt: row.created_at,
  }
}

export function elapsedSeconds(session: WorkSession): number {
  const start = new Date(session.startedAt).getTime()
  const end = session.endedAt ? new Date(session.endedAt).getTime() : Date.now()
  return Math.floor((end - start) / 1000)
}
