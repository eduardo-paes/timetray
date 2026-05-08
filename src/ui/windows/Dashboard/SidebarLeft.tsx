import { Calendar } from '../../components/Calendar/Calendar'
import { TaskList } from '../../components/TaskList/TaskList'
import { Task } from '../../../domain/task/Task'
import { CalendarDay } from '../../../domain/calendar/CalendarDay'

interface Props {
  tasks: Task[]
  activeTaskId: string | null
  selectedDate: string
  viewedMonth: { year: number; month: number }
  calendarDays: CalendarDay[]
  onSelectDate: (date: string) => void
  onPrevMonth: () => void
  onNextMonth: () => void
  onSwitchTask: (taskId: string) => void
  onEditTask: (task: Task) => void
  onToggleTask: (task: Task) => void
  onDeleteTask: (task: Task) => void
  onNewTask: () => void
}

export function SidebarLeft(props: Props) {
  return (
    <div className="flex flex-col h-full p-4 gap-5 overflow-hidden">
      <Calendar
        year={props.viewedMonth.year}
        month={props.viewedMonth.month}
        days={props.calendarDays}
        selectedDate={props.selectedDate}
        onSelectDate={props.onSelectDate}
        onPrevMonth={props.onPrevMonth}
        onNextMonth={props.onNextMonth}
      />

      <div className="h-px bg-gray-800 flex-shrink-0" />

      <div className="flex items-center justify-between flex-shrink-0">
        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">
          Tasks
        </span>
        <button
          onClick={props.onNewTask}
          className="text-[11px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded transition-colors"
        >
          + New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <TaskList
          tasks={props.tasks}
          activeTaskId={props.activeTaskId}
          onSwitch={props.onSwitchTask}
          onEdit={props.onEditTask}
          onToggle={props.onToggleTask}
          onDelete={props.onDeleteTask}
        />
      </div>
    </div>
  )
}
