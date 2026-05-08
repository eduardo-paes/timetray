import { getDb } from '../../infrastructure/db/database'
import { TaskRepository } from '../../infrastructure/persistence/TaskRepository'
import { SessionRepository } from '../../infrastructure/persistence/SessionRepository'
import { TaskService } from '../../application/services/TaskService'
import { SessionService } from '../../application/services/SessionService'
import { nowIso } from '../../shared/utils'

export interface AppServices {
  taskService: TaskService
  sessionService: SessionService
}

export async function initializeApp(): Promise<AppServices> {
  const appStartTime = nowIso()

  const db = await getDb()

  const taskRepo = new TaskRepository(db)
  const sessionRepo = new SessionRepository(db)

  const taskService = new TaskService(taskRepo)
  const sessionService = new SessionService(sessionRepo)

  const recovered = await sessionService.recoverCrashedSessions(appStartTime)
  if (recovered > 0) {
    console.warn(`[TimeTray] Crash recovery: closed ${recovered} unclosed session(s)`)
  }

  await taskService.seedIfEmpty()

  return { taskService, sessionService }
}
