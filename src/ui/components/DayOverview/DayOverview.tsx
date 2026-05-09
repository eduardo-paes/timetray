import { DaySummary } from '../../../domain/summary/DaySummary'
import { formatDuration } from '../../../shared/utils'

interface Props {
  summary: DaySummary | null
}

export function DayOverview({ summary }: Props) {
  if (!summary || summary.totalSeconds === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-700 text-sm">
        <p>Select a day in the calendar or switch tasks above.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 max-w-sm">
        <div className="bg-gray-800/60 rounded-lg p-4">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Total</div>
          <div className="text-2xl font-mono font-bold text-white tabular-nums">
            {formatDuration(summary.totalSeconds)}
          </div>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-4">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Sessions</div>
          <div className="text-2xl font-mono font-bold text-white tabular-nums">
            {summary.sessionCount}
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="space-y-3">
        <div className="text-[10px] text-gray-500 uppercase tracking-widest">Time per Task</div>
        <div className="space-y-3">
          {summary.taskBreakdown.map(({ task, seconds, percentage }) => (
            <div key={task.id} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 text-gray-300">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: task.color ?? '#6b7280' }}
                  />
                  <span>{task.name}</span>
                </span>
                <span className="text-gray-400 font-mono tabular-nums">
                  {formatDuration(seconds)}
                  <span className="text-gray-600 ml-2">{percentage}%</span>
                </span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
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
    </div>
  )
}
