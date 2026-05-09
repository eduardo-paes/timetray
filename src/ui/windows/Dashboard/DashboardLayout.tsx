import { useEffect, useState } from 'react'
import { useAppStore } from '../../../app/store/appStore'
import { useServices } from '../../../app/providers/AppProvider'
import { SidebarLeft } from './SidebarLeft'
import { SidebarRight } from './SidebarRight'
import { TaskForm } from '../../components/TaskForm/TaskForm'
import { useTimer } from '../../hooks/useTimer'
import { formatDuration, todayString } from '../../../shared/utils'
import { Task } from '../../../domain/task/Task'
import { HistoryService } from '../../../application/services/HistoryService'
import { DayOverview } from '../../components/DayOverview/DayOverview'
import { SessionRepository } from '../../../infrastructure/persistence/SessionRepository'
import { getDb } from '../../../infrastructure/db/database'

export function DashboardLayout() {
  const store = useAppStore()
  const { taskService, sessionService } = useServices()
  const elapsed = useTimer()
  const [editingTask, setEditingTask] = useState<Task | 'new' | null>(null)

  const activeTask = store.tasks.find((t) => t.id === store.activeSession?.taskId)

  async function loadDayData(dateStr: string) {
    const db = await getDb()
    const sessionRepo = new SessionRepository(db)
    const historyService = new HistoryService(sessionRepo)

    const [sessions, summary] = await Promise.all([
      historyService.getDaySessions(dateStr),
      historyService.getDaySummary(dateStr, store.tasks),
    ])

    store.setDaySessions(sessions)
    store.setDaySummary(summary)
  }

  async function loadCalendar(year: number, month: number) {
    const db = await getDb()
    const sessionRepo = new SessionRepository(db)
    const historyService = new HistoryService(sessionRepo)
    const days = await historyService.getMonthCalendar(year, month, store.tasks)
    store.setCalendarDays(days)
  }

  useEffect(() => {
    if (!store.isReady) return
    loadDayData(store.selectedDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.selectedDate, store.isReady])

  useEffect(() => {
    if (!store.isReady) return
    loadCalendar(store.viewedMonth.year, store.viewedMonth.month)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.viewedMonth.year, store.viewedMonth.month, store.isReady])

  // Reload today when active session changes (new session started)
  useEffect(() => {
    if (!store.isReady) return
    const today = todayString()
    if (store.selectedDate === today) {
      loadDayData(today)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.activeSession?.id])

  async function handleSwitchTask(taskId: string) {
    const session = await sessionService.switchToTask(taskId, 'dashboard')
    store.setActiveSession(session)
  }

  async function handleStopTracking() {
    await sessionService.stopTracking()
    store.setActiveSession(null)
  }

  async function handleCreateTask(data: { name: string; color: string }) {
    const task = await taskService.createTask(data)
    store.upsertTask(task)
    setEditingTask(null)
  }

  async function handleUpdateTask(id: string, data: { name: string; color: string }) {
    const task = await taskService.updateTask(id, data)
    store.upsertTask(task)
    setEditingTask(null)
  }

  async function handleToggleTask(task: Task) {
    const updated = await taskService.toggleTask(task.id, !task.enabled)
    store.upsertTask(updated)
  }

  async function handleDeleteTask(task: Task) {
    if (task.id === store.activeSession?.taskId) return
    await taskService.deleteTask(task.id)
    store.removeTask(task.id)
  }

  function handlePrevMonth() {
    const { year, month } = store.viewedMonth
    if (month === 1) store.setViewedMonth(year - 1, 12)
    else store.setViewedMonth(year, month - 1)
  }

  function handleNextMonth() {
    const { year, month } = store.viewedMonth
    if (month === 12) store.setViewedMonth(year + 1, 1)
    else store.setViewedMonth(year, month + 1)
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      {/* Left sidebar */}
      <aside className="w-64 border-r border-gray-800/60 flex flex-col flex-shrink-0">
        <SidebarLeft
          tasks={store.tasks}
          activeTaskId={store.activeSession?.taskId ?? null}
          selectedDate={store.selectedDate}
          viewedMonth={store.viewedMonth}
          calendarDays={store.calendarDays}
          onSelectDate={store.setSelectedDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onSwitchTask={handleSwitchTask}
          onEditTask={(task) => setEditingTask(task)}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
          onNewTask={() => setEditingTask('new')}
        />
      </aside>

      {/* Main area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5 border-b border-gray-800/60 flex-shrink-0">
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
              Now Tracking
            </div>
            {activeTask ? (
              <div
                className="text-lg font-semibold"
                style={{ color: activeTask.color ?? '#3b82f6' }}
              >
                {activeTask.name}
              </div>
            ) : (
              <div className="text-lg font-semibold text-gray-600">Nothing tracked</div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {store.activeSession && (
              <>
                <div className="text-4xl font-mono font-bold tabular-nums text-white tracking-tight">
                  {formatDuration(elapsed)}
                </div>
                <button
                  onClick={handleStopTracking}
                  className="px-3 py-1.5 text-xs border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 rounded-lg transition-colors"
                >
                  Stop
                </button>
              </>
            )}
          </div>
        </header>

        {/* Task switch buttons */}
        <div className="px-8 py-4 flex gap-2 flex-wrap border-b border-gray-800/40 flex-shrink-0">
          {store.tasks
            .filter((t) => t.enabled)
            .map((task) => {
              const isActive = task.id === store.activeSession?.taskId
              return (
                <button
                  key={task.id}
                  onClick={() => !isActive && handleSwitchTask(task.id)}
                  disabled={isActive}
                  className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors
                  ${
                    isActive
                      ? 'bg-blue-600/20 border border-blue-500/40 text-blue-300 cursor-default'
                      : 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600 cursor-pointer'
                  }
                `}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: task.color ?? '#6b7280' }}
                  />
                  {task.name}
                  {isActive && <span className="text-[10px] text-blue-400 animate-pulse">▶</span>}
                </button>
              )
            })}
        </div>

        <DayOverview summary={store.daySummary} />
      </main>

      {/* Right sidebar */}
      <aside className="w-64 border-l border-gray-800/60 flex flex-col flex-shrink-0">
        <SidebarRight
          summary={store.daySummary}
          daySessions={store.daySessions}
          tasks={store.tasks}
          selectedDate={store.selectedDate}
        />
      </aside>

      {/* Task form modal */}
      {editingTask && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setEditingTask(null)}
        >
          <div className="w-96">
            <TaskForm
              initial={editingTask === 'new' ? undefined : editingTask}
              onSave={async (data) => {
                if (editingTask === 'new') await handleCreateTask(data)
                else await handleUpdateTask(editingTask.id, data)
              }}
              onCancel={() => setEditingTask(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
