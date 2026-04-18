import { useState } from 'react'
import toast from 'react-hot-toast'
import { useApp } from '../../context/AppContext'
import { generateId, todayISO } from '../../lib/utils'

const CARDIO_TYPES = ['running', 'cycling', 'tennis', 'badminton', 'pickleball', 'swimming', 'rowing', 'other']
const INTENSITY = [
  { value: 'easy', label: 'Easy' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'hard', label: 'Hard' },
]

export default function CardioForm({ onSuccess }) {
  const { addCardio } = useApp()
  const [date, setDate] = useState(todayISO())
  const [type, setType] = useState('running')
  const [duration, setDuration] = useState('')
  const [intensity, setIntensity] = useState('')
  const [distance, setDistance] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!duration) { toast.error('Enter duration'); return }
    setSaving(true)
    await addCardio({
      id: generateId('cardio'),
      date,
      type,
      duration: Number(duration),
      intensity: intensity || null,
      distance: distance ? Number(distance) : null,
      notes,
      lastModified: Date.now(),
      synced: false,
    })
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} logged`)
    setDuration('')
    setIntensity('')
    setDistance('')
    setNotes('')
    setSaving(false)
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Duration (min)</label>
          <input
            type="number"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            placeholder="30"
            className="input"
            min="1"
            autoFocus
          />
        </div>
      </div>

      {/* Type pills */}
      <div>
        <label className="label">Activity</label>
        <div className="flex flex-wrap gap-1.5">
          {CARDIO_TYPES.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium capitalize transition-all"
              style={{
                background: type === t ? 'rgb(var(--text-primary))' : 'rgb(var(--surface-raised))',
                color: type === t ? 'rgb(var(--bg))' : 'rgb(var(--text-secondary))',
                border: `1px solid ${type === t ? 'rgb(var(--text-primary))' : 'rgb(var(--border))'}`,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Intensity */}
      <div>
        <label className="label">Intensity <span style={{ color: 'rgb(var(--text-tertiary))' }}>(optional)</span></label>
        <div className="flex gap-2">
          {INTENSITY.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setIntensity(intensity === value ? '' : value)}
              className="flex-1 py-2 rounded-lg text-[12px] font-medium transition-all"
              style={{
                background: intensity === value ? 'rgb(var(--text-primary))' : 'rgb(var(--surface))',
                color: intensity === value ? 'rgb(var(--bg))' : 'rgb(var(--text-secondary))',
                border: `1px solid ${intensity === value ? 'rgb(var(--text-primary))' : 'rgb(var(--border))'}`,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Distance (miles) <span style={{ color: 'rgb(var(--text-tertiary))' }}>(optional)</span></label>
        <input
          type="number"
          value={distance}
          onChange={e => setDistance(e.target.value)}
          placeholder="3.0"
          className="input"
          step="0.1" min="0"
        />
      </div>

      <div>
        <label className="label">Notes <span style={{ color: 'rgb(var(--text-tertiary))' }}>(optional)</span></label>
        <input
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="How did it feel?"
          className="input"
        />
      </div>

      <button type="submit" disabled={saving} className="btn-primary w-full">
        {saving ? 'Saving…' : 'Log cardio'}
      </button>
    </form>
  )
}
