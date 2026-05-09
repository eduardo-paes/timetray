import { useState } from 'react'
import { Task } from '../../../domain/task/Task'

interface Props {
  tasks: Task[]
  activeTaskId: string | null
  onSwitch: (taskId: string) => void
  onEdit: (task: Task) => void
  onToggle: (task: Task) => void
  onDelete: (task: Task) => void
}

export function TaskList({ tasks, activeTaskId, onSwitch, onEdit, onToggle, onDelete }: Props) {
  return (
    <ul className="space-y-1">
      {tasks.map((task) => (
        <TaskListItem
          key={task.id}
          task={task}
          isActive={task.id === activeTaskId}
          onSwitch={() => onSwitch(task.id)}
          onEdit={() => onEdit(task)}
          onToggle={() => onToggle(task)}
          onDelete={() => onDelete(task)}
        />
      ))}
    </ul>
  )
}

function TaskListItem({
  task,
  isActive,
  onSwitch,
  onEdit,
  onToggle,
  onDelete,
}: {
  task: Task
  isActive: boolean
  onSwitch: () => void
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <li
      className={`
        group flex items-center gap-2 px-3 py-2 rounded-[10px]
        transition-colors select-none
        ${
          task.enabled
            ? isActive
              ? 'bg-copper/10 border border-obs-500/40 border-l-2 border-l-copper text-steel-primary cursor-default'
              : 'hover:bg-obs-800 text-steel-secondary hover:text-steel-primary border border-transparent cursor-pointer'
            : 'opacity-30 text-steel-disabled border border-transparent cursor-not-allowed'
        }
      `}
      onClick={() => task.enabled && !isActive && onSwitch()}
    >
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: task.color ?? '#7B8794' }}
      />
      <span className="flex-1 text-sm font-medium truncate">{task.name}</span>

      {isActive && <span className="text-[10px] text-copper font-mono animate-pulse">▶</span>}

      <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="text-steel-disabled hover:text-steel-secondary px-1 py-0.5 rounded text-xs"
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu((v) => !v)
          }}
        >
          ⋯
        </button>
        {showMenu && (
          <div
            className="absolute right-0 top-6 bg-obs-800 border border-obs-500 rounded-[10px] shadow-2xl z-50 py-1 min-w-[130px]"
            onMouseLeave={() => setShowMenu(false)}
          >
            <button
              className="w-full text-left px-3 py-1.5 text-xs text-steel-secondary hover:bg-obs-700 hover:text-steel-primary"
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(false)
                onEdit()
              }}
            >
              Edit
            </button>
            <button
              className="w-full text-left px-3 py-1.5 text-xs text-steel-secondary hover:bg-obs-700 hover:text-steel-primary"
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(false)
                onToggle()
              }}
            >
              {task.enabled ? 'Disable' : 'Enable'}
            </button>
            {!isActive && (
              <button
                className="w-full text-left px-3 py-1.5 text-xs text-[#C75A52] hover:bg-obs-700"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(false)
                  onDelete()
                }}
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  )
}
