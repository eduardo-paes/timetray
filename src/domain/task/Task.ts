export interface Task {
  id: string
  name: string
  color: string | null
  enabled: boolean
  taskOrder: number
  hotkey: string | null
  createdAt: string
  updatedAt: string
}

export interface TaskRow {
  id: string
  name: string
  color: string | null
  enabled: number
  task_order: number
  hotkey: string | null
  created_at: string
  updated_at: string
}

export function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    enabled: row.enabled === 1,
    taskOrder: row.task_order,
    hotkey: row.hotkey,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
