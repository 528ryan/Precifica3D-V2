import type { MarketplaceResult } from '@/types'
import Badge from '@/components/ui/Badge'

interface Props {
  unitsPerMonth: number
  results: MarketplaceResult[]
  taxRegime: string
}

function brl(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function CapacityCard({ unitsPerMonth, results, taxRegime }: Props) {
  const validResults = results.filter((r) => r.recommendedPrice > 0)
  if (validResults.length === 0) return null

  const meiWarning =
    taxRegime === 'mei' &&
    validResults.some((r) => unitsPerMonth * r.recommendedPrice > 6750)

  return (
    <div className="rounded-xl border border-dark-border bg-dark-surface overflow-hidden">
      <div className="px-4 py-3 border-b border-dark-border flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Capacidade Produtiva
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Baseado em 30 dias × 24h = 720h/mês</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-slate-100 tabular-nums">{unitsPerMonth}</span>
          <span className="text-xs text-slate-500">peças/mês</span>
        </div>
      </div>

      {meiWarning && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
          <span className="text-amber-400 text-sm">⚠</span>
          <p className="text-xs text-amber-400">
            Receita projetada ultrapassa o limite MEI de R$6.750/mês em alguns canais.
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-border">
              <th className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wide text-left">
                Canal
              </th>
              <th className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wide text-right">
                Preço Unit.
              </th>
              <th className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wide text-right">
                Receita Bruta/mês
              </th>
              <th className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wide text-right">
                Lucro Líq./mês
              </th>
            </tr>
          </thead>
          <tbody>
            {validResults.map((r) => {
              const revenue = unitsPerMonth * r.recommendedPrice
              const profit = unitsPerMonth * r.netProfitPerUnit
              const meiOver = taxRegime === 'mei' && revenue > 6750
              return (
                <tr
                  key={r.key}
                  className={`border-b border-dark-border/50 hover:bg-white/[0.01] transition-colors ${
                    meiOver ? 'bg-amber-500/5' : ''
                  }`}
                >
                  <td className="px-3 py-2 text-sm font-medium text-slate-300">
                    <div className="flex items-center gap-1.5">
                      {r.label}
                      {meiOver && <Badge label="Limite MEI" variant="amber" size="xs" />}
                    </div>
                  </td>
                  <td className="px-3 py-2 tabular-nums text-right">
                    <span className="text-sm font-bold text-indigo-300">R${brl(r.recommendedPrice)}</span>
                  </td>
                  <td className="px-3 py-2 tabular-nums text-right">
                    <span className="text-sm text-slate-300">R${brl(revenue)}</span>
                  </td>
                  <td className="px-3 py-2 tabular-nums text-right">
                    <span className="text-sm font-semibold text-emerald-400">
                      R${brl(profit)}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
