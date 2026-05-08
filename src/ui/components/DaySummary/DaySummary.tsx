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
        <p className="text-gray-500 text-xs">No sessions on {selectedDate}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-800/60 rounded-lg p-3">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Total</div>
          <div className="text-xl font-mono font-bold text-white tabular-nums">
            {formatDuration(summary.totalSeconds)}
          </div>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-3">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Sessions</div>
          <div className="text-xl font-mono font-bold text-white tabular-nums">
            {summary.sessionCount}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {summary.taskBreakdown.map(({ task, seconds, percentage }) => (
          <div key={task.id} className="space-y-0.5">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5 text-gray-300">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: task.color ?? '#6b7280' }}
                />
                <span className="truncate max-w-[100px]">{task.name}</span>
              </span>
              <span className="text-gray-400 font-mono tabular-nums text-[11px]">
                {formatDuration(seconds)}
              </span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: task.color ?? '#6b7280',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
