import { useMemo, useState } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Plus, Trash2 } from 'lucide-react'
import { Activity } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import CardioForm from '../components/forms/CardioForm'
import StatCard from '../components/ui/StatCard'
import EmptyState from '../components/ui/EmptyState'
import { fmtDate, fmtDateFull, isThisWeek } from '../lib/calculations'

const TYPE_COLORS = {
  running: '#fb923c', cycling: '#34d399', tennis: '#a78bfa',
  badminton: '#60a5fa', pickleball: '#f472b6', swimming: '#38bdf8',
  rowing: '#4ade80', other: '#94a3b8',
}

const chartStyle = { fontSize: 11 }

const Tooltip_ = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 10, padding: '8px 12px', fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
      <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: 4 }}>{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color, fontWeight: 500 }}>{p.name}: {p.value} min</p>)}
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

export default function CardioPage() {
  const { cardio, deleteCardio } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [timeRange, setTimeRange] = useState('all')

  const cutoffDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - ({ '1m': 30, '3m': 90, '6m': 180, '1y': 365, all: 99999 }[timeRange] || 99999))
    return d.toISOString().split('T')[0]
  }, [timeRange])

  const filtered = useMemo(() => cardio.filter(e => e.date >= cutoffDate), [cardio, cutoffDate])

  const stats = useMemo(() => {
    const thisWeek = cardio.filter(e => isThisWeek(e.date))
    const types = cardio.reduce((acc, e) => { acc[e.type] = (acc[e.type] || 0) + 1; return acc }, {})
    const favType = Object.entries(types).sort(([, a], [, b]) => b - a)[0]?.[0]
    return {
      thisWeekMin: thisWeek.reduce((s, e) => s + (Number(e.duration) || 0), 0),
      thisWeekSessions: thisWeek.length,
      favType,
      totalSessions: filtered.length,
      totalMins: filtered.reduce((s, e) => s + (Number(e.duration) || 0), 0),
    }
  }, [cardio, filtered])

  const weeklyByType = useMemo(() => {
    const weeks = {}
    for (const e of filtered) {
      const date = new Date(e.date)
      const monday = new Date(date)
      monday.setDate(date.getDate() - ((date.getDay() + 6) % 7))
      const key = fmtDate(monday.toISOString().split('T')[0])
      if (!weeks[key]) weeks[key] = { week: key }
      weeks[key][e.type] = (weeks[key][e.type] || 0) + (Number(e.duration) || 0)
    }
    return Object.values(weeks).sort((a, b) => a.week.localeCompare(b.week))
  }, [filtered])

  const types = [...new Set(filtered.map(e => e.type))]

  const pieData = useMemo(() => {
    const byType = {}
    for (const e of filtered) byType[e.type] = (byType[e.type] || 0) + (Number(e.duration) || 0)
    return Object.entries(byType).map(([name, value]) => ({ name, value }))
  }, [filtered])

  const intensityData = useMemo(() => {
    const dist = {}
    for (const e of filtered) if (e.intensity) dist[e.intensity] = (dist[e.intensity] || 0) + 1
    const total = Object.values(dist).reduce((a, b) => a + b, 0)
    return Object.entries(dist).map(([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count,
      pct: total ? Math.round(count / total * 100) : 0,
    }))
  }, [filtered])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Cardio</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={14} strokeWidth={2.5} /> Log</button>
      </div>

      {cardio.length === 0 ? (
        <EmptyState icon={Activity} title="No cardio logged" description="Track runs, rides, sports and more" action={<button onClick={() => setShowForm(true)} className="btn-primary">Log cardio</button>} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="This week" value={`${stats.thisWeekMin} min`} sub={`${stats.thisWeekSessions} sessions`} icon={Activity} />
            <StatCard label="Favourite" value={stats.favType || '—'} sub="Most logged" />
            <StatCard label="Sessions" value={stats.totalSessions} sub="In range" />
            <StatCard label="Total" value={`${stats.totalMins} min`} sub="In range" />
          </div>

          <SegControl value={timeRange} onChange={setTimeRange} options={['1m', '3m', '6m', '1y', 'all']} />

          {weeklyByType.length > 0 && (
            <section className="card p-5">
              <p className="section-title mb-5">Weekly volume by activity</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyByType} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                  <XAxis dataKey="week" tick={chartStyle} tickLine={false} axisLine={false} />
                  <YAxis tick={chartStyle} tickLine={false} axisLine={false} />
                  <Tooltip content={<Tooltip_ />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {types.map((type, i) => (
                    <Bar key={type} dataKey={type} stackId="a" fill={TYPE_COLORS[type] || '#94a3b8'} radius={i === types.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </section>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pieData.length > 0 && (
              <section className="card p-5">
                <p className="section-title mb-4">By activity type</p>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                      {pieData.map(entry => <Cell key={entry.name} fill={TYPE_COLORS[entry.name] || '#94a3b8'} />)}
                    </Pie>
                    <Tooltip formatter={v => `${v} min`} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </section>
            )}

            {intensityData.length > 0 && (
              <section className="card p-5">
                <p className="section-title mb-5">Intensity distribution</p>
                <div className="space-y-4">
                  {intensityData.map(({ name, pct }) => (
                    <div key={name}>
                      <div className="flex justify-between text-[12px] mb-1.5">
                        <span style={{ color: 'rgb(var(--text-secondary))' }}>{name}</span>
                        <span className="font-medium" style={{ color: 'rgb(var(--text-primary))' }}>{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgb(var(--border))' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: name === 'Easy' ? '#34d399' : name === 'Moderate' ? '#fb923c' : '#f87171',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <section>
            <p className="section-title mb-3">History</p>
            <div className="card divide-y divide-[rgb(var(--border))] max-h-72 overflow-y-auto">
              {[...filtered].sort((a, b) => b.date.localeCompare(a.date)).map(entry => (
                <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5 group">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: TYPE_COLORS[entry.type] || '#94a3b8' }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-medium capitalize" style={{ color: 'rgb(var(--text-primary))' }}>{entry.type}</span>
                    <span className="text-[12px] ml-2" style={{ color: 'rgb(var(--text-tertiary))' }}>{entry.duration} min{entry.intensity ? ` · ${entry.intensity}` : ''}{entry.distance ? ` · ${entry.distance} mi` : ''}</span>
                  </div>
                  <span className="text-[12px] shrink-0" style={{ color: 'rgb(var(--text-tertiary))' }}>{fmtDateFull(entry.date)}</span>
                  <button onClick={() => setDeleteTarget(entry.id)} className="p-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'rgb(var(--text-tertiary))' }} onMouseEnter={e => e.currentTarget.style.color = 'rgb(var(--red))'} onMouseLeave={e => e.currentTarget.style.color = 'rgb(var(--text-tertiary))'}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Log cardio"><CardioForm onSuccess={() => setShowForm(false)} /></Modal>
      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteCardio(deleteTarget)} title="Delete entry" message="Delete this cardio session?" />
    </div>
  )
}
