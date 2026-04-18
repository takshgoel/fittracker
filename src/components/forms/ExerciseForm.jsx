import { useState, useRef, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useApp } from '../../context/AppContext'
import { EXERCISE_LIST } from '../../data/seedData'
import { generateId, todayISO } from '../../lib/utils'

const defaultSet = () => ({ reps: '', weight: '', unit: 'lbs', notes: '' })

function loadCustom() {
  try { return JSON.parse(localStorage.getItem('custom_exercises') || '[]') } catch { return [] }
}
function saveCustom(list) {
  localStorage.setItem('custom_exercises', JSON.stringify(list))
}

export default function ExerciseForm({ onSuccess }) {
  const { addExercise } = useApp()
  const [date, setDate] = useState(todayISO())
  const [exercise, setExercise] = useState('')
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [sets, setSets] = useState([defaultSet()])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [customExercises, setCustomExercises] = useState(loadCustom)
  const dropdownRef = useRef(null)

  const allExercises = [...new Set([...EXERCISE_LIST, ...customExercises])].sort()
  const filtered = allExercises.filter(e => e.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
  const showCustom = query && !allExercises.some(e => e.toLowerCase() === query.toLowerCase())
  const options = showCustom ? [...filtered, query] : filtered

  useEffect(() => {
    const handler = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function selectExercise(name) {
    setExercise(name)
    setQuery(name)
    setShowDropdown(false)
    if (!EXERCISE_LIST.some(e => e.toLowerCase() === name.toLowerCase()) &&
        !customExercises.some(e => e.toLowerCase() === name.toLowerCase())) {
      const updated = [...customExercises, name].sort()
      setCustomExercises(updated)
      saveCustom(updated)
    }
    setTimeout(() => document.getElementById('set-reps-0')?.focus(), 50)
  }

  function updateSet(i, field, value) {
    setSets(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  function addSet() {
    const last = sets[sets.length - 1]
    setSets(prev => [...prev, { ...defaultSet(), weight: last.weight, unit: last.unit }])
  }

  function removeSet(i) {
    if (sets.length === 1) return
    setSets(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!exercise) { toast.error('Pick an exercise'); return }
    const validSets = sets.filter(s => s.reps && s.weight)
    if (!validSets.length) { toast.error('Add at least one set'); return }

    setSaving(true)
    await addExercise({
      id: generateId('ex'),
      date,
      exercise,
      sets: validSets.map(s => ({ ...s, reps: Number(s.reps), weight: Number(s.weight) })),
      notes,
      lastModified: Date.now(),
      synced: false,
    })
    toast.success(`${exercise} logged`)
    setSets([defaultSet()])
    setNotes('')
    setSaving(false)
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Date */}
      <div>
        <label className="label">Date</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />
      </div>

      {/* Exercise picker */}
      <div ref={dropdownRef}>
        <label className="label">Exercise</label>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setExercise(e.target.value); setShowDropdown(true) }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search or type exercise…"
            className="input"
            autoComplete="off"
          />
          {showDropdown && options.length > 0 && (
            <div
              className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden"
              style={{
                background: 'rgb(var(--surface))',
                border: '1px solid rgb(var(--border))',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              }}
            >
              {options.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onMouseDown={() => selectExercise(opt)}
                  className="w-full text-left px-3.5 py-2.5 text-[13px] transition-colors"
                  style={{ color: 'rgb(var(--text-primary))' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgb(var(--surface-raised))'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {opt === query && showCustom
                    ? <span style={{ color: 'rgb(var(--accent))' }}>Add "{opt}"</span>
                    : opt
                  }
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sets */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Sets</label>
          <span className="text-[11px]" style={{ color: 'rgb(var(--text-tertiary))' }}>Reps · Weight (lbs)</span>
        </div>
        <div className="space-y-2">
          {sets.map((set, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className="w-5 text-center text-[11px] font-medium shrink-0"
                style={{ color: 'rgb(var(--text-tertiary))' }}
              >
                {i + 1}
              </span>
              <input
                id={`set-reps-${i}`}
                type="number"
                placeholder="Reps"
                value={set.reps}
                onChange={e => updateSet(i, 'reps', e.target.value)}
                className="input w-20 text-center"
                min="1" max="100"
              />
              <input
                type="number"
                placeholder="Weight"
                value={set.weight}
                onChange={e => updateSet(i, 'weight', e.target.value)}
                className="input flex-1 text-center"
                min="0" step="2.5"
              />
              <button
                type="button"
                onClick={() => removeSet(i)}
                className="p-1.5 rounded-lg transition-colors shrink-0"
                style={{ color: 'rgb(var(--text-tertiary))' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgb(var(--red))'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgb(var(--text-tertiary))'}
                tabIndex={-1}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addSet}
          className="mt-2.5 flex items-center gap-1.5 text-[12px] font-medium"
          style={{ color: 'rgb(var(--text-secondary))' }}
        >
          <Plus size={14} strokeWidth={2.5} /> Add set
        </button>
      </div>

      {/* Session notes */}
      <div>
        <label className="label">Notes <span style={{ color: 'rgb(var(--text-tertiary))' }}>(optional)</span></label>
        <input
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="e.g. shoulder felt tight"
          className="input"
        />
      </div>

      <button type="submit" disabled={saving} className="btn-primary w-full">
        {saving ? 'Saving…' : 'Log exercise'}
      </button>
    </form>
  )
}
