export default function StatCard({ label, value, sub, icon: Icon, color = 'default', trend }) {
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-medium tracking-wide uppercase" style={{ color: 'rgb(var(--text-tertiary))', letterSpacing: '0.04em' }}>
          {label}
        </p>
        {Icon && <Icon size={14} strokeWidth={1.75} style={{ color: 'rgb(var(--text-tertiary))' }} />}
      </div>
      <div>
        <p className="text-[22px] font-semibold tracking-tight leading-none" style={{ color: 'rgb(var(--text-primary))' }}>
          {value}
        </p>
        {sub && (
          <p className="text-[12px] mt-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>
            {sub}
          </p>
        )}
        {trend && (
          <p className={`text-[12px] font-medium mt-1 ${
            trend.startsWith('↓') || trend.startsWith('-')
              ? 'text-blue-400'
              : trend.startsWith('↑') || trend.startsWith('+')
              ? 'text-emerald-400'
              : ''
          }`} style={!trend.startsWith('↓') && !trend.startsWith('-') && !trend.startsWith('↑') && !trend.startsWith('+') ? { color: 'rgb(var(--text-tertiary))' } : {}}>
            {trend}
          </p>
        )}
      </div>
    </div>
  )
}
