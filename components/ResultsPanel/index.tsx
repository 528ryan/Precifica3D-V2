'use client'

import type { CalculatorInput, CalculatorOutput } from '@/types'
import Slider from '@/components/ui/Slider'
import CostSummaryBar from './CostSummaryBar'
import MarketplaceCard from './MarketplaceCard'
import KitBuilder from './KitBuilder'

interface Props {
  output: CalculatorOutput
  input: CalculatorInput
  onInputChange: (v: CalculatorInput) => void
}

export default function ResultsPanel({ output, input, onInputChange }: Props) {
  const { costBreakdown, results, errors } = output

  function handleMarginChange(m: number) {
    onInputChange({ ...input, desiredMarginPercent: m })
  }

  // Validation errors
  if (errors.length > 0) {
    return (
      <div className="space-y-3">
        {errors.map((err, i) => (
          <div
            key={i}
            className="flex items-start gap-3 px-4 py-3 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10"
          >
            <span className="text-[#ef4444] text-sm mt-0.5">⚠</span>
            <p className="text-sm text-[#ef4444]">{err}</p>
          </div>
        ))}
        <KitBuilder input={input} />
      </div>
    )
  }

  const nonBlocked = results.filter((r) => !r.isBlocked)
  const blocked    = results.filter((r) => r.isBlocked)

  // Margin suggestion chips — use first non-blocked result
  const firstResult = nonBlocked[0]

  return (
    <div className="space-y-4">
      {/* Cost summary */}
      <CostSummaryBar costBreakdown={costBreakdown} />

      {/* Margin slider + chips */}
      <div className="rounded-xl border border-[#1e1e32] bg-[#0f0f1a] px-4 py-3 space-y-3">
        <Slider
          label="Margem desejada"
          value={input.desiredMarginPercent}
          onChange={handleMarginChange}
          min={5}
          max={80}
          displayValue={`${input.desiredMarginPercent}%`}
        />

        {firstResult && (
          <div className="flex flex-wrap gap-2">
            {[
              { value: firstResult.marginSuggestion.conservative, label: 'Conservadora', title: firstResult.marginSuggestion.conservativeRationale },
              { value: firstResult.marginSuggestion.balanced,     label: 'Equilibrada',  title: firstResult.marginSuggestion.balancedRationale },
              { value: firstResult.marginSuggestion.aggressive,   label: 'Agressiva',    title: firstResult.marginSuggestion.aggressiveRationale },
            ].map(({ value, label, title }) => (
              <button
                key={label}
                type="button"
                onClick={() => handleMarginChange(value)}
                title={title}
                className={`px-2.5 py-1 rounded-full text-xs font-mono border transition-colors duration-150 ${
                  input.desiredMarginPercent === value
                    ? 'bg-[#4f46e5] border-[#4f46e5] text-white'
                    : 'border-[#1e1e32] text-[#6b6b8a] hover:border-[#4f46e5]/60 hover:text-[#e8e8f0]'
                }`}
              >
                {value}% {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* No active channels */}
      {nonBlocked.length === 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <span className="text-amber-400 text-base">📦</span>
          <p className="text-sm text-amber-300">
            Ative pelo menos um canal de venda para ver os resultados.
          </p>
        </div>
      )}

      {/* Marketplace cards */}
      {nonBlocked.map((result) => (
        <MarketplaceCard
          key={result.key}
          result={result}
          onMarginChange={handleMarginChange}
          currentMargin={input.desiredMarginPercent}
        />
      ))}

      {/* Blocked channels (compact notice) */}
      {blocked.length > 0 && (
        <div className="space-y-2">
          {blocked.map((r) => (
            <MarketplaceCard
              key={r.key}
              result={r}
              onMarginChange={handleMarginChange}
              currentMargin={input.desiredMarginPercent}
            />
          ))}
        </div>
      )}

      {/* Kit builder */}
      <KitBuilder input={input} />
    </div>
  )
}
