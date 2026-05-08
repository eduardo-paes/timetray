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
        group flex items-center gap-2 px-3 py-2 rounded-lg
        transition-colors select-none
        ${
          task.enabled
            ? isActive
              ? 'bg-blue-600/20 border border-blue-500/30 text-blue-300 cursor-default'
              : 'hover:bg-gray-800 text-gray-300 border border-transparent cursor-pointer'
            : 'opacity-40 text-gray-500 border border-transparent cursor-not-allowed'
        }
      `}
      onClick={() => task.enabled && !isActive && onSwitch()}
    >
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: task.color ?? '#6b7280' }}
      />
      <span className="flex-1 text-sm font-medium truncate">{task.name}</span>

      {isActive && <span className="text-[10px] text-blue-400 font-mono animate-pulse">▶</span>}

      <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="text-gray-500 hover:text-gray-300 px-1 py-0.5 rounded text-xs"
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu((v) => !v)
          }}
        >
          ⋯
        </button>
        {showMenu && (
          <div
            className="absolute right-0 top-6 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1 min-w-[130px]"
            onMouseLeave={() => setShowMenu(false)}
          >
            <button
              className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700"
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(false)
                onEdit()
              }}
            >
              Edit
            </button>
            <button
              className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700"
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
                className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-gray-700"
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
