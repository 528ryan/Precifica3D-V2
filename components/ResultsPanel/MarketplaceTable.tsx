import type { MarketplaceResult } from '@/types'
import Badge from '@/components/ui/Badge'

interface Props {
  results: MarketplaceResult[]
}

function brl(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function pct(v: number): string {
  return `${v.toFixed(1)}%`
}

function RowWarnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {warnings.map((w, i) => (
        <span key={i} className="text-[10px] text-amber-400/80 flex items-center gap-0.5">
          <span>⚠</span> {w}
        </span>
      ))}
    </div>
  )
}

function ResultRow({ r }: { r: MarketplaceResult }) {
  const hasError = r.recommendedPrice === 0 && r.warnings.some((w) => w.includes('Impossível') || w.includes('inviável'))

  let rowClass = 'border-b border-dark-border transition-colors duration-150 hover:bg-white/[0.015]'
  if (hasError) rowClass += ' bg-red-500/5'
  else if (r.effectiveMarginPercent > 0 && r.effectiveMarginPercent < 10) rowClass += ' bg-amber-500/5'
  else if (r.effectiveMarginPercent >= 25) rowClass += ' bg-emerald-500/5'

  return (
    <tr className={rowClass}>
      {/* Canal */}
      <td className="px-3 py-3 min-w-[160px]">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium text-slate-200">{r.label}</span>
            {r.isBestPrice && (
              <Badge label="↓ Mais Barato" variant="emerald" size="xs" />
            )}
            {r.isBestProfit && (
              <Badge label="★ Mais Lucrativo" variant="indigo" size="xs" />
            )}
          </div>
          <RowWarnings warnings={r.warnings} />
        </div>
      </td>

      {/* Comissão */}
      <td className="px-3 py-3 text-xs text-slate-400 tabular-nums text-right whitespace-nowrap">
        {r.commissionPercent}%
      </td>

      {/* Imposto */}
      <td className="px-3 py-3 text-xs text-slate-400 tabular-nums text-right whitespace-nowrap">
        {r.taxPercent}%
      </td>

      {/* Taxa fixa */}
      <td className="px-3 py-3 text-xs text-slate-400 tabular-nums text-right whitespace-nowrap">
        {r.fixedFeeR$ > 0 ? `R$${brl(r.fixedFeeR$)}` : '—'}
      </td>

      {/* Break-even */}
      <td className="px-3 py-3 text-xs tabular-nums text-right whitespace-nowrap">
        {hasError ? (
          <span className="text-slate-600">—</span>
        ) : (
          <span
            className={
              r.breakevenPrice > r.recommendedPrice
                ? 'text-red-400 font-semibold'
                : 'text-slate-400'
            }
          >
            R${brl(r.breakevenPrice)}
          </span>
        )}
      </td>

      {/* Preço Recomendado — destaque */}
      <td className="px-3 py-3 tabular-nums text-right whitespace-nowrap">
        {hasError ? (
          <span className="text-red-400/70 text-xs">Erro</span>
        ) : (
          <span className="text-base font-bold text-indigo-300">
            R${brl(r.recommendedPrice)}
          </span>
        )}
      </td>

      {/* Lucro/peça */}
      <td className="px-3 py-3 text-sm tabular-nums text-right whitespace-nowrap">
        {hasError ? (
          <span className="text-slate-600">—</span>
        ) : (
          <span
            className={
              r.netProfitPerUnit < 0
                ? 'text-red-400 font-medium'
                : 'text-emerald-400 font-medium'
            }
          >
            R${brl(r.netProfitPerUnit)}
          </span>
        )}
      </td>

      {/* Margem efetiva */}
      <td className="px-3 py-3 text-sm tabular-nums text-right whitespace-nowrap">
        {hasError ? (
          <span className="text-slate-600">—</span>
        ) : (
          <span
            className={
              r.effectiveMarginPercent < 10
                ? 'text-red-400 font-medium'
                : r.effectiveMarginPercent >= 25
                ? 'text-emerald-400 font-medium'
                : 'text-slate-300'
            }
          >
            {pct(r.effectiveMarginPercent)}
          </span>
        )}
      </td>
    </tr>
  )
}

const HEADERS = [
  { label: 'Canal', align: 'left' },
  { label: 'Comissão', align: 'right' },
  { label: 'Imposto', align: 'right' },
  { label: 'Taxa Fixa', align: 'right' },
  { label: 'Break-even', align: 'right' },
  { label: 'Preço Recomendado', align: 'right' },
  { label: 'Lucro/peça', align: 'right' },
  { label: 'Margem', align: 'right' },
]

export default function MarketplaceTable({ results }: Props) {
  if (results.length === 0) return null

  return (
    <div className="rounded-xl border border-dark-border bg-dark-surface overflow-hidden">
      <div className="px-4 py-3 border-b border-dark-border">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          Comparativo de Canais
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-border">
              {HEADERS.map((h) => (
                <th
                  key={h.label}
                  className={`px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap ${
                    h.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <ResultRow key={r.key} r={r} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
