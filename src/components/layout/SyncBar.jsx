import { useEffect, useState } from 'react'
import { Cloud, CloudOff, RefreshCw, CheckCircle2, Wifi, WifiOff } from 'lucide-react'
import { onSyncState, syncNow } from '../../lib/sync'
import { FIREBASE_CONFIGURED } from '../../lib/firebase'
import { timeSince } from '../../lib/utils'

export default function SyncBar({ compact = false }) {
  const [sync, setSync] = useState({ isSyncing: false, lastSyncTime: null, pendingCount: 0 })
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const unsub = onSyncState(setSync)
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      unsub()
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  if (compact) {
    if (!FIREBASE_CONFIGURED) return (
      <span className="text-[11px] font-medium flex items-center gap-1" style={{ color: 'rgb(var(--text-tertiary))' }}>
        <CloudOff size={12} /> Local
      </span>
    )
    if (!online) return (
      <span className="text-[11px] font-medium flex items-center gap-1" style={{ color: 'rgb(var(--accent))' }}>
        <WifiOff size={12} /> Offline
      </span>
    )
    if (sync.isSyncing) return (
      <span className="text-[11px] font-medium flex items-center gap-1" style={{ color: 'rgb(var(--text-secondary))' }}>
        <RefreshCw size={12} className="animate-spin" /> Syncing
      </span>
    )
    return (
      <span className="text-[11px] font-medium flex items-center gap-1" style={{ color: 'rgb(var(--text-tertiary))' }}>
        <CheckCircle2 size={12} /> {sync.lastSyncTime ? timeSince(sync.lastSyncTime) : 'Ready'}
      </span>
    )
  }

  // Full bar — only show if there's something worth noting
  if (!FIREBASE_CONFIGURED) return (
    <div
      className="flex items-center gap-2 px-4 py-2 text-[12px]"
      style={{ borderBottom: '1px solid rgb(var(--border))', background: 'rgb(var(--surface-raised))', color: 'rgb(var(--text-tertiary))' }}
    >
      <CloudOff size={12} />
      <span>Firebase not configured — running locally. Add <code className="font-mono">.env</code> vars to enable sync.</span>
    </div>
  )

  if (!online) return (
    <div
      className="flex items-center gap-2 px-4 py-2 text-[12px]"
      style={{ borderBottom: '1px solid rgb(var(--border))', background: 'rgb(var(--accent-subtle))', color: 'rgb(var(--accent))' }}
    >
      <WifiOff size={12} />
      <span>Offline — changes will sync when reconnected</span>
      {sync.pendingCount > 0 && <span className="ml-auto font-medium">{sync.pendingCount} pending</span>}
    </div>
  )

  if (sync.isSyncing) return (
    <div
      className="flex items-center gap-2 px-4 py-2 text-[12px]"
      style={{ borderBottom: '1px solid rgb(var(--border))', color: 'rgb(var(--text-secondary))' }}
    >
      <RefreshCw size={12} className="animate-spin" />
      <span>Syncing…</span>
    </div>
  )

  if (sync.pendingCount > 0) return (
    <div
      className="flex items-center gap-2 px-4 py-2 text-[12px]"
      style={{ borderBottom: '1px solid rgb(var(--border))', color: 'rgb(var(--text-secondary))' }}
    >
      <Cloud size={12} />
      <span>{sync.pendingCount} pending uploads</span>
      <button onClick={syncNow} className="ml-auto underline" style={{ color: 'rgb(var(--text-primary))' }}>Sync now</button>
    </div>
  )

  return null // All good — no bar needed
}
