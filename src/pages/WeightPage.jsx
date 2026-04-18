import { useMemo, useState } from 'react'
import { ComposedChart, Line, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Plus, Trash2 } from 'lucide-react'
import { Scale } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import WeightForm from '../components/forms/WeightForm'
import StatCard from '../components/ui/StatCard'
import EmptyState from '../components/ui/EmptyState'
import { rollingAverage, fmtDate, fmtDateFull } from '../lib/calculations'
import { convertWeight } from '../lib/utils'

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
      {payload.map(p => p.value != null && (
        <p key={p.name} style={{ color: p.color, fontWeight: 500 }}>
          {p.name}: {Number(p.value).toFixed(1)} lbs
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

export default function WeightPage() {
  const { weight: entries, deleteWeight, settings } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [timeRange, setTimeRange] = useState('all')
  const displayUnit = settings.weightUnit || 'lbs'

  const cutoffDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - ({ '1m': 30, '3m': 90, '6m': 180, '1y': 365, all: 99999 }[timeRange] || 99999))
    return d.toISOString().split('T')[0]
  }, [timeRange])

  const chartData = useMemo(() => {
    const filtered = entries.filter(e => e.date >= cutoffDate)
    return rollingAverage(filtered).map(e => ({
      date: fmtDate(e.date),
      weight: Number(e.weight.toFixed(1)),
      rollingAvg: e.rollingAvg,
    }))
  }, [entries, cutoffDate])

  const stats = useMemo(() => {
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
    if (!sorted.length) return {}
    const latest = sorted[sorted.length - 1]
    const oldest = sorted[0]
    const last7 = sorted.slice(-7)
    const weekChange = last7.length >= 2 ? last7[last7.length - 1].weight - last7[0].weight : 0
    const totalChange = latest.weight - oldest.weight
    const minWeight = Math.min(...sorted.map(e => e.weight))
    return { latest, weekChange, totalChange, minWeight }
  }, [entries])

  const d = (lbs) => `${convertWeight(lbs, 'lbs', displayUnit).toFixed(1)} ${displayUnit}`

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Weight</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={14} strokeWidth={2.5} /> Log
        </button>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={Scale}
          title="No weight entries"
          description="Log your weight daily to track trends over time"
          action={<button onClick={() => setShowForm(true)} className="btn-primary">Log weight</button>}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Current"
              value={stats.latest ? d(stats.latest.weight) : '—'}
              sub={stats.latest ? fmtDate(stats.latest.date) : ''}
              trend={stats.weekChange != null ? `${stats.weekChange < 0 ? '↓' : '↑'} ${Math.abs(convertWeight(stats.weekChange, 'lbs', displayUnit)).toFixed(1)} ${displayUnit} this week` : undefined}
              icon={Scale}
            />
            <StatCard
              label="All-time low"
              value={stats.minWeight ? d(stats.minWeight) : '—'}
            />
            <StatCard
              label="7-day change"
              value={stats.weekChange != null ? `${stats.weekChange >= 0 ? '+' : ''}${convertWeight(stats.weekChange, 'lbs', displayUnit).toFixed(1)} ${displayUnit}` : '—'}
              trend={stats.weekChange < 0 ? '↓ trending down' : stats.weekChange > 0 ? '↑ trending up' : '→ stable'}
            />
            <StatCard
              label="Total change"
              value={stats.totalChange != null ? `${stats.totalChange >= 0 ? '+' : ''}${convertWeight(stats.totalChange, 'lbs', displayUnit).toFixed(1)} ${displayUnit}` : '—'}
            />
          </div>

          <SegControl value={timeRange} onChange={setTimeRange} options={['1m', '3m', '6m', '1y', 'all']} />

          {/* Chart */}
          <section className="card p-5">
            <p className="section-title mb-5">Weight trend</p>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                <XAxis dataKey="date" tick={chartStyle} tickLine={false} axisLine={false} interval={Math.floor(chartData.length / 6)} />
                <YAxis tick={chartStyle} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip content={<Tooltip_ />} />
                <Scatter dataKey="weight" fill="rgb(var(--border))" name="Daily" />
                <Line type="monotone" dataKey="rollingAvg" stroke="rgb(var(--accent))" strokeWidth={2} dot={false} name="7-day avg" />
              </ComposedChart>
            </ResponsiveContainer>
            <p className="text-[11px] mt-3" style={{ color: 'rgb(var(--text-tertiary))' }}>
              Orange = 7-day rolling average · Dots = daily weigh-ins
            </p>
          </section>

          {/* History */}
          <section>
            <p className="section-title mb-3">History</p>
            <div className="card divide-y divide-[rgb(var(--border))] max-h-72 overflow-y-auto">
              {[...entries].sort((a, b) => b.date.localeCompare(a.date)).map(entry => (
                <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5 group">
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
                      {d(entry.weight)}
                    </span>
                    {entry.notes && (
                      <span className="text-[12px] ml-2" style={{ color: 'rgb(var(--text-tertiary))' }}>· {entry.notes}</span>
                    )}
                  </div>
                  <span className="text-[12px] shrink-0" style={{ color: 'rgb(var(--text-tertiary))' }}>{fmtDateFull(entry.date)}</span>
                  <button
                    onClick={() => setDeleteTarget(entry.id)}
                    className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'rgb(var(--text-tertiary))' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgb(var(--red))'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgb(var(--text-tertiary))'}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Log weight">
        <WeightForm onSuccess={() => setShowForm(false)} />
      </Modal>
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteWeight(deleteTarget)}
        title="Delete entry"
        message="Delete this weight entry?"
      />
    </div>
  )
}
