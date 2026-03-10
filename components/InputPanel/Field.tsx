// Shared field wrapper used across InputPanel sub-components

interface FieldProps {
  label: string
  hint?: string
  children: React.ReactNode
}

export default function Field({ label, hint, children }: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">
        {label}
        {hint && <span className="ml-1 text-slate-600 font-normal">· {hint}</span>}
      </label>
      {children}
    </div>
  )
}
