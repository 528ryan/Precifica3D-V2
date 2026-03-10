'use client'

import { useState } from 'react'

interface CollapsibleSectionProps {
  title: string
  icon?: string
  defaultOpen?: boolean
  children: React.ReactNode
  badge?: React.ReactNode
}

export default function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  children,
  badge,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-xl border border-dark-border bg-dark-surface overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors duration-150 text-left"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-base">{icon}</span>}
          <span className="text-sm font-semibold text-slate-200">{title}</span>
          {badge && <span>{badge}</span>}
        </div>
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-dark-border">
          {children}
        </div>
      )}
    </div>
  )
}
