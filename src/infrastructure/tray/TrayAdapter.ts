import { TrayIcon } from '@tauri-apps/api/tray'
import { Menu, MenuItem, PredefinedMenuItem } from '@tauri-apps/api/menu'
import { Task } from '../../domain/task/Task'
import { WorkSession, elapsedSeconds } from '../../domain/session/WorkSession'
import { formatDurationShort } from '../../shared/utils'

export class TrayAdapter {
  private tray: TrayIcon | null = null
  private refreshInterval: ReturnType<typeof setInterval> | null = null

  private taskItems = new Map<string, MenuItem>()
  private stopItem: MenuItem | null = null
  private builtTaskIds: string[] = []

  async init(): Promise<void> {
    try {
      this.tray = await TrayIcon.getById('timetray-main')
    } catch {
      // will retry on first rebuild
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

  private taskLabel(task: Task, isActive: boolean, activeSession: WorkSession | null): string {
    const elapsed = isActive ? elapsedSeconds(activeSession!) : 0
    const timer = isActive ? `  ${formatDurationShort(elapsed)}` : ''
    const prefix = isActive ? '▶  ' : '    '
    return `${prefix}${task.name}${timer}`
  }

  private async updateTooltip(tasks: Task[], activeSession: WorkSession | null): Promise<void> {
    const tray = await this.getTray()
    if (!tray) return
    if (activeSession) {
      const activeTask = tasks.find((t) => t.id === activeSession.taskId)
      const elapsed = elapsedSeconds(activeSession)
      await tray.setTooltip(
        `TimeTray — ${activeTask?.name ?? 'Tracking'} ${formatDurationShort(elapsed)}`,
      )
    } else {
      await tray.setTooltip('TimeTray — No active task')
    }
  }

  // Full rebuild: recreates the native menu. Only when task list changes.
  private async fullRebuild(tasks: Task[], activeSession: WorkSession | null): Promise<void> {
    this.taskItems.clear()
    const taskMenuItems: MenuItem[] = []

    for (const task of tasks) {
      const isActive = activeSession?.taskId === task.id
      const item = await MenuItem.new({
        id: `task:${task.id}`,
        text: this.taskLabel(task, isActive, activeSession),
        enabled: !isActive,
      })
      this.taskItems.set(task.id, item)
      taskMenuItems.push(item)
    }

    this.stopItem = await MenuItem.new({
      id: 'tray:stop',
      text: activeSession ? 'Stop Tracking' : 'No Active Task',
      enabled: !!activeSession,
    })

    const menu = await Menu.new({
      items: [
        ...taskMenuItems,
        await PredefinedMenuItem.new({ item: 'Separator' }),
        this.stopItem,
        await PredefinedMenuItem.new({ item: 'Separator' }),
        await MenuItem.new({ id: 'tray:show', text: 'Open Dashboard' }),
        await PredefinedMenuItem.new({ item: 'Quit' }),
      ],
    })

    const tray = await this.getTray()
    if (tray) await tray.setMenu(menu)
    await this.updateTooltip(tasks, activeSession)
  }

  // Light update: setText/setEnabled on cached items — does NOT call setMenu(),
  // so an open tray menu is never dismissed by the 1-second tick.
  private async updateItems(tasks: Task[], activeSession: WorkSession | null): Promise<void> {
    for (const task of tasks) {
      const item = this.taskItems.get(task.id)
      if (!item) continue
      const isActive = activeSession?.taskId === task.id
      await item.setText(this.taskLabel(task, isActive, activeSession))
      await item.setEnabled(!isActive)
    }
    if (this.stopItem) {
      await this.stopItem.setText(activeSession ? 'Stop Tracking' : 'No Active Task')
      await this.stopItem.setEnabled(!!activeSession)
    }
    await this.updateTooltip(tasks, activeSession)
  }

  async rebuild(tasks: Task[], activeSession: WorkSession | null): Promise<void> {
    try {
      const enabled = tasks.filter((t) => t.enabled)
      const ids = enabled.map((t) => t.id)
      const needsFull = ids.join('\0') !== this.builtTaskIds.join('\0')

      if (needsFull) {
        await this.fullRebuild(enabled, activeSession)
        this.builtTaskIds = ids
      } else {
        await this.updateItems(enabled, activeSession)
      }
    } catch (err) {
      console.error('[TrayAdapter] rebuild error:', err)
    }
  }

  startRefreshLoop(getState: () => { tasks: Task[]; activeSession: WorkSession | null }): void {
    if (this.refreshInterval) return
    this.refreshInterval = setInterval(async () => {
      const { tasks, activeSession } = getState()
      await this.rebuild(tasks, activeSession)
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
