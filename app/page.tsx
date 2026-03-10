'use client'

import { useMemo, useState } from 'react'
import InputPanel from '@/components/InputPanel'
import ResultsPanel from '@/components/ResultsPanel'
import { calculatePricing } from '@/lib/pricingCalculator'
import type { CalculatorInput } from '@/types'
import { PRINTER_PRESETS } from '@/lib/printerPresets'
import { ML_CLASSICO_RANGE, ML_PREMIUM_RANGE } from '@/lib/marketplaceFees'

const DEFAULT_INPUT: CalculatorInput = {
  production: {
    printer: PRINTER_PRESETS[0],  // Bambu Lab A1 Mini
    printTimeHours: 3,
    printTimeMinutes: 0,
    filamentPricePerKg: 80,
    filamentWeightGrams: 50,
    laborRatePerHour: 20,
    laborHours: 0.5,
    postProcessingCost: 2,
    failureRatePercent: 5,
  },
  energy: {
    baseTariffPerKwh: 0.75,
    flagSurchargePerKwh: 0,
    flagColor: 'verde',
  },
  seller: {
    taxRegime: 'mei',
  },
  marketplaces: {
    mlClassico: true,
    mlPremium: true,
    shopeeCpfSemFrete: true,
    shopeeCpfComFrete: false,
    shopeeCnpj: false,
    tiktokShop: true,
    vendaDireta: false,
  },
  desiredMarginPercent: 30,
  mlClassicoCommissionOverride: ML_CLASSICO_RANGE.default,
  mlPremiumCommissionOverride: ML_PREMIUM_RANGE.default,
}

export default function Home() {
  const [input, setInput] = useState<CalculatorInput>(DEFAULT_INPUT)
  const output = useMemo(() => calculatePricing(input), [input])

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* ── Header ── */}
      <header className="sticky top-0 z-10 border-b border-dark-border bg-dark-bg/80 backdrop-blur-md">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-base">
              🖨️
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-100 leading-none">Precifica3D</h1>
              <p className="text-xs text-slate-500 mt-0.5">Impressão 3D · Precificação</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-slate-600 border border-dark-border rounded-full px-2.5 py-1">
              Taxas março 2026
            </span>
          </div>
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col xl:flex-row gap-6 items-start">
        {/* Input sidebar */}
        <aside className="w-full xl:w-[420px] shrink-0 xl:sticky xl:top-[57px] xl:max-h-[calc(100vh-57px)] xl:overflow-y-auto space-y-3 pb-6">
          <InputPanel value={input} onChange={setInput} />
        </aside>

        {/* Results area */}
        <main className="flex-1 min-w-0 space-y-4">
          {/* Summary strip */}
          {output.validationErrors.length === 0 && output.results.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                label="Custo Efetivo"
                value={`R$${output.effectiveCostWithFailures.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                sublabel="por peça"
                color="slate"
              />
              <StatCard
                label="Peças / Mês"
                value={String(output.unitsPerMonth)}
                sublabel="capacidade máx."
                color="indigo"
              />
              {output.bestPrice && (() => {
                const r = output.results.find((x) => x.key === output.bestPrice)
                return r ? (
                  <StatCard
                    label="Menor Preço"
                    value={`R$${r.recommendedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    sublabel={r.label}
                    color="emerald"
                  />
                ) : null
              })()}
              {output.bestProfit && (() => {
                const r = output.results.find((x) => x.key === output.bestProfit)
                return r ? (
                  <StatCard
                    label="Maior Lucro"
                    value={`R$${r.netProfitPerUnit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    sublabel={`${r.label} · ${r.effectiveMarginPercent.toFixed(1)}%`}
                    color="violet"
                  />
                ) : null
              })()}
            </div>
          )}

          <ResultsPanel output={output} input={input} />
        </main>
      </div>
    </div>
  )
}

// ── Stat card ──────────────────────────────────────────────────────────────

type StatColor = 'slate' | 'indigo' | 'emerald' | 'violet'

const STAT_COLORS: Record<StatColor, string> = {
  slate:   'border-dark-border bg-dark-surface text-slate-200',
  indigo:  'border-indigo-500/30 bg-indigo-500/5 text-indigo-300',
  emerald: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300',
  violet:  'border-violet-500/30 bg-violet-500/5 text-violet-300',
}

function StatCard({
  label,
  value,
  sublabel,
  color,
}: {
  label: string
  value: string
  sublabel: string
  color: StatColor
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${STAT_COLORS[color]}`}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-xl font-bold tabular-nums leading-tight">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5 truncate">{sublabel}</p>
    </div>
  )
}
