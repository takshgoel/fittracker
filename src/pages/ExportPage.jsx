import { useState } from 'react'
import { Download, Upload, FileText, FileJson } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { dbPutMany } from '../lib/db'
import { exportToJSON, exportToCSV } from '../lib/utils'
import toast from 'react-hot-toast'

export default function ExportPage() {
  const { exercises, weight, cardio, alcohol, reloadAll } = useApp()
  const [importText, setImportText] = useState('')
  const [importing, setImporting] = useState(false)

  const data = { exercises, weight, cardio, alcohol }
  const counts = { exercises: exercises.length, weight: weight.length, cardio: cardio.length, alcohol: alcohol.length }

  function handleExportJSON() {
    exportToJSON(data)
    toast.success('JSON exported')
  }

  function handleExportCSV(store) {
    exportToCSV(data, store)
    toast.success(`${store} CSV exported`)
  }

  async function handleImport() {
    if (!importText.trim()) { toast.error('Paste JSON first'); return }
    setImporting(true)
    try {
      const parsed = JSON.parse(importText)
      for (const store of ['exercises', 'weight', 'cardio', 'alcohol']) {
        if (parsed[store] && Array.isArray(parsed[store])) await dbPutMany(store, parsed[store])
      }
      await reloadAll()
      toast.success('Data imported successfully!')
      setImportText('')
    } catch (e) {
      toast.error('Invalid JSON: ' + e.message)
    }
    setImporting(false)
  }

  return (
    <div className="space-y-6" style={{ maxWidth: 480 }}>
      <h1 className="page-title">Export & Import</h1>

      {/* Summary */}
      <section className="card p-5">
        <p className="section-title mb-4">Your data</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(counts).map(([key, count]) => (
            <div key={key} className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ background: 'rgb(var(--surface-raised))', border: '1px solid rgb(var(--border))' }}>
              <span className="text-[13px] capitalize" style={{ color: 'rgb(var(--text-secondary))' }}>{key}</span>
              <span className="text-[13px] font-semibold tabular-nums" style={{ color: 'rgb(var(--text-primary))' }}>{count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Export */}
      <section className="card p-5 space-y-4">
        <p className="section-title">Export</p>
        <button onClick={handleExportJSON} className="btn-primary w-full flex items-center justify-center gap-2">
          <FileJson size={14} strokeWidth={2} /> Export all data (JSON)
        </button>
        <p className="text-[12px] text-center" style={{ color: 'rgb(var(--text-tertiary))' }}>Exports exercises, weight, cardio, and alcohol</p>
        <div style={{ borderTop: '1px solid rgb(var(--border))', paddingTop: 16, marginTop: 4 }}>
          <p className="text-[12px] font-medium mb-3" style={{ color: 'rgb(var(--text-secondary))' }}>Export individual CSV</p>
          <div className="grid grid-cols-2 gap-2">
            {['exercises', 'weight', 'cardio', 'alcohol'].map(store => (
              <button key={store} onClick={() => handleExportCSV(store)} className="btn-secondary flex items-center justify-center gap-1.5 text-[12px]">
                <FileText size={13} /> {store.charAt(0).toUpperCase() + store.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Import */}
      <section className="card p-5 space-y-4">
        <p className="section-title">Import from JSON</p>
        <p className="text-[13px]" style={{ color: 'rgb(var(--text-secondary))' }}>
          Paste previously exported JSON to restore or merge data. Existing entries with the same ID will be overwritten if the imported version is newer.
        </p>
        <textarea
          value={importText}
          onChange={e => setImportText(e.target.value)}
          placeholder='{"exercises": [...], "weight": [...], ...}'
          className="input font-mono text-[11px] resize-none"
          style={{ height: 120 }}
        />
        <button onClick={handleImport} disabled={importing} className="btn-primary w-full flex items-center justify-center gap-2">
          <Upload size={14} strokeWidth={2} />
          {importing ? 'Importing…' : 'Import data'}
        </button>
      </section>
    </div>
  )
}
