import type { CostBreakdown } from '@/types'

interface Props {
  breakdown: CostBreakdown
  baseCost: number
  effectiveCost: number
  effectiveTariff: number
  failureRate: number
}

function brl(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function pct(v: number): string {
  return `${v.toFixed(1)}%`
}

export default function CostBreakdownCard({
  breakdown,
  baseCost,
  effectiveCost,
  effectiveTariff,
  failureRate,
}: Props) {
  const items = [
    { label: 'Filamento',          value: breakdown.filament,        color: 'bg-violet-500' },
    { label: 'Energia elétrica',   value: breakdown.electricity,     color: 'bg-blue-500'   },
    { label: 'Mão de obra',        value: breakdown.labor,           color: 'bg-emerald-500'},
    { label: 'Pós-processamento',  value: breakdown.postProcessing,  color: 'bg-amber-500'  },
  ]

  const failureDelta =
    baseCost > 0
      ? (((effectiveCost - baseCost) / baseCost) * 100).toFixed(1)
      : '0.0'

  return (
    <div className="rounded-xl border border-dark-border bg-dark-surface p-4 space-y-4">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
        Custo de Produção
      </h3>

      {/* Progress bar */}
      {baseCost > 0 && (
        <div className="flex h-2 rounded-full overflow-hidden gap-px">
          {items.map((item) => (
            <div
              key={item.label}
              className={`${item.color} transition-all duration-300`}
              style={{ width: `${(item.value / baseCost) * 100}%` }}
              title={`${item.label}: R$${brl(item.value)}`}
            />
          ))}
        </div>
      )}

      {/* Breakdown rows */}
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
              <span className="text-xs text-slate-400">{item.label}</span>
            </div>
            <span className="text-xs text-slate-300 tabular-nums">
              R${brl(item.value)}
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-dark-border" />

      {/* Totals */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">Custo base</span>
          <span className="text-sm font-semibold text-slate-200 tabular-nums">
            R${brl(baseCost)}
          </span>
        </div>

        {failureRate > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">
              Ajustado por falhas ({pct(failureRate)})
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-500/70 tabular-nums">+{failureDelta}%</span>
              <span className="text-sm font-bold text-amber-400 tabular-nums">
                R${brl(effectiveCost)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tariff */}
      <div className="flex justify-between items-center pt-1 border-t border-dark-border">
        <span className="text-xs text-slate-500">Tarifa elétrica efetiva</span>
        <span className="text-xs text-slate-400 tabular-nums">
          R${effectiveTariff.toFixed(4)}/kWh
        </span>
      </div>
    </div>
  )
}
