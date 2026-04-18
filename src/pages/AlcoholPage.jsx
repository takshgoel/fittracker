import { useMemo, useState } from 'react'
import { BarChart, Bar, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Plus, Trash2 } from 'lucide-react'
import { Wine } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import AlcoholForm from '../components/forms/AlcoholForm'
import StatCard from '../components/ui/StatCard'
import EmptyState from '../components/ui/EmptyState'
import { weeklyAlcohol, fmtDate, fmtDateFull, isThisWeek } from '../lib/calculations'

const chartStyle = { fontSize: 11 }

const Tooltip_ = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 10, padding: '8px 12px', fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
      <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: 4 }}>{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color, fontWeight: 500 }}>{p.name}: {p.value}</p>)}
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

export default function AlcoholPage() {
  const { alcohol, exercises, deleteAlcohol } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [timeRange, setTimeRange] = useState('all')

  const cutoffDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - ({ '1m': 30, '3m': 90, '6m': 180, '1y': 365, all: 99999 }[timeRange] || 99999))
    return d.toISOString().split('T')[0]
  }, [timeRange])

  const filtered = useMemo(() => alcohol.filter(e => e.date >= cutoffDate), [alcohol, cutoffDate])

  const stats = useMemo(() => {
    const thisWeek = alcohol.filter(e => isThisWeek(e.date))
    const thisWeekDrinks = thisWeek.reduce((sum, e) => sum + (Number(e.drinks) || 0), 0)
    const totalDrinks = filtered.reduce((sum, e) => sum + (Number(e.drinks) || 0), 0)
    const avgPerWeek = filtered.length
      ? (totalDrinks / Math.max(weeklyAlcohol(filtered).length, 1)).toFixed(1)
      : 0
    return { thisWeekDrinks, totalDrinks, avgPerWeek }
  }, [alcohol, filtered])

  const weeklyAlcData = useMemo(() =>
    weeklyAlcohol(filtered).map(w => ({ ...w, week: fmtDate(w.week) })),
    [filtered]
  )

  const correlationData = useMemo(() => {
    const alcByWeek = {}
    for (const entry of filtered) {
      const date = new Date(entry.date)
      const monday = new Date(date)
      monday.setDate(date.getDate() - ((date.getDay() + 6) % 7))
      const key = monday.toISOString().split('T')[0]
      alcByWeek[key] = (alcByWeek[key] || 0) + (Number(entry.drinks) || 0)
    }
    const volByWeek = {}
    for (const entry of exercises) {
      const date = new Date(entry.date)
      const monday = new Date(date)
      monday.setDate(date.getDate() - ((date.getDay() + 6) % 7))
      const key = monday.toISOString().split('T')[0]
      volByWeek[key] = (volByWeek[key] || 0) + entry.sets.reduce((s, set) => s + set.reps * set.weight, 0)
    }
    const weeks = new Set([...Object.keys(alcByWeek), ...Object.keys(volByWeek)])
    return [...weeks].sort().filter(w => w >= cutoffDate).map(w => ({
      week: fmtDate(w),
      drinks: alcByWeek[w] || 0,
      volume: Math.round((volByWeek[w] || 0) / 1000),
    }))
  }, [filtered, exercises, cutoffDate])

  const correlationInsight = useMemo(() => {
    const highs = correlationData.filter(d => d.drinks >= 3)
    const lows = correlationData.filter(d => d.drinks < 3 && d.drinks >= 0)
    if (highs.length < 2 || lows.length < 2) return null
    const highAvgVol = highs.reduce((s, d) => s + d.volume, 0) / highs.length
    const lowAvgVol = lows.reduce((s, d) => s + d.volume, 0) / lows.length
    if (lowAvgVol === 0) return null
    const diff = Math.round((1 - highAvgVol / lowAvgVol) * 100)
    if (diff > 0) return `Weeks with 3+ drinks show ~${diff}% lower training volume`
    return null
  }, [correlationData])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Alcohol</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={14} strokeWidth={2.5} /> Log</button>
      </div>

      {alcohol.length === 0 ? (
        <EmptyState icon={Wine} title="No drinks logged" description="Track drinks to see correlation with training performance" action={<button onClick={() => setShowForm(true)} className="btn-primary">Log drinks</button>} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="This week" value={stats.thisWeekDrinks} sub="drinks" icon={Wine} />
            <StatCard label="Avg / week" value={stats.avgPerWeek} sub="drinks" />
            <StatCard label="Total" value={stats.totalDrinks} sub="in range" />
          </div>

          {correlationInsight && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgb(var(--accent-subtle))', border: '1px solid rgba(var(--accent), 0.2)' }}>
              <Wine size={14} strokeWidth={1.75} style={{ color: 'rgb(var(--accent))', marginTop: 1, flexShrink: 0 }} />
              <p className="text-[13px]" style={{ color: 'rgb(var(--text-secondary))' }}>{correlationInsight}</p>
            </div>
          )}

          <SegControl value={timeRange} onChange={setTimeRange} options={['1m', '3m', '6m', '1y', 'all']} />

          {weeklyAlcData.length > 0 && (
            <section className="card p-5">
              <p className="section-title mb-5">Weekly drinks</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyAlcData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                  <XAxis dataKey="week" tick={chartStyle} tickLine={false} axisLine={false} />
                  <YAxis tick={chartStyle} tickLine={false} axisLine={false} />
                  <Tooltip content={<Tooltip_ />} />
                  <Bar dataKey="drinks" fill="#a78bfa" radius={[3, 3, 0, 0]} name="Drinks" />
                </BarChart>
              </ResponsiveContainer>
            </section>
          )}

          {correlationData.length > 2 && (
            <section className="card p-5">
              <p className="section-title mb-5">Alcohol vs training volume</p>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={correlationData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                  <XAxis dataKey="week" tick={chartStyle} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" tick={chartStyle} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={chartStyle} tickLine={false} axisLine={false} />
                  <Tooltip content={<Tooltip_ />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="volume" fill="rgb(var(--border))" radius={[3, 3, 0, 0]} name="Volume (k lbs)" />
                  <Line yAxisId="right" type="monotone" dataKey="drinks" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3, fill: '#a78bfa' }} name="Drinks" />
                </ComposedChart>
              </ResponsiveContainer>
            </section>
          )}

          <section>
            <p className="section-title mb-3">History</p>
            <div className="card divide-y divide-[rgb(var(--border))] max-h-72 overflow-y-auto">
              {[...filtered].sort((a, b) => b.date.localeCompare(a.date)).map(entry => (
                <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5 group">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: '#a78bfa' }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-medium" style={{ color: 'rgb(var(--text-primary))' }}>{entry.drinks} drink{entry.drinks !== 1 ? 's' : ''}</span>
                    {entry.type && <span className="text-[12px] ml-2 capitalize" style={{ color: 'rgb(var(--text-tertiary))' }}>· {entry.type}</span>}
                    {entry.notes && <span className="text-[12px] ml-1" style={{ color: 'rgb(var(--text-tertiary))' }}>· {entry.notes}</span>}
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

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Log drinks"><AlcoholForm onSuccess={() => setShowForm(false)} /></Modal>
      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteAlcohol(deleteTarget)} title="Delete entry" message="Delete this alcohol entry?" />
    </div>
  )
}
