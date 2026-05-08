import { create } from 'zustand'
import { Task } from '../../domain/task/Task'
import { WorkSession } from '../../domain/session/WorkSession'
import { DaySummary } from '../../domain/summary/DaySummary'
import { CalendarDay } from '../../domain/calendar/CalendarDay'
import { todayString } from '../../shared/utils'

export interface AppState {
  isReady: boolean
  setReady: (ready: boolean) => void

  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  upsertTask: (task: Task) => void
  removeTask: (id: string) => void

  activeSession: WorkSession | null
  setActiveSession: (session: WorkSession | null) => void

  selectedDate: string
  setSelectedDate: (date: string) => void

  viewedMonth: { year: number; month: number }
  setViewedMonth: (year: number, month: number) => void

  daySummary: DaySummary | null
  setDaySummary: (summary: DaySummary | null) => void

  daySessions: WorkSession[]
  setDaySessions: (sessions: WorkSession[]) => void

  calendarDays: CalendarDay[]
  setCalendarDays: (days: CalendarDay[]) => void

  settings: Record<string, string>
  setSetting: (key: string, value: string) => void

  isLoading: boolean
  setLoading: (loading: boolean) => void
  error: string | null
  setError: (error: string | null) => void
}

const now = new Date()

export const useAppStore = create<AppState>((set) => ({
  isReady: false,
  setReady: (ready) => set({ isReady: ready }),

  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  upsertTask: (task) =>
    set((s) => ({
      tasks: s.tasks.some((t) => t.id === task.id)
        ? s.tasks.map((t) => (t.id === task.id ? task : t))
        : [...s.tasks, task].sort((a, b) => a.taskOrder - b.taskOrder),
    })),
  removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

  activeSession: null,
  setActiveSession: (session) => set({ activeSession: session }),

  selectedDate: todayString(),
  setSelectedDate: (date) => set({ selectedDate: date }),

  viewedMonth: { year: now.getFullYear(), month: now.getMonth() + 1 },
  setViewedMonth: (year, month) => set({ viewedMonth: { year, month } }),

  daySummary: null,
  setDaySummary: (summary) => set({ daySummary: summary }),

  daySessions: [],
  setDaySessions: (daySessions) => set({ daySessions }),

  calendarDays: [],
  setCalendarDays: (days) => set({ calendarDays: days }),

  settings: {},
  setSetting: (key, value) =>
    set((s) => ({ settings: { ...s.settings, [key]: value } })),

  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),
}))
