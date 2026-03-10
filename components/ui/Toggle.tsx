'use client'

interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
}

export default function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: ToggleProps) {
  return (
    <label
      className={`flex items-center gap-3 cursor-pointer group ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`
          relative inline-flex h-5 w-9 shrink-0 rounded-full border transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#13131a]
          ${checked
            ? 'bg-indigo-600 border-indigo-500'
            : 'bg-[#1e1e2e] border-[#2e2e42]'
          }
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm
            transform transition-transform duration-150 ease-in-out mt-[2px]
            ${checked ? 'translate-x-[18px]' : 'translate-x-[2px]'}
          `}
        />
      </button>

      {(label || description) && (
        <div>
          {label && (
            <p className="text-sm text-slate-200 leading-none">{label}</p>
          )}
          {description && (
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          )}
        </div>
      )}
    </label>
  )
}
