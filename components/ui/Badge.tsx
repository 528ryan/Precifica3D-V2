type BadgeVariant = 'indigo' | 'emerald' | 'amber' | 'red' | 'slate'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
  icon?: string
  size?: 'sm' | 'xs'
}

const VARIANTS: Record<BadgeVariant, string> = {
  indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  red: 'bg-red-500/10 text-red-400 border-red-500/20',
  slate: 'bg-slate-700/50 text-slate-400 border-slate-600/30',
}

export default function Badge({
  label,
  variant = 'slate',
  icon,
  size = 'sm',
}: BadgeProps) {
  const sizeClass = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full border font-medium
        ${sizeClass} ${VARIANTS[variant]}
      `}
    >
      {icon && <span>{icon}</span>}
      {label}
    </span>
  )
}
