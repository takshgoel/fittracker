import { useState } from 'react'
import toast from 'react-hot-toast'
import { useApp } from '../../context/AppContext'
import { todayISO, convertWeight } from '../../lib/utils'

export default function WeightForm({ onSuccess }) {
  const { addWeight, weight: entries } = useApp()
  const [date, setDate] = useState(todayISO())
  const [weight, setWeight] = useState('')
  const [inputUnit, setInputUnit] = useState('lbs')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const existing = entries.find(e => e.date === date)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!weight || isNaN(weight)) { toast.error('Enter a valid weight'); return }

    setSaving(true)
    const storedWeight = convertWeight(Number(weight), inputUnit, 'lbs')
    await addWeight({
      id: `wt_${date.replace(/-/g, '')}`,
      date,
      weight: storedWeight,
      unit: 'lbs',
      notes,
      lastModified: Date.now(),
      synced: false,
    })
    toast.success(`Weight logged`)
    setWeight('')
    setNotes('')
    setSaving(false)
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="label">Date</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />
        {existing && (
          <p className="text-[12px] mt-1.5" style={{ color: 'rgb(var(--accent))' }}>
            Entry exists for this date ({existing.weight} lbs) — will be overwritten
          </p>
        )}
      </div>

      <div>
        <label className="label">Weight</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            placeholder="134.5"
            className="input flex-1"
            step="0.1" min="50" max="500"
            autoFocus
          />
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgb(var(--border))' }}>
            {['lbs', 'kg'].map(u => (
              <button
                key={u}
                type="button"
                onClick={() => setInputUnit(u)}
                className="px-3 py-2 text-[13px] font-medium transition-colors"
                style={{
                  background: inputUnit === u ? 'rgb(var(--text-primary))' : 'rgb(var(--surface))',
                  color: inputUnit === u ? 'rgb(var(--bg))' : 'rgb(var(--text-secondary))',
                }}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
        {weight && !isNaN(weight) && (
          <p className="text-[12px] mt-1.5" style={{ color: 'rgb(var(--text-tertiary))' }}>
            ≈ {convertWeight(Number(weight), inputUnit, inputUnit === 'lbs' ? 'kg' : 'lbs').toFixed(1)}{' '}
            {inputUnit === 'lbs' ? 'kg' : 'lbs'}
          </p>
        )}
      </div>

      <div>
        <label className="label">Notes <span style={{ color: 'rgb(var(--text-tertiary))' }}>(optional)</span></label>
        <input
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="e.g. morning fasted"
          className="input"
        />
      </div>

      <button type="submit" disabled={saving} className="btn-primary w-full">
        {saving ? 'Saving…' : 'Log weight'}
      </button>
    </form>
  )
}
