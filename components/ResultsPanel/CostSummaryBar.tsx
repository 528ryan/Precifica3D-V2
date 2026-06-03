import type { CostBreakdown } from '@/types'

function brl(n: number): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function CostSummaryBar({ costBreakdown }: { costBreakdown: CostBreakdown }) {
  const { filamentCost, postProcessingCost, otherDirectCosts, failureRatePercent, effectiveCostPerUnit } = costBreakdown

  return (
    <div className="rounded-xl border border-[#1e1e32] bg-[#0f0f1a] px-4 py-3 space-y-2">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#6b6b8a]">
        <span>
          Filamento{' '}
          <span className="font-mono text-[#e8e8f0]">R${brl(filamentCost)}</span>
        </span>
        {postProcessingCost > 0 && (
          <span>
            Acabamento{' '}
            <span className="font-mono text-[#e8e8f0]">R${brl(postProcessingCost)}</span>
          </span>
        )}
        {otherDirectCosts > 0 && (
          <span>
            Outros{' '}
            <span className="font-mono text-[#e8e8f0]">R${brl(otherDirectCosts)}</span>
          </span>
        )}
        <span>
          Falha{' '}
          <span className="font-mono text-amber-400">+{failureRatePercent}%</span>
        </span>
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-[#1e1e32]">
        <span className="text-xs text-[#6b6b8a]">Custo Efetivo por Peça</span>
        <span className="text-xl font-mono font-bold text-[#e8e8f0]">
          R${brl(effectiveCostPerUnit)}
        </span>
      </div>
    </div>
  )
}
