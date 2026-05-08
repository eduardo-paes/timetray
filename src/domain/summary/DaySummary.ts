export interface TaskBreakdownItem {
  task: { id: string; name: string; color: string | null }
  seconds: number
  percentage: number
}

export interface DaySummary {
  date: string
  totalSeconds: number
  taskBreakdown: TaskBreakdownItem[]
  sessionCount: number
  longestStreak: number
}
