import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Dumbbell, Scale, Activity, Wine,
  Settings, Download, Moon, Sun, X
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/exercises', icon: Dumbbell, label: 'Exercises' },
  { to: '/weight', icon: Scale, label: 'Weight' },
  { to: '/cardio', icon: Activity, label: 'Cardio' },
  { to: '/alcohol', icon: Wine, label: 'Alcohol' },
]

const bottomItems = [
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/export', icon: Download, label: 'Data Export' },
]

function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `group flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-100 ${
          isActive
            ? 'bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-primary))]'
            : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-raised))]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={16} strokeWidth={isActive ? 2 : 1.75} />
          {label}
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar({ dark, setDark, onClose }) {
  return (
    <nav
      className="flex flex-col h-full"
      style={{ background: 'rgb(var(--surface))', borderRight: '1px solid rgb(var(--border))' }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-14 shrink-0" style={{ borderBottom: '1px solid rgb(var(--border))' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgb(var(--text-primary))' }}
          >
            <Dumbbell size={14} style={{ color: 'rgb(var(--bg))' }} strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-[14px] tracking-tight" style={{ color: 'rgb(var(--text-primary))' }}>
            FitTracker
          </span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden btn-ghost p-1.5"
        >
          <X size={16} />
        </button>
      </div>

      {/* Main nav */}
      <div className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <NavItem key={item.to} {...item} onClick={onClose} />
        ))}
      </div>

      {/* Bottom */}
      <div className="px-2 py-3 space-y-0.5" style={{ borderTop: '1px solid rgb(var(--border))' }}>
        {bottomItems.map(item => (
          <NavItem key={item.to} {...item} onClick={onClose} />
        ))}

        <button
          onClick={() => setDark(d => !d)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-100 hover:bg-[rgb(var(--surface-raised))]"
          style={{ color: 'rgb(var(--text-secondary))' }}
        >
          {dark ? <Sun size={16} strokeWidth={1.75} /> : <Moon size={16} strokeWidth={1.75} />}
          {dark ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </nav>
  )
}
