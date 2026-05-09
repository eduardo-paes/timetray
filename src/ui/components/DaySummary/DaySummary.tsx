import { DaySummary as DaySummaryType } from '../../../domain/summary/DaySummary'
import { formatDuration } from '../../../shared/utils'

interface Props {
  summary: DaySummaryType | null
  selectedDate: string
}

export function DaySummary({ summary, selectedDate }: Props) {
  if (!summary || summary.totalSeconds === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-steel-muted text-xs">No sessions on {selectedDate}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-obs-800 rounded-[10px] p-3 border-t-2 border-t-copper/25">
          <div className="text-[10px] text-steel-disabled uppercase tracking-wider mb-1">Total</div>
          <div className="text-xl font-mono font-bold text-steel-primary tabular-nums">
            {formatDuration(summary.totalSeconds)}
          </div>
        </div>
        <div className="bg-obs-800 rounded-[10px] p-3 border-t-2 border-t-copper/25">
          <div className="text-[10px] text-steel-disabled uppercase tracking-wider mb-1">Sessions</div>
          <div className="text-xl font-mono font-bold text-steel-primary tabular-nums">
            {summary.sessionCount}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {summary.taskBreakdown.map(({ task, seconds, percentage }) => (
          <div key={task.id} className="space-y-0.5">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5 text-steel-secondary">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: task.color ?? '#7B8794' }}
                />
                <span className="truncate max-w-[100px]">{task.name}</span>
              </span>
              <span className="text-steel-muted font-mono tabular-nums text-[11px]">
                {formatDuration(seconds)}
              </span>
            </div>
            <div className="h-1.5 bg-obs-400 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: task.color ?? '#7B8794',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
