import Database from '@tauri-apps/plugin-sql'
import { Task, TaskRow, rowToTask } from '../../domain/task/Task'
import { generateId, nowIso } from '../../shared/utils'

export class TaskRepository {
  constructor(private db: Database) {}

  async findAll(): Promise<Task[]> {
    const rows = await this.db.select<TaskRow[]>(
      'SELECT * FROM tasks ORDER BY task_order ASC, created_at ASC',
    )
    return rows.map(rowToTask)
  }

  async findById(id: string): Promise<Task | null> {
    const rows = await this.db.select<TaskRow[]>('SELECT * FROM tasks WHERE id = ?', [id])
    return rows[0] ? rowToTask(rows[0]) : null
  }

  async findEnabled(): Promise<Task[]> {
    const rows = await this.db.select<TaskRow[]>(
      'SELECT * FROM tasks WHERE enabled = 1 ORDER BY task_order ASC',
    )
    return rows.map(rowToTask)
  }

  async create(data: { name: string; color?: string; hotkey?: string }): Promise<Task> {
    const maxOrderRows = await this.db.select<Array<{ max_order: number | null }>>(
      'SELECT MAX(task_order) as max_order FROM tasks',
    )
    const nextOrder = (maxOrderRows[0]?.max_order ?? -1) + 1
    const now = nowIso()
    const id = generateId()

    await this.db.execute(
      `INSERT INTO tasks (id, name, color, enabled, task_order, hotkey, created_at, updated_at)
       VALUES (?, ?, ?, 1, ?, ?, ?, ?)`,
      [id, data.name, data.color ?? null, nextOrder, data.hotkey ?? null, now, now],
    )
    return (await this.findById(id))!
  }

  async update(
    id: string,
    data: Partial<Pick<Task, 'name' | 'color' | 'hotkey' | 'enabled' | 'taskOrder'>>,
  ): Promise<Task> {
    const task = (await this.findById(id))!
    const now = nowIso()
    await this.db.execute(
      `UPDATE tasks SET
        name       = ?,
        color      = ?,
        hotkey     = ?,
        enabled    = ?,
        task_order = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        data.name ?? task.name,
        data.color !== undefined ? data.color : task.color,
        data.hotkey !== undefined ? data.hotkey : task.hotkey,
        data.enabled !== undefined ? (data.enabled ? 1 : 0) : task.enabled ? 1 : 0,
        data.taskOrder ?? task.taskOrder,
        now,
        id,
      ],
    )
    return (await this.findById(id))!
  }

  async reorder(orderedIds: string[]): Promise<void> {
    await this.db.execute('BEGIN')
    try {
      for (let i = 0; i < orderedIds.length; i++) {
        await this.db.execute('UPDATE tasks SET task_order = ?, updated_at = ? WHERE id = ?', [
          i,
          nowIso(),
          orderedIds[i],
        ])
      }
      await this.db.execute('COMMIT')
    } catch (e) {
      await this.db.execute('ROLLBACK')
      throw e
    }
  }

  async delete(id: string): Promise<void> {
    await this.db.execute(
      'UPDATE sessions SET ended_at = ? WHERE task_id = ? AND ended_at IS NULL',
      [nowIso(), id],
    )
    await this.db.execute('DELETE FROM tasks WHERE id = ?', [id])
  }

  async count(): Promise<number> {
    const rows = await this.db.select<Array<{ cnt: number }>>('SELECT COUNT(*) as cnt FROM tasks')
    return rows[0]?.cnt ?? 0
  }
}
