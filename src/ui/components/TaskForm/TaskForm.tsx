import React, { useState } from 'react'
import { Task } from '../../../domain/task/Task'

const PRESET_COLORS = [
  '#E05C5C',
  '#E0844A',
  '#D4A843',
  '#4CAF85',
  '#4AABB5',
  '#4E7EFF',
  '#8B6FD8',
  '#D46FAA',
  '#7B8794',
  '#C87A2B',
  '#C75A52',
  '#4E9EE0',
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
    if (!name.trim()) {
      setError('Task name is required')
      return
    }
    if (name.length > 40) {
      setError('Max 40 characters')
      return
    }
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
      className="space-y-4 p-5 bg-obs-800 rounded-[12px] border border-obs-500"
    >
      <h3 className="text-sm font-semibold text-steel-primary">{initial ? 'Edit Task' : 'New Task'}</h3>

      <div>
        <label className="block text-xs text-steel-muted mb-1">Task Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          className="w-full bg-obs-900 text-steel-primary rounded-[8px] px-3 py-2 text-sm border border-obs-500 focus:border-copper focus:outline-none placeholder-steel-disabled"
          placeholder="e.g. Code Review"
          autoFocus
        />
        <div className="text-right text-[10px] text-steel-disabled mt-0.5">{name.length}/40</div>
      </div>

      <div>
        <label className="block text-xs text-steel-muted mb-2">Color</label>
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${
                color === c ? 'border-copper scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {error && <p className="text-[#C75A52] text-xs">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-steel-muted hover:text-steel-primary transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm bg-copper hover:bg-copper-bright text-obs-950 font-medium rounded-[8px] disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : initial ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}
