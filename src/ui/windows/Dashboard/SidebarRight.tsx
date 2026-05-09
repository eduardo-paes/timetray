import { DaySummary } from '../../components/DaySummary/DaySummary'
import { SessionTimeline } from '../../components/SessionTimeline/SessionTimeline'
import { DaySummary as DaySummaryType } from '../../../domain/summary/DaySummary'
import { WorkSession } from '../../../domain/session/WorkSession'
import { Task } from '../../../domain/task/Task'
import { todayString } from '../../../shared/utils'

interface Props {
  summary: DaySummaryType | null
  daySessions: WorkSession[]
  tasks: Task[]
  selectedDate: string
}

export function SidebarRight({ summary, daySessions, tasks, selectedDate }: Props) {
  const isToday = selectedDate === todayString()

  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-hidden">
      <div className="flex-shrink-0">
        <div className="text-[10px] text-steel-disabled uppercase tracking-widest font-medium mb-3">
          {isToday ? "Today's Summary" : selectedDate}
        </div>
        <DaySummary summary={summary} selectedDate={selectedDate} />
      </div>

      <div className="h-px bg-obs-400 flex-shrink-0" />

      <div className="flex-shrink-0">
        <div className="text-[10px] text-steel-disabled uppercase tracking-widest font-medium mb-2">
          Sessions
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <SessionTimeline sessions={daySessions} tasks={tasks} />
      </div>
    </div>
  )
}
