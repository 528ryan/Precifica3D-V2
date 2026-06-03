'use client'

import type { MarketplaceResult, PriceCandidate } from '@/types'
import Badge from '@/components/ui/Badge'

function brl(n: number): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const RANK_CONFIG = {
  1: {
    border:     'border-l-[#fbbf24]',
    bg:         'bg-[#fbbf24]/5',
    numStyle:   'text-[#fbbf24]',
    priceStyle: 'text-[#10b981]',
    label:      '1°',
  },
  2: {
    border:     'border-l-[#94a3b8]',
    bg:         'bg-white/[0.02]',
    numStyle:   'text-[#94a3b8]',
    priceStyle: 'text-[#e8e8f0]',
    label:      '2°',
  },
  3: {
    border:     'border-l-[#c07a3a]',
    bg:         'bg-white/[0.01]',
    numStyle:   'text-[#c07a3a]',
    priceStyle: 'text-[#6b6b8a]',
    label:      '3°',
  },
} as const

interface CandidateRowProps {
  candidate: PriceCandidate
  rank: 1 | 2 | 3
  currentMargin: number
}

function CandidateRow({ candidate, rank, currentMargin }: CandidateRowProps) {
  const cfg = RANK_CONFIG[rank]
  const impossible = candidate.isMathematicallyImpossible
  const isNegativeProfit = !impossible && candidate.netProfitPerUnit <= 0

  return (
    <div
      className={`px-4 py-3 border-l-4 ${cfg.border} ${cfg.bg} ${
        isNegativeProfit ? 'bg-red-500/5' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <span className={`text-xs font-mono font-bold ${cfg.numStyle} w-5 pt-0.5 shrink-0`}>
            {cfg.label}
          </span>
          {impossible ? (
            <span className="text-sm text-[#ef4444]">Matematicamente impossível</span>
          ) : (
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <span className={`text-xl font-mono font-bold leading-none ${cfg.priceStyle}`}>
                R${brl(candidate.price)}
              </span>
              <span
                className={`text-xs font-mono ${
                  candidate.netProfitPerUnit > 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                }`}
              >
                {candidate.netProfitPerUnit >= 0 ? '+' : ''}R${brl(candidate.netProfitPerUnit)}/un.
              </span>
              <span className="text-xs font-mono text-[#6b6b8a]">
                {candidate.marginPercent.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-1 shrink-0 flex-wrap justify-end">
          {rank === 1 && !impossible && (
            <Badge label="Recomendado" variant="indigo" size="xs" />
          )}
          {candidate.isUserMargin && !impossible && (
            <Badge label="Sua margem" variant="slate" size="xs" />
          )}
          {currentMargin === candidate.marginPercent && !impossible && !candidate.isUserMargin && (
            <Badge label="Selecionado" variant="emerald" size="xs" />
          )}
          {impossible && <Badge label="Impossível" variant="red" size="xs" />}
          {isNegativeProfit && !impossible && <Badge label="Prejuízo" variant="red" size="xs" />}
        </div>
      </div>
      {candidate.rationale && (
        <p className="text-xs text-[#6b6b8a] mt-2 ml-7 leading-relaxed">
          {candidate.rationale}
        </p>
      )}
    </div>
  )
}

interface Props {
  result: MarketplaceResult
  onMarginChange: (m: number) => void
  currentMargin: number
}

export default function MarketplaceCard({ result, onMarginChange, currentMargin }: Props) {
  if (result.isBlocked) {
    return (
      <div className="rounded-xl border border-[#1e1e32] bg-[#0f0f1a] px-4 py-3 opacity-60">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-[#e8e8f0]">{result.label}</span>
          <span className="text-xs text-[#ef4444]">{result.blockedReason}</span>
        </div>
      </div>
    )
  }

  const top3 = result.candidates.filter((c) => c.rank >= 1 && c.rank <= 3) as (PriceCandidate & { rank: 1 | 2 | 3 })[]
  const userOutside = result.candidates.find((c) => c.rank === 0 && c.isUserMargin)
  const { marginSuggestion } = result

  return (
    <div className="rounded-xl border border-[#1e1e32] bg-[#0f0f1a] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e32]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-syne font-semibold text-[#e8e8f0]">{result.label}</span>
          {result.isBestPrice && <Badge label="Menor Preço" variant="indigo" size="xs" />}
          {result.isBestProfit && <Badge label="Maior Lucro" variant="emerald" size="xs" />}
        </div>
        <span className="text-xs font-mono text-[#6b6b8a] shrink-0">{result.activeRule.label}</span>
      </div>

      {/* Top 3 candidates */}
      <div className="divide-y divide-[#1e1e32]/40">
        {top3.map((candidate) => (
          <CandidateRow
            key={candidate.rank}
            candidate={candidate}
            rank={candidate.rank}
            currentMargin={currentMargin}
          />
        ))}

        {/* User's price if outside top 3 */}
        {userOutside && !userOutside.isMathematicallyImpossible && (
          <div className="px-4 py-2.5 border-l-4 border-l-[#4f46e5]/60 bg-[#4f46e5]/5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-mono font-semibold text-[#4f46e5] shrink-0">Seu preço</span>
              <span className="text-base font-mono font-bold text-[#e8e8f0]">R${brl(userOutside.price)}</span>
              <span className={`text-xs font-mono ${userOutside.netProfitPerUnit >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                {userOutside.netProfitPerUnit >= 0 ? '+' : ''}R${brl(userOutside.netProfitPerUnit)}/un.
              </span>
              <span className="text-xs font-mono text-[#6b6b8a]">{userOutside.marginPercent.toFixed(1)}%</span>
            </div>
            {userOutside.rationale && (
              <p className="text-xs text-[#6b6b8a] mt-1.5 ml-16 leading-relaxed">{userOutside.rationale}</p>
            )}
          </div>
        )}

        {/* Impossible user candidate */}
        {userOutside?.isMathematicallyImpossible && (
          <div className="px-4 py-2.5 border-l-4 border-l-[#ef4444]/60 bg-[#ef4444]/5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-[#ef4444]">Sua margem</span>
              <span className="text-xs text-[#ef4444]">{userOutside.rationale}</span>
            </div>
          </div>
        )}
      </div>

      {/* Boundary warnings */}
      {result.boundaryWarnings.length > 0 && (
        <div className="px-4 py-2 border-t border-[#1e1e32] bg-amber-500/5 space-y-1">
          {result.boundaryWarnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-400">{w.message}</p>
          ))}
        </div>
      )}

      {/* Margin suggestion chips */}
      <div className="px-4 py-3 border-t border-[#1e1e32] bg-[#161624]">
        <p className="text-xs text-[#6b6b8a] mb-2">Sugestão de margem</p>
        <div className="flex flex-wrap gap-2">
          {[
            { value: marginSuggestion.conservative, label: 'Conservadora', title: marginSuggestion.conservativeRationale },
            { value: marginSuggestion.balanced,     label: 'Equilibrada',  title: marginSuggestion.balancedRationale },
            { value: marginSuggestion.aggressive,   label: 'Agressiva',    title: marginSuggestion.aggressiveRationale },
          ].map(({ value, label, title }) => (
            <button
              key={label}
              type="button"
              onClick={() => onMarginChange(value)}
              title={title}
              className={`px-2.5 py-1 rounded-full text-xs font-mono border transition-colors duration-150 ${
                currentMargin === value
                  ? 'bg-[#4f46e5] border-[#4f46e5] text-white'
                  : 'border-[#1e1e32] text-[#6b6b8a] hover:border-[#4f46e5]/60 hover:text-[#e8e8f0]'
              }`}
            >
              {value}% {label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      {result.notes && (
        <div className="px-4 py-2 border-t border-[#1e1e32]">
          <p className="text-xs text-[#6b6b8a]">{result.notes}</p>
        </div>
      )}
    </div>
  )
}
