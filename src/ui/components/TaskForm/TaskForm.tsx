import React, { useState } from 'react'
import { Task } from '../../../domain/task/Task'

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
  '#6b7280', '#a855f7', '#f43f5e', '#0ea5e9',
]

interface Props {
  initial?: Task
  onSave: (data: { name: string; color: string }) => Promise<void>
  onCancel: () => void
}

export function TaskForm({ initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [color, setColor] = useState(initial?.color ?? PRESET_COLORS[5])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Task name is required'); return }
    if (name.length > 40) { setError('Max 40 characters'); return }
    setSaving(true)
    setError(null)
    try {
      await onSave({ name: name.trim(), color })
    } catch (err) {
      setError(String(err))
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-5 bg-gray-800 rounded-xl border border-gray-700"
    >
      <h3 className="text-sm font-semibold text-gray-200">
        {initial ? 'Edit Task' : 'New Task'}
      </h3>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Task Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-500"
          placeholder="e.g. Code Review"
          autoFocus
        />
        <div className="text-right text-[10px] text-gray-500 mt-0.5">{name.length}/40</div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-2">Color</label>
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${
                color === c ? 'border-white scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : initial ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}
