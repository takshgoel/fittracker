export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'rgb(var(--surface-raised))', border: '1px solid rgb(var(--border))' }}
        >
          <Icon size={22} strokeWidth={1.5} style={{ color: 'rgb(var(--text-tertiary))' }} />
        </div>
      )}
      <p className="text-[14px] font-medium" style={{ color: 'rgb(var(--text-primary))' }}>{title}</p>
      {description && (
        <p className="text-[13px] mt-1.5 max-w-xs" style={{ color: 'rgb(var(--text-tertiary))' }}>{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
