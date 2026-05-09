import { TrayIcon } from '@tauri-apps/api/tray'
import { Menu, IconMenuItem, PredefinedMenuItem } from '@tauri-apps/api/menu'
import { exit } from '@tauri-apps/plugin-process'
import { Task } from '../../domain/task/Task'
import { WorkSession, elapsedSeconds } from '../../domain/session/WorkSession'
import { formatDurationShort } from '../../shared/utils'

// --- Icon helpers: canvas → PNG Uint8Array ---

const _colorIconCache = new Map<string, Uint8Array>()

function pngBytes(draw: (ctx: CanvasRenderingContext2D, s: number) => void, size = 14): Uint8Array {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  draw(canvas.getContext('2d')!, size)
  const b64 = canvas.toDataURL('image/png').split(',')[1]
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function colorDotIcon(color: string | null): Uint8Array {
  const c = color ?? '#6b7280'
  if (!_colorIconCache.has(c)) {
    _colorIconCache.set(c, pngBytes((ctx, s) => {
      ctx.beginPath()
      ctx.arc(s / 2, s / 2, s / 2 - 1, 0, Math.PI * 2)
      ctx.fillStyle = c
      ctx.fill()
    }))
  }
  return _colorIconCache.get(c)!
}

let _stopIcon: Uint8Array | undefined
function stopIcon(): Uint8Array {
  return (_stopIcon ??= pngBytes((ctx, s) => {
    const p = 3
    ctx.fillStyle = 'rgba(255,255,255,0.65)'
    ctx.fillRect(p, p, s - 2 * p, s - 2 * p)
  }))
}

let _dashIcon: Uint8Array | undefined
function dashboardIcon(): Uint8Array {
  return (_dashIcon ??= pngBytes((ctx, s) => {
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    const pad = 2, gap = 1, cell = Math.floor((s - 2 * pad - gap) / 2)
    ctx.fillRect(pad, pad, cell, cell)
    ctx.fillRect(pad + cell + gap, pad, cell, cell)
    ctx.fillRect(pad, pad + cell + gap, cell, cell)
    ctx.fillRect(pad + cell + gap, pad + cell + gap, cell, cell)
  }))
}

let _exitIcon: Uint8Array | undefined
function exitIcon(): Uint8Array {
  return (_exitIcon ??= pngBytes((ctx, s) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'
    const cx = s / 2, r = s / 2 - 2
    ctx.beginPath()
    ctx.arc(cx, cx, r, 0.65, Math.PI * 2 - 0.65)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx, 1)
    ctx.lineTo(cx, cx)
    ctx.stroke()
  }))
}

// --- TrayAdapter ---

export class TrayAdapter {
  private tray: TrayIcon | null = null
  private refreshInterval: ReturnType<typeof setInterval> | null = null

  private taskItems = new Map<string, IconMenuItem>()
  private stopItem: IconMenuItem | null = null
  private builtTaskIds: string[] = []

  private onTaskClick?: (taskId: string) => void | Promise<void>
  private onStop?: () => void | Promise<void>

  setHandlers(
    onTaskClick: (taskId: string) => void | Promise<void>,
    onStop: () => void | Promise<void>,
  ): void {
    this.onTaskClick = onTaskClick
    this.onStop = onStop
  }

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
      await tray.setTooltip(`TimeTray — ${activeTask?.name ?? 'Tracking'} ${formatDurationShort(elapsed)}`)
    } else {
      await tray.setTooltip('TimeTray — No active task')
    }
  }

  // Full rebuild: recreates the native menu. Only when task list changes.
  private async fullRebuild(tasks: Task[], activeSession: WorkSession | null): Promise<void> {
    this.taskItems.clear()
    const taskMenuItems: IconMenuItem[] = []

    for (const task of tasks) {
      const isActive = activeSession?.taskId === task.id
      const taskId = task.id
      const item = await IconMenuItem.new({
        id: `task:${taskId}`,
        text: this.taskLabel(task, isActive, activeSession),
        enabled: !isActive,
        icon: colorDotIcon(task.color),
        action: () => { void this.onTaskClick?.(taskId) },
      })
      this.taskItems.set(task.id, item)
      taskMenuItems.push(item)
    }

    this.stopItem = await IconMenuItem.new({
      id: 'tray:stop',
      text: activeSession ? 'Stop Tracking' : 'No Active Task',
      enabled: !!activeSession,
      icon: stopIcon(),
      action: () => { void this.onStop?.() },
    })

    const menu = await Menu.new({
      items: [
        ...taskMenuItems,
        await PredefinedMenuItem.new({ item: 'Separator' }),
        this.stopItem,
        await PredefinedMenuItem.new({ item: 'Separator' }),
        await IconMenuItem.new({
          id: 'tray:show',
          text: 'Open Dashboard',
          icon: dashboardIcon(),
        }),
        await IconMenuItem.new({
          id: 'tray:exit',
          text: 'Exit',
          icon: exitIcon(),
          action: () => { void exit(0) },
        }),
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
