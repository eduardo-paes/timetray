import { WorkSession, elapsedSeconds } from '../../../domain/session/WorkSession'
import { Task } from '../../../domain/task/Task'
import { formatDuration } from '../../../shared/utils'
import { useTimer } from '../../hooks/useTimer'
import { useAppStore } from '../../../app/store/appStore'

interface Props {
  sessions: WorkSession[]
  tasks: Task[]
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function SessionTimeline({ sessions, tasks }: Props) {
  const taskMap = new Map(tasks.map((t) => [t.id, t]))
  const activeSession = useAppStore((s) => s.activeSession)
  const liveElapsed = useTimer()

  if (sessions.length === 0) {
    return <p className="text-steel-muted text-xs text-center py-4">No sessions</p>
  }

  return (
    <div className="space-y-1 overflow-y-auto">
      {[...sessions].reverse().map((session) => {
        const task = taskMap.get(session.taskId)
        const isActive = session.id === activeSession?.id
        const secs = isActive ? liveElapsed : elapsedSeconds(session)

        return (
          <div
            key={session.id}
            className={`flex items-center gap-2 px-2.5 py-2 rounded-[8px] text-xs transition-colors ${
              isActive
                ? 'bg-copper/[0.08] border border-copper/30'
                : 'bg-obs-800/50 hover:bg-obs-800'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: task?.color ?? '#7B8794' }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-steel-secondary truncate font-medium">{task?.name ?? 'Unknown'}</div>
              <div className="text-steel-disabled text-[10px]">
                {formatTime(session.startedAt)}
                {session.endedAt ? ` – ${formatTime(session.endedAt)}` : ' – now'}
              </div>
            </div>
            <span className="text-steel-muted font-mono tabular-nums text-[11px] flex-shrink-0">
              {formatDuration(secs)}
            </span>
            {isActive && (
              <span className="text-copper text-[9px] animate-pulse flex-shrink-0">●</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
