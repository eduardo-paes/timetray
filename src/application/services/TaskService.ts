import { TaskRepository } from '../../infrastructure/persistence/TaskRepository'
import { Task } from '../../domain/task/Task'

const SEED_TASKS = [
  { name: 'PR Review',      color: '#3b82f6' },
  { name: 'Meeting',        color: '#ef4444' },
  { name: 'Jira Ticket',   color: '#eab308' },
  { name: 'Ticket Review',  color: '#22c55e' },
  { name: 'Break',          color: '#6b7280' },
]

export class TaskService {
  constructor(private taskRepo: TaskRepository) {}

  async getAllTasks(): Promise<Task[]> {
    return this.taskRepo.findAll()
  }

  async getEnabledTasks(): Promise<Task[]> {
    return this.taskRepo.findEnabled()
  }

  async seedIfEmpty(): Promise<void> {
    const count = await this.taskRepo.count()
    if (count > 0) return
    for (const seed of SEED_TASKS) {
      await this.taskRepo.create(seed)
    }
  }

  async createTask(data: { name: string; color?: string; hotkey?: string }): Promise<Task> {
    if (!data.name.trim()) throw new Error('Task name cannot be empty')
    if (data.name.length > 40) throw new Error('Task name must be 40 characters or less')
    return this.taskRepo.create(data)
  }

  async updateTask(
    id: string,
    data: Partial<Pick<Task, 'name' | 'color' | 'hotkey' | 'enabled' | 'taskOrder'>>
  ): Promise<Task> {
    if (data.name !== undefined) {
      if (!data.name.trim()) throw new Error('Task name cannot be empty')
      if (data.name.length > 40) throw new Error('Task name must be 40 characters or less')
    }
    return this.taskRepo.update(id, data)
  }

  async deleteTask(id: string): Promise<void> {
    return this.taskRepo.delete(id)
  }

  async reorderTasks(orderedIds: string[]): Promise<void> {
    return this.taskRepo.reorder(orderedIds)
  }

  async toggleTask(id: string, enabled: boolean): Promise<Task> {
    return this.taskRepo.update(id, { enabled })
  }
}
