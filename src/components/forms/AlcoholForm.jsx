import { useState } from 'react'
import toast from 'react-hot-toast'
import { useApp } from '../../context/AppContext'
import { generateId, todayISO } from '../../lib/utils'

const DRINK_TYPES = ['beer', 'wine', 'liquor', 'cocktail', 'other']

export default function AlcoholForm({ onSuccess }) {
  const { addAlcohol } = useApp()
  const [date, setDate] = useState(todayISO())
  const [drinks, setDrinks] = useState('')
  const [type, setType] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!drinks || Number(drinks) < 1) { toast.error('Enter number of drinks'); return }
    setSaving(true)
    await addAlcohol({
      id: generateId('alc'),
      date,
      drinks: Number(drinks),
      type: type || null,
      notes,
      lastModified: Date.now(),
      synced: false,
    })
    toast.success(`Logged ${drinks} drink${Number(drinks) > 1 ? 's' : ''}`)
    setDrinks('')
    setType('')
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
          <label className="label">Drinks</label>
          <input
            type="number"
            value={drinks}
            onChange={e => setDrinks(e.target.value)}
            placeholder="2"
            className="input"
            min="1" max="20"
            autoFocus
          />
        </div>
      </div>

      <div>
        <label className="label">Type <span style={{ color: 'rgb(var(--text-tertiary))' }}>(optional)</span></label>
        <div className="flex flex-wrap gap-1.5">
          {DRINK_TYPES.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(type === t ? '' : t)}
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

      <div>
        <label className="label">Notes <span style={{ color: 'rgb(var(--text-tertiary))' }}>(optional)</span></label>
        <input
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="e.g. birthday party"
          className="input"
        />
      </div>

      <button type="submit" disabled={saving} className="btn-primary w-full">
        {saving ? 'Saving…' : 'Log drinks'}
      </button>
    </form>
  )
}
