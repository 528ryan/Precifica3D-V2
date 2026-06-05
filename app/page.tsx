'use client'

import { useMemo, useState } from 'react'
import InputPanel from '@/components/InputPanel'
import ResultsPanel from '@/components/ResultsPanel'
import PresetManager from '@/components/InputPanel/PresetManager'
import { calculatePricing } from '@/lib/pricingCalculator'
import type { CalculatorInput } from '@/types'

const DEFAULT_INPUT: CalculatorInput = {
  production: {
    filamentPricePerKg: 80,
    filamentWeightGrams: 50,
    postProcessingCost: 0,
    otherDirectCosts: 0,
    failureRatePercent: 5,
  },
  seller: {
    taxRegime: 'mei',
  },
  marketplaces: {
    ml_classico:  true,
    ml_premium:   false,
    shopee:       true,
    tiktok:       false,
    venda_direta: false,
  },
  mlShipping: {
    packagingWeightG: 50,
  },
  desiredMarginPercent: 30,
}

export default function Home() {
  const [input, setInput] = useState<CalculatorInput>(DEFAULT_INPUT)
  const output = useMemo(() => calculatePricing(input), [input])

  // Summary stats
  const nonBlocked = output.results.filter((r) => !r.isBlocked)
  const bestPrice  = nonBlocked.find((r) => r.isBestPrice)
  const bestProfit = nonBlocked.find((r) => r.isBestProfit)

  return (
    <div className="min-h-screen bg-[#080810]">
      {/* ── Header ── */}
      <header className="sticky top-0 z-10 border-b border-[#1e1e32] bg-[#080810]/90 backdrop-blur-md">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-[#4f46e5] flex items-center justify-center text-white text-sm font-mono font-bold">
              P
            </div>
            <h1 className="text-sm font-syne font-bold text-[#e8e8f0] leading-none">
              precifica3d
            </h1>
            <span className="hidden sm:inline text-xs text-[#6b6b8a] border border-[#1e1e32] rounded-full px-2 py-0.5">
              março 2026
            </span>
          </div>

          {/* Preset manager in header */}
          <PresetManager
            currentInput={input}
            onLoad={setInput}
            onNew={() => setInput(DEFAULT_INPUT)}
          />
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row gap-6 items-start">

        {/* Input sidebar */}
        <aside className="w-full md:w-[380px] shrink-0 md:sticky md:top-[49px] md:max-h-[calc(100vh-49px)] md:overflow-y-auto space-y-3 pb-6">
          <InputPanel value={input} onChange={setInput} />
        </aside>

        {/* Results area */}
        <main className="flex-1 min-w-0 space-y-4">
          {/* Summary strip */}
          {output.errors.length === 0 && nonBlocked.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                label="Custo Efetivo"
                value={`R$${output.costBreakdown.effectiveCostPerUnit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                sublabel="por peça"
                color="slate"
              />
              <StatCard
                label="Canais Ativos"
                value={String(nonBlocked.length)}
                sublabel={`de ${output.results.length} selecionados`}
                color="indigo"
              />
              {bestPrice && (
                <StatCard
                  label="Menor Preço"
                  value={`R$${bestPrice.recommendedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  sublabel={bestPrice.label}
                  color="emerald"
                />
              )}
              {bestProfit && (
                <StatCard
                  label="Maior Lucro"
                  value={`R$${bestProfit.recommendedProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  sublabel={`${bestProfit.label} · ${bestProfit.recommendedMarginPercent.toFixed(1)}%`}
                  color="violet"
                />
              )}
            </div>
          )}

          <ResultsPanel output={output} input={input} onInputChange={setInput} />
        </main>
      </div>
    </div>
  )
}

// ── Stat card ──────────────────────────────────────────────────────────────

type StatColor = 'slate' | 'indigo' | 'emerald' | 'violet'

const STAT_COLORS: Record<StatColor, string> = {
  slate:   'border-[#1e1e32] bg-[#0f0f1a] text-[#e8e8f0]',
  indigo:  'border-[#4f46e5]/30 bg-[#4f46e5]/5 text-indigo-300',
  emerald: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300',
  violet:  'border-violet-500/30 bg-violet-500/5 text-violet-300',
}

function StatCard({
  label, value, sublabel, color,
}: {
  label: string
  value: string
  sublabel: string
  color: StatColor
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${STAT_COLORS[color]}`}>
      <p className="text-xs text-[#6b6b8a] mb-1">{label}</p>
      <p className="text-xl font-mono font-bold tabular-nums leading-tight">{value}</p>
      <p className="text-xs text-[#6b6b8a] mt-0.5 truncate">{sublabel}</p>
    </div>
  )
}
