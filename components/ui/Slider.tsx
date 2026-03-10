'use client'

interface SliderProps {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
  label?: string
  displayValue?: string   // formatted value to show — defaults to `${value}%`
}

export default function Slider({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  displayValue,
}: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">{label}</span>
          <span className="text-xs font-semibold text-indigo-400 tabular-nums">
            {displayValue ?? `${value}%`}
          </span>
        </div>
      )}
      <div className="relative">
        {/* track fill */}
        <div
          className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full bg-indigo-600 pointer-events-none"
          style={{ width: `${percent}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="relative w-full"
        />
      </div>
    </div>
  )
}
