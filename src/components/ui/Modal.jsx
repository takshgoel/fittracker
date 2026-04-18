import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative w-full max-w-md max-h-[92vh] overflow-y-auto"
        style={{
          background: 'rgb(var(--surface))',
          border: '1px solid rgb(var(--border))',
          borderRadius: '16px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 flex items-center justify-between px-5 py-4"
          style={{
            background: 'rgb(var(--surface))',
            borderBottom: '1px solid rgb(var(--border))',
            borderRadius: '16px 16px 0 0',
          }}
        >
          <h2 className="text-[15px] font-semibold tracking-tight" style={{ color: 'rgb(var(--text-primary))' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="btn-ghost p-1.5 -mr-1"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  )
}
