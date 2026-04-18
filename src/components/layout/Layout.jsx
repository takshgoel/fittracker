import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import SyncBar from './SyncBar'
import { Menu } from 'lucide-react'

export default function Layout({ dark, setDark }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'rgb(var(--bg))' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-56 transform transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0 lg:flex-shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar dark={dark} setDark={setDark} onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header
          className="flex items-center gap-3 px-4 h-14 lg:hidden shrink-0"
          style={{ background: 'rgb(var(--surface))', borderBottom: '1px solid rgb(var(--border))' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn-ghost p-1.5 -ml-1"
          >
            <Menu size={18} />
          </button>
          <span className="font-semibold text-[14px] tracking-tight" style={{ color: 'rgb(var(--text-primary))' }}>
            FitTracker
          </span>
          <div className="ml-auto">
            <SyncBar compact />
          </div>
        </header>

        {/* Sync bar — desktop only */}
        <div className="hidden lg:block shrink-0">
          <SyncBar />
        </div>

        {/* Page */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
