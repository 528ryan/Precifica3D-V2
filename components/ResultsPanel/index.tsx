'use client'

import { useState, useMemo } from 'react'
import type { CalculatorInput, CalculatorOutput } from '@/types'
import { calculateMarginAtCustomPrice, type CustomPriceResult } from '@/lib/pricingCalculator'
import CostBreakdownCard from './CostBreakdownCard'
import MarketplaceTable from './MarketplaceTable'
import CapacityCard from './CapacityCard'
import KitBuilder from './KitBuilder'

interface Props {
  output: CalculatorOutput
  input: CalculatorInput
}

export default function ResultsPanel({ output, input }: Props) {
  const { validationErrors, results, costBreakdown, baseCostPerUnit, effectiveCostWithFailures, effectiveTariff, unitsPerMonth } = output

  const [customPriceStr, setCustomPriceStr] = useState('')

  const customAnalysis = useMemo<Record<string, CustomPriceResult>>(() => {
    const price = parseFloat(customPriceStr.replace(',', '.'))
    if (!price || price <= 0) return {}
    const map: Record<string, CustomPriceResult> = {}
    for (const r of results) {
      map[r.key] = calculateMarginAtCustomPrice(price, effectiveCostWithFailures, r.key, input)
    }
    return map
  }, [customPriceStr, results, effectiveCostWithFailures, input])

  // ── Validation error state ────────────────────────────────────────────────
  if (validationErrors.length > 0) {
    return (
      <div className="space-y-3">
        {validationErrors.map((err, i) => (
          <div
            key={i}
            className="flex items-start gap-3 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10"
          >
            <span className="text-red-400 text-sm mt-0.5">⚠</span>
            <p className="text-sm text-red-300">{err}</p>
          </div>
        ))}
        <KitBuilder input={input} />
      </div>
    )
  }

  // ── No channels selected ──────────────────────────────────────────────────
  if (results.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <span className="text-amber-400">📦</span>
          <p className="text-sm text-amber-300">
            Ative pelo menos um canal de venda para ver os resultados.
          </p>
        </div>
        <KitBuilder input={input} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <CostBreakdownCard
        breakdown={costBreakdown}
        baseCost={baseCostPerUnit}
        effectiveCost={effectiveCostWithFailures}
        effectiveTariff={effectiveTariff}
        failureRate={input.production.failureRatePercent}
      />

      <MarketplaceTable
        results={results}
        customPriceStr={customPriceStr}
        onCustomPriceChange={setCustomPriceStr}
        customAnalysis={customAnalysis}
      />

      <CapacityCard
        unitsPerMonth={unitsPerMonth}
        results={results}
        taxRegime={input.seller.taxRegime}
      />

      <KitBuilder input={input} />
    </div>
  )
}
