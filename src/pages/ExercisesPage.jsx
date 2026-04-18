import { useMemo, useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Plus, Trash2, Trophy, AlertTriangle } from 'lucide-react'
import { Dumbbell } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ExerciseForm from '../components/forms/ExerciseForm'
import EmptyState from '../components/ui/EmptyState'
import { sessionMax1RM, sessionVolume, weeklyVolume, detectPlateaus, fmtDate, fmtDateFull } from '../lib/calculations'

const chartStyle = { fontSize: 11 }

const Tooltip_ = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgb(var(--surface))',
      border: '1px solid rgb(var(--border))',
      borderRadius: 10,
      padding: '8px 12px',
      fontSize: 12,
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    }}>
      <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: 4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, fontWeight: 500 }}>
          {p.name}: {p.value} lbs
        </p>
      ))}
    </div>
  )
}

function SegControl({ value, onChange, options }) {
  return (
    <div className="seg-control">
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)} className={`seg-btn ${value === o ? 'active' : ''}`}>{o}</button>
      ))}
    </div>
  )
}

export default function ExercisesPage() {
  const { exercises, deleteExercise } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const [timeRange, setTimeRange] = useState('all')

  const exerciseNames = useMemo(() =>
    [...new Set(exercises.map(e => e.exercise))].sort(), [exercises])

  const activeExercise = selectedExercise || exerciseNames[0] || ''

  const cutoffDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - ({ '1m': 30, '3m': 90, '6m': 180, '1y': 365, all: 99999 }[timeRange] || 99999))
    return d.toISOString().split('T')[0]
  }, [timeRange])

  const { sessions, oneRMData, volumeData } = useMemo(() => {
    if (!activeExercise) return { sessions: [], oneRMData: [], volumeData: [] }
    const sessions = exercises
      .filter(e => e.exercise === activeExercise && e.date >= cutoffDate)
      .sort((a, b) => a.date.localeCompare(b.date))
    const oneRMData = sessions.map(s => ({
      date: fmtDate(s.date),
      '1RM': sessionMax1RM(s.sets),
      'Top set': Math.max(...s.sets.map(st => st.weight)),
    }))
    const volumeData = weeklyVolume(
      exercises.filter(e => e.exercise === activeExercise && e.date >= cutoffDate)
    ).map(w => ({ week: fmtDate(w.week), volume: w.volume }))
    return { sessions, oneRMData, volumeData }
  }, [exercises, activeExercise, cutoffDate])

  const maxRM = oneRMData.length ? Math.max(...oneRMData.map(d => d['1RM'])) : 0
  const plateaus = useMemo(() => detectPlateaus(exercises), [exercises])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Exercises</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={14} strokeWidth={2.5} /> Log
        </button>
      </div>

      {exercises.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No exercises logged"
          description="Log your first workout to start seeing progress charts"
          action={<button onClick={() => setShowForm(true)} className="btn-primary">Log exercise</button>}
        />
      ) : (
        <>
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={activeExercise}
              onChange={e => setSelectedExercise(e.target.value)}
              className="input flex-1 min-w-40"
            >
              {exerciseNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <SegControl value={timeRange} onChange={setTimeRange} options={['1m', '3m', '6m', '1y', 'all']} />
          </div>

          {/* 1RM chart */}
          {oneRMData.length > 0 && (
            <section className="card p-5">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="section-title">Estimated 1RM</p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'rgb(var(--text-tertiary))' }}>{activeExercise}</p>
                </div>
                <div className="text-right">
                  <p className="text-[20px] font-semibold tracking-tight" style={{ color: 'rgb(var(--accent))' }}>{maxRM} lbs</p>
                  <p className="text-[11px]" style={{ color: 'rgb(var(--text-tertiary))' }}>all-time max</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={oneRMData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                  <XAxis dataKey="date" tick={chartStyle} tickLine={false} axisLine={false} />
                  <YAxis tick={chartStyle} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <Tooltip content={<Tooltip_ />} />
                  <Line type="monotone" dataKey="1RM" stroke="rgb(var(--accent))" strokeWidth={2} dot={{ r: 3, fill: 'rgb(var(--accent))' }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="Top set" stroke="rgb(var(--border))" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-[11px] mt-3" style={{ color: 'rgb(var(--text-tertiary))' }}>
                Epley formula: weight × (1 + reps / 30) · Dashed = top set weight
              </p>
            </section>
          )}

          {/* Volume chart */}
          {volumeData.length > 0 && (
            <section className="card p-5">
              <p className="section-title mb-5">Weekly Volume — {activeExercise}</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={volumeData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                  <XAxis dataKey="week" tick={chartStyle} tickLine={false} axisLine={false} />
                  <YAxis tick={chartStyle} tickLine={false} axisLine={false} />
                  <Tooltip content={<Tooltip_ />} />
                  <Bar dataKey="volume" fill="rgb(var(--text-primary))" radius={[3, 3, 0, 0]} opacity={0.85} name="Volume (lbs)" />
                </BarChart>
              </ResponsiveContainer>
            </section>
          )}

          {/* Plateau alerts */}
          {plateaus.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} strokeWidth={1.75} style={{ color: 'rgb(var(--text-tertiary))' }} />
                <h2 className="section-title">Plateaus detected</h2>
              </div>
              <div className="card divide-y divide-[rgb(var(--border))]">
                {plateaus.map(p => (
                  <div key={p.exercise} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-[13px] font-medium" style={{ color: 'rgb(var(--text-primary))' }}>{p.exercise}</p>
                      <p className="text-[12px] mt-0.5" style={{ color: 'rgb(var(--text-tertiary))' }}>No PR in 21+ days · last {fmtDate(p.lastDate)}</p>
                    </div>
                    <button
                      onClick={() => setSelectedExercise(p.exercise)}
                      className="text-[12px] font-medium"
                      style={{ color: 'rgb(var(--text-secondary))' }}
                    >
                      View →
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Sessions */}
          <section>
            <p className="section-title mb-3">{activeExercise} — sessions</p>
            <div className="space-y-2">
              {sessions.slice().reverse().slice(0, showAll ? 999 : 8).map(entry => (
                <div
                  key={entry.id}
                  className="card px-4 py-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[12px]" style={{ color: 'rgb(var(--text-secondary))' }}>{fmtDateFull(entry.date)}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] font-medium" style={{ color: 'rgb(var(--accent))' }}>
                        {sessionMax1RM(entry.sets)} lbs est. 1RM
                      </span>
                      <button
                        onClick={() => setDeleteTarget(entry.id)}
                        className="p-1"
                        style={{ color: 'rgb(var(--text-tertiary))' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'rgb(var(--red))'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgb(var(--text-tertiary))'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.sets.map((set, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md"
                        style={{
                          background: 'rgb(var(--surface-raised))',
                          color: 'rgb(var(--text-secondary))',
                          border: '1px solid rgb(var(--border))',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {set.reps}×{set.weight}
                      </span>
                    ))}
                  </div>
                  {entry.notes && (
                    <p className="text-[12px] mt-2 italic" style={{ color: 'rgb(var(--text-tertiary))' }}>{entry.notes}</p>
                  )}
                </div>
              ))}
              {sessions.length > 8 && (
                <button
                  onClick={() => setShowAll(v => !v)}
                  className="text-[12px] font-medium"
                  style={{ color: 'rgb(var(--text-secondary))' }}
                >
                  {showAll ? 'Show less' : `Show all ${sessions.length} sessions`}
                </button>
              )}
            </div>
          </section>
        </>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Log exercise">
        <ExerciseForm onSuccess={() => setShowForm(false)} />
      </Modal>
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteExercise(deleteTarget)}
        title="Delete entry"
        message="Delete this exercise session? This can't be undone."
      />
    </div>
  )
}
