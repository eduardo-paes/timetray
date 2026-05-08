export interface TaskSlice {
  taskId: string
  taskName: string
  color: string | null
  seconds: number
}

export interface CalendarDay {
  date: string
  totalSeconds: number
  taskBreakdown: TaskSlice[]
  hasActivity: boolean
}
