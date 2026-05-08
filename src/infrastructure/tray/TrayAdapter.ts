import { TrayIcon } from '@tauri-apps/api/tray'
import { Menu, MenuItem, PredefinedMenuItem } from '@tauri-apps/api/menu'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { Task } from '../../domain/task/Task'
import { WorkSession, elapsedSeconds } from '../../domain/session/WorkSession'
import { formatDurationShort } from '../../shared/utils'

export type OnTaskSwitch = (taskId: string) => Promise<void>
export type OnStop = () => Promise<void>

export class TrayAdapter {
  private tray: TrayIcon | null = null
  private refreshInterval: ReturnType<typeof setInterval> | null = null

  async init(): Promise<void> {
    try {
      this.tray = await TrayIcon.getById('timetray-main')
    } catch {
      // Tray not found; will retry on first rebuild
    }
  }

  private async getTray(): Promise<TrayIcon | null> {
    if (this.tray) return this.tray
    try {
      this.tray = await TrayIcon.getById('timetray-main')
    } catch {
      // ignore
    }
    return this.tray
  }

  async rebuild(
    tasks: Task[],
    activeSession: WorkSession | null,
    onSwitch: OnTaskSwitch,
    onStop: OnStop
  ): Promise<void> {
    try {
      const enabledTasks = tasks.filter((t) => t.enabled)

      const taskItems = await Promise.all(
        enabledTasks.map(async (task) => {
          const isActive = activeSession?.taskId === task.id
          const elapsed = isActive ? elapsedSeconds(activeSession!) : 0
          const timer = isActive ? `  ${formatDurationShort(elapsed)}` : ''
          const prefix = isActive ? '▶  ' : '    '
          const label = `${prefix}${task.name}${timer}`

          return MenuItem.new({
            text: label,
            enabled: !isActive,
            action: async () => {
              await onSwitch(task.id)
            },
          })
        })
      )

      const sep1 = await PredefinedMenuItem.new({ item: 'Separator' })
      const sep2 = await PredefinedMenuItem.new({ item: 'Separator' })

      const stopItem = await MenuItem.new({
        text: activeSession ? 'Stop Tracking' : 'No Active Task',
        enabled: !!activeSession,
        action: async () => {
          await onStop()
        },
      })

      const showItem = await MenuItem.new({
        text: 'Open Dashboard',
        action: async () => {
          const win = getCurrentWindow()
          await win.show()
          await win.setFocus()
        },
      })

      const quitItem = await PredefinedMenuItem.new({ item: 'Quit' })

      const menu = await Menu.new({
        items: [...taskItems, sep1, stopItem, sep2, showItem, quitItem],
      })

      const tray = await this.getTray()
      if (tray) {
        await tray.setMenu(menu)
        if (activeSession) {
          const activeTask = tasks.find((t) => t.id === activeSession.taskId)
          const elapsed = elapsedSeconds(activeSession)
          await tray.setTooltip(
            `TimeTray — ${activeTask?.name ?? 'Tracking'} ${formatDurationShort(elapsed)}`
          )
        } else {
          await tray.setTooltip('TimeTray — No active task')
        }
      }
    } catch (err) {
      console.error('[TrayAdapter] rebuild error:', err)
    }
  }

  startRefreshLoop(
    getState: () => { tasks: Task[]; activeSession: WorkSession | null },
    onSwitch: OnTaskSwitch,
    onStop: OnStop
  ): void {
    if (this.refreshInterval) return
    this.refreshInterval = setInterval(async () => {
      const { tasks, activeSession } = getState()
      await this.rebuild(tasks, activeSession, onSwitch, onStop)
    }, 1000)
  }

  stopRefreshLoop(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
    }
  }
}

export const trayAdapter = new TrayAdapter()
