import { SessionRepository } from '../../infrastructure/persistence/SessionRepository'
import { CalendarDay, TaskSlice } from '../../domain/calendar/CalendarDay'
import { DaySummary } from '../../domain/summary/DaySummary'
import { Task } from '../../domain/task/Task'
import { WorkSession, elapsedSeconds } from '../../domain/session/WorkSession'

export class HistoryService {
  constructor(private sessionRepo: SessionRepository) {}

  async getDaySessions(dateStr: string): Promise<WorkSession[]> {
    return this.sessionRepo.findByDate(dateStr)
  }

  async getDaySummary(dateStr: string, tasks: Task[]): Promise<DaySummary> {
    const sessions = await this.sessionRepo.findByDate(dateStr)
    const taskMap = new Map(tasks.map((t) => [t.id, t]))

    const byTask = new Map<string, number>()
    let totalSeconds = 0

    for (const s of sessions) {
      const secs = elapsedSeconds(s)
      totalSeconds += secs
      byTask.set(s.taskId, (byTask.get(s.taskId) ?? 0) + secs)
    }

    const taskBreakdown = Array.from(byTask.entries())
      .map(([taskId, seconds]) => ({
        task: taskMap.get(taskId) ?? { id: taskId, name: 'Unknown', color: null },
        seconds,
        percentage: totalSeconds > 0 ? Math.round((seconds / totalSeconds) * 100) : 0,
      }))
      .sort((a, b) => b.seconds - a.seconds)

    return {
      date: dateStr,
      totalSeconds,
      taskBreakdown,
      sessionCount: sessions.length,
      longestStreak: this.computeLongestStreak(sessions),
    }
  }

  async getMonthCalendar(year: number, month: number, tasks: Task[]): Promise<CalendarDay[]> {
    const fromDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const toDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const sessions = await this.sessionRepo.findByDateRange(fromDate, toDate)
    const taskMap = new Map(tasks.map((t) => [t.id, t]))

    const byDate = new Map<string, WorkSession[]>()
    for (const s of sessions) {
      const d = s.startedAt.slice(0, 10)
      if (!byDate.has(d)) byDate.set(d, [])
      byDate.get(d)!.push(s)
    }

    const days: CalendarDay[] = []
    for (let d = 1; d <= lastDay; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const daySessions = byDate.get(dateStr) ?? []
      const byTask = new Map<string, number>()
      let totalSeconds = 0

      for (const s of daySessions) {
        const secs = elapsedSeconds(s)
        totalSeconds += secs
        byTask.set(s.taskId, (byTask.get(s.taskId) ?? 0) + secs)
      }

      const taskBreakdown: TaskSlice[] = Array.from(byTask.entries()).map(([taskId, seconds]) => {
        const task = taskMap.get(taskId)
        return { taskId, taskName: task?.name ?? 'Unknown', color: task?.color ?? null, seconds }
      })

      days.push({ date: dateStr, totalSeconds, taskBreakdown, hasActivity: totalSeconds > 0 })
    }
    return days
  }

  private computeLongestStreak(sessions: WorkSession[]): number {
    let longest = 0
    for (const s of sessions) {
      const secs = elapsedSeconds(s)
      if (secs > longest) longest = secs
    }
    return longest
  }
}
