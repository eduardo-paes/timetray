import { SessionRepository } from '../../infrastructure/persistence/SessionRepository'
import { WorkSession, SessionSource } from '../../domain/session/WorkSession'
import { todayString } from '../../shared/utils'

export class SessionService {
  constructor(private sessionRepo: SessionRepository) {}

  async switchToTask(taskId: string, source: SessionSource = 'tray'): Promise<WorkSession> {
    return this.sessionRepo.switchToTask(taskId, source)
  }

  async stopTracking(): Promise<void> {
    this.sessionRepo.endAll()
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
    return this.sessionRepo.recoverCrashedSessions(appStartTime)
  }
}
