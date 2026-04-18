import { useState } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { dbClear } from '../lib/db'
import { FIREBASE_CONFIGURED } from '../lib/firebase'
import { syncNow } from '../lib/sync'
import Modal from '../components/ui/Modal'
import toast from 'react-hot-toast'

function Row({ label, sub, children }) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <div>
        <p className="text-[13px] font-medium" style={{ color: 'rgb(var(--text-primary))' }}>{label}</p>
        {sub && <p className="text-[12px] mt-0.5" style={{ color: 'rgb(var(--text-tertiary))' }}>{sub}</p>}
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage({ dark, setDark }) {
  const { settings, updateSettings, reloadAll } = useApp()
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  async function handleClearData() {
    await Promise.all(['exercises', 'weight', 'cardio', 'alcohol'].map(s => dbClear(s)))
    localStorage.removeItem('fitness_seeded_v1')
    await reloadAll()
    toast.success('All local data cleared')
    setShowClearConfirm(false)
  }

  const Toggle = ({ checked, onChange }) => (
    <button
      onClick={onChange}
      className="relative shrink-0"
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: checked ? 'rgb(var(--text-primary))' : 'rgb(var(--border))',
        transition: 'background 0.2s',
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: checked ? 'rgb(var(--bg))' : 'rgb(var(--surface))',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }} />
    </button>
  )

  return (
    <div className="space-y-6" style={{ maxWidth: 480 }}>
      <h1 className="page-title">Settings</h1>

      {/* Appearance */}
      <section className="card divide-y divide-[rgb(var(--border))] px-4">
        <p className="section-title py-3.5">Appearance</p>
        <Row label="Dark mode" sub="Toggle dark/light theme">
          <Toggle checked={dark} onChange={() => setDark(d => !d)} />
        </Row>
      </section>

      {/* Units */}
      <section className="card divide-y divide-[rgb(var(--border))] px-4">
        <p className="section-title py-3.5">Units</p>
        <Row label="Weight unit" sub="Stored in lbs internally">
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgb(var(--border))' }}>
            {['lbs', 'kg'].map(unit => (
              <button
                key={unit}
                onClick={() => updateSettings({ weightUnit: unit })}
                className="px-4 py-1.5 text-[12px] font-medium transition-colors"
                style={{
                  background: (settings.weightUnit || 'lbs') === unit ? 'rgb(var(--text-primary))' : 'transparent',
                  color: (settings.weightUnit || 'lbs') === unit ? 'rgb(var(--bg))' : 'rgb(var(--text-secondary))',
                }}
              >
                {unit}
              </button>
            ))}
          </div>
        </Row>
      </section>

      {/* Sync */}
      <section className="card divide-y divide-[rgb(var(--border))] px-4">
        <p className="section-title py-3.5">Sync</p>
        {FIREBASE_CONFIGURED ? (
          <div className="py-3.5 space-y-3">
            <p className="text-[13px]" style={{ color: 'rgb(var(--text-secondary))' }}>Firebase sync is active</p>
            <button onClick={syncNow} className="btn-secondary flex items-center gap-2">
              <RefreshCw size={13} strokeWidth={2} /> Sync now
            </button>
          </div>
        ) : (
          <div className="py-3.5 space-y-3">
            <p className="text-[13px]" style={{ color: 'rgb(var(--text-secondary))' }}>Firebase not configured — data is local only</p>
            <p className="text-[12px]" style={{ color: 'rgb(var(--text-tertiary))' }}>Add these environment variables to enable cross-device sync:</p>
            <pre className="text-[11px] rounded-xl p-3 overflow-x-auto" style={{ background: 'rgb(var(--surface-raised))', color: 'rgb(var(--text-secondary))', border: '1px solid rgb(var(--border))' }}>{`VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...`}</pre>
          </div>
        )}
      </section>

      {/* Data */}
      <section className="card divide-y divide-[rgb(var(--border))] px-4">
        <p className="section-title py-3.5">Data</p>
        <div className="py-3.5">
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <AlertTriangle size={14} strokeWidth={1.75} style={{ color: 'rgb(var(--red))', marginTop: 1, flexShrink: 0 }} />
            <div className="flex-1">
              <p className="text-[13px] font-medium" style={{ color: 'rgb(var(--red))' }}>Clear all local data</p>
              <p className="text-[12px] mt-0.5" style={{ color: 'rgb(var(--text-tertiary))' }}>Removes all data from this device. Cloud data is not affected.</p>
            </div>
            <button onClick={() => setShowClearConfirm(true)} className="btn-danger text-[12px] py-1.5 px-3 shrink-0">
              Clear
            </button>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="card px-4 py-3.5">
        <p className="text-[12px]" style={{ color: 'rgb(var(--text-tertiary))' }}>FitTracker v1.0 · React + Firebase + IndexedDB</p>
      </section>

      <Modal isOpen={showClearConfirm} onClose={() => setShowClearConfirm(false)} title="Clear all data">
        <p className="text-[13px] mb-6" style={{ color: 'rgb(var(--text-secondary))' }}>
          This will delete all local data on this device. Cloud data is not affected. Are you sure?
        </p>
        <div className="flex gap-2">
          <button onClick={() => setShowClearConfirm(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleClearData} className="btn-danger flex-1">Clear everything</button>
        </div>
      </Modal>
    </div>
  )
}
