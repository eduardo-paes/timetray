import { DaySummary } from '../../../domain/summary/DaySummary'
import { formatDuration } from '../../../shared/utils'

interface Props {
  summary: DaySummary | null
}

export function DayOverview({ summary }: Props) {
  if (!summary || summary.totalSeconds === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-steel-disabled text-sm">
        <p>Select a day in the calendar or switch tasks above.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 max-w-sm">
        <div className="bg-obs-800 rounded-[10px] p-4 border-t-2 border-t-copper/25">
          <div className="text-[10px] text-steel-disabled uppercase tracking-wider mb-1">Total</div>
          <div className="text-2xl font-mono font-bold text-steel-primary tabular-nums">
            {formatDuration(summary.totalSeconds)}
          </div>
        </div>
        <div className="bg-obs-800 rounded-[10px] p-4 border-t-2 border-t-copper/25">
          <div className="text-[10px] text-steel-disabled uppercase tracking-wider mb-1">Sessions</div>
          <div className="text-2xl font-mono font-bold text-steel-primary tabular-nums">
            {summary.sessionCount}
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="space-y-3">
        <div className="text-[10px] text-steel-disabled uppercase tracking-widest">Time per Task</div>
        <div className="space-y-3">
          {summary.taskBreakdown.map(({ task, seconds, percentage }) => (
            <div key={task.id} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 text-steel-secondary">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: task.color ?? '#7B8794' }}
                  />
                  <span>{task.name}</span>
                </span>
                <span className="text-steel-muted font-mono tabular-nums">
                  {formatDuration(seconds)}
                  <span className="text-steel-disabled ml-2">{percentage}%</span>
                </span>
              </div>
              <div className="h-2.5 bg-obs-400 rounded-full overflow-hidden">
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
    </div>
  )
}
