import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Dumbbell, Scale, Activity, Wine, TrendingUp, Trophy, AlertTriangle, Plus, ArrowRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import StatCard from '../components/ui/StatCard'
import Modal from '../components/ui/Modal'
import ExerciseForm from '../components/forms/ExerciseForm'
import WeightForm from '../components/forms/WeightForm'
import CardioForm from '../components/forms/CardioForm'
import AlcoholForm from '../components/forms/AlcoholForm'
import { rollingAverage, findPRs, detectPlateaus, isThisWeek, fmtDate } from '../lib/calculations'

const QUICK_ADD = [
  { label: 'Exercise', icon: Dumbbell, form: 'exercise' },
  { label: 'Weight', icon: Scale, form: 'weight' },
  { label: 'Cardio', icon: Activity, form: 'cardio' },
  { label: 'Alcohol', icon: Wine, form: 'alcohol' },
]

export default function DashboardPage() {
  const { exercises, weight, cardio, alcohol, loading } = useApp()
  const [activeForm, setActiveForm] = useState(null)

  const stats = useMemo(() => {
    const sortedWeight = [...weight].sort((a, b) => b.date.localeCompare(a.date))
    const latestWeight = sortedWeight[0]
    const weightWithAvg = rollingAverage(weight)
    const last7 = weightWithAvg.slice(-7)
    const weekChange = last7.length >= 2
      ? (last7[last7.length - 1].weight - last7[0].weight).toFixed(1)
      : null

    const thisWeekExercises = exercises.filter(e => isThisWeek(e.date))
    const thisWeekVolume = thisWeekExercises.reduce((sum, e) =>
      sum + e.sets.reduce((s, set) => s + set.reps * set.weight, 0), 0)

    const thisWeekCardio = cardio.filter(e => isThisWeek(e.date))
    const thisWeekCardioMin = thisWeekCardio.reduce((sum, e) => sum + (Number(e.duration) || 0), 0)

    const uniqueDates = new Set(thisWeekExercises.map(e => e.date))

    const recent = exercises.filter(e => Date.now() - new Date(e.date).getTime() < 30 * 86400000)
    const prs = findPRs(recent)
    const newPRs = prs.filter(pr => Date.now() - new Date(pr.date).getTime() < 7 * 86400000)
    const plateaus = detectPlateaus(exercises)

    return {
      latestWeight, weekChange,
      thisWeekVolume: Math.round(thisWeekVolume / 1000),
      thisWeekCardioMin,
      workoutsThisWeek: uniqueDates.size,
      newPRs: newPRs.slice(0, 3),
      plateaus: plateaus.slice(0, 3),
    }
  }, [exercises, weight, cardio])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 rounded-full border-2 border-[rgb(var(--text-tertiary))] border-t-[rgb(var(--text-primary))] animate-spin" />
    </div>
  )

  const trendIcon = stats.weekChange !== null
    ? Number(stats.weekChange) < 0 ? '↓' : Number(stats.weekChange) > 0 ? '↑' : '→'
    : null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="page-title">Overview</h1>
        <p className="text-[13px] mt-1" style={{ color: 'rgb(var(--text-tertiary))' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Quick-add strip */}
      <div className="flex gap-2 flex-wrap">
        {QUICK_ADD.map(({ label, icon: Icon, form }) => (
          <button
            key={form}
            onClick={() => setActiveForm(form)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-100"
            style={{
              background: 'rgb(var(--surface))',
              border: '1px solid rgb(var(--border))',
              color: 'rgb(var(--text-secondary))',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'rgb(var(--text-primary))'
              e.currentTarget.style.background = 'rgb(var(--surface-raised))'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'rgb(var(--text-secondary))'
              e.currentTarget.style.background = 'rgb(var(--surface))'
            }}
          >
            <Plus size={14} strokeWidth={2.5} />
            <Icon size={13} strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Weight"
          value={stats.latestWeight ? `${stats.latestWeight.weight} lbs` : '—'}
          sub={stats.latestWeight ? fmtDate(stats.latestWeight.date) : 'No entries yet'}
          trend={stats.weekChange !== null ? `${trendIcon} ${Math.abs(stats.weekChange)} lbs this week` : undefined}
          icon={Scale}
        />
        <StatCard
          label="Volume"
          value={stats.thisWeekVolume ? `${stats.thisWeekVolume}k lbs` : '0'}
          sub="This week"
          icon={Dumbbell}
        />
        <StatCard
          label="Cardio"
          value={`${stats.thisWeekCardioMin} min`}
          sub={`${cardio.filter(e => isThisWeek(e.date)).length} sessions this week`}
          icon={Activity}
        />
        <StatCard
          label="Training days"
          value={stats.workoutsThisWeek}
          sub="This week"
          icon={TrendingUp}
        />
      </div>

      {/* PRs */}
      {stats.newPRs.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={14} strokeWidth={1.75} style={{ color: 'rgb(var(--accent))' }} />
            <h2 className="section-title">New PRs this week</h2>
          </div>
          <div className="card divide-y divide-[rgb(var(--border))]">
            {stats.newPRs.map(pr => (
              <div key={pr.exercise} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-[13px] font-medium" style={{ color: 'rgb(var(--text-primary))' }}>{pr.exercise}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'rgb(var(--text-tertiary))' }}>{fmtDate(pr.date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[14px] font-semibold" style={{ color: 'rgb(var(--accent))' }}>{pr.rm} lbs</p>
                  <p className="text-[11px]" style={{ color: 'rgb(var(--text-tertiary))' }}>est. 1RM</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Plateaus */}
      {stats.plateaus.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} strokeWidth={1.75} style={{ color: 'rgb(var(--text-tertiary))' }} />
            <h2 className="section-title">Plateaus</h2>
          </div>
          <div className="card divide-y divide-[rgb(var(--border))]">
            {stats.plateaus.map(p => (
              <div key={p.exercise} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-[13px] font-medium" style={{ color: 'rgb(var(--text-primary))' }}>{p.exercise}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'rgb(var(--text-tertiary))' }}>No new PR in 21+ days</p>
                </div>
                <p className="text-[13px] font-medium" style={{ color: 'rgb(var(--text-secondary))' }}>{p.recentMax} lbs</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent sessions */}
      {exercises.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title">Recent sessions</h2>
            <Link
              to="/exercises"
              className="flex items-center gap-1 text-[12px] font-medium"
              style={{ color: 'rgb(var(--text-secondary))' }}
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="card divide-y divide-[rgb(var(--border))]">
            {[...exercises]
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 5)
              .map(entry => (
                <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate" style={{ color: 'rgb(var(--text-primary))' }}>
                      {entry.exercise}
                    </p>
                    <p className="text-[12px] mt-0.5" style={{ color: 'rgb(var(--text-tertiary))' }}>
                      {entry.sets.length} sets · {fmtDate(entry.date)}
                    </p>
                  </div>
                  <p className="text-[12px] font-mono shrink-0" style={{ color: 'rgb(var(--text-secondary))' }}>
                    {entry.sets[0]?.weight}×{entry.sets[0]?.reps}
                  </p>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Modals */}
      <Modal isOpen={activeForm === 'exercise'} onClose={() => setActiveForm(null)} title="Log exercise">
        <ExerciseForm onSuccess={() => setActiveForm(null)} />
      </Modal>
      <Modal isOpen={activeForm === 'weight'} onClose={() => setActiveForm(null)} title="Log weight">
        <WeightForm onSuccess={() => setActiveForm(null)} />
      </Modal>
      <Modal isOpen={activeForm === 'cardio'} onClose={() => setActiveForm(null)} title="Log cardio">
        <CardioForm onSuccess={() => setActiveForm(null)} />
      </Modal>
      <Modal isOpen={activeForm === 'alcohol'} onClose={() => setActiveForm(null)} title="Log drinks">
        <AlcoholForm onSuccess={() => setActiveForm(null)} />
      </Modal>
    </div>
  )
}
