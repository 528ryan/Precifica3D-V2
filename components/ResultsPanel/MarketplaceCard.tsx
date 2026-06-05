'use client'

import { useState } from 'react'
import type { MarketplaceResult } from '@/types'

interface Props {
  result: MarketplaceResult
  onMarginChange: (m: number) => void
  currentMargin: number
}

function brl(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function MarketplaceCard({ result, onMarginChange, currentMargin }: Props) {
  const [showBreakdown, setShowBreakdown] = useState(false)

  const {
    label,
    appliedRule,
    recommendedPrice,
    recommendedProfit,
    recommendedMarginPercent,
    alternative,
    boundaryWarning,
    marginSuggestion,
    feeBreakdown,
    warnings,
    isBlocked,
    blockedReason,
    isBestPrice,
    isBestProfit,
  } = result

  const profitable = recommendedProfit > 0

  const borderColor = isBlocked
    ? 'border-l-amber-500/60'
    : profitable
    ? 'border-l-emerald-500/60'
    : 'border-l-red-500/60'

  return (
    <div className={`rounded-xl border border-[#1e1e32] bg-[#0f0f1a] overflow-hidden border-l-2 ${borderColor}`}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e32]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-syne font-semibold text-[#e8e8f0] truncate">{label}</span>
          {!isBlocked && (
            <span className="shrink-0 text-[10px] font-mono text-[#6b6b8a] border border-[#1e1e32] rounded px-1.5 py-0.5">
              {appliedRule.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {isBestPrice && (
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              menor preço
            </span>
          )}
          {isBestProfit && (
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
              maior lucro
            </span>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-4 py-3 space-y-3">

        {isBlocked ? (
          <p className="text-sm text-amber-400/80">{blockedReason}</p>
        ) : (
          <>
            {/* Recommended price */}
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-[10px] text-[#6b6b8a] mb-0.5">
                  Preço recomendado · {recommendedMarginPercent}% margem
                </p>
                <p className={`text-2xl font-mono font-bold tabular-nums leading-none ${
                  profitable ? 'text-[#e8e8f0]' : 'text-red-400'
                }`}>
                  R${brl(recommendedPrice)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[#6b6b8a] mb-0.5">lucro/peça</p>
                <p className={`text-base font-mono font-semibold tabular-nums ${
                  profitable ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {profitable ? '+' : ''}R${brl(recommendedProfit)}
                </p>
              </div>
            </div>

            {/* Fee breakdown — collapsible */}
            {recommendedPrice > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowBreakdown((v) => !v)}
                  className="flex items-center gap-1 text-[10px] text-[#6b6b8a] hover:text-[#a8a8c0] transition-colors duration-150"
                >
                  <svg
                    className={`w-3 h-3 transition-transform duration-150 ${showBreakdown ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  {showBreakdown ? 'Ocultar detalhamento' : 'Ver detalhamento'}
                </button>

                {showBreakdown && (
                  <div className="mt-2 rounded-lg border border-[#1e1e32] bg-white/[0.02] px-3 py-2.5 space-y-1.5">

                    {/* Custo efetivo */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#6b6b8a]">Custo efetivo</span>
                      <span className="font-mono text-xs text-[#a8a8c0]">R${brl(feeBreakdown.effectiveCost)}</span>
                    </div>

                    {/* Comissão */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#6b6b8a]">
                        Comissão ({feeBreakdown.commissionPercent}%)
                      </span>
                      <span className="font-mono text-xs text-[#6b6b8a]">−R${brl(feeBreakdown.commissionAmount)}</span>
                    </div>

                    {/* Taxa fixa — só exibe quando > 0 */}
                    {feeBreakdown.fixedFee > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#6b6b8a]">Taxa fixa</span>
                        <span className="font-mono text-xs text-[#6b6b8a]">−R${brl(feeBreakdown.fixedFee)}</span>
                      </div>
                    )}

                    {/* Custo operacional ML — só exibe quando > 0 */}
                    {feeBreakdown.mlOperationalCost > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#6b6b8a]">Custo operacional ML</span>
                        <span className="font-mono text-xs text-[#6b6b8a]">−R${brl(feeBreakdown.mlOperationalCost)}</span>
                      </div>
                    )}

                    {/* Imposto */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#6b6b8a]">
                        Imposto ({feeBreakdown.taxPercent}%)
                      </span>
                      <span className="font-mono text-xs text-[#6b6b8a]">−R${brl(feeBreakdown.taxAmount)}</span>
                    </div>

                    {/* Separador */}
                    <div className="border-t border-[#1e1e32] pt-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#6b6b8a]">Lucro líquido</span>
                        <span className="font-mono text-xs text-emerald-400 font-semibold">
                          +R${brl(feeBreakdown.netProfit)}
                        </span>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* Alternative (conservative) price */}
            {alternative && (
              <div className="flex items-baseline justify-between px-3 py-2 rounded-lg bg-white/[0.025] border border-[#1e1e32]">
                <div>
                  <p className="text-[10px] text-[#6b6b8a] mb-0.5">
                    {alternative.label} · {alternative.marginPercent}% margem
                  </p>
                  <p className="text-base font-mono font-medium text-[#a8a8c0] tabular-nums">
                    R${brl(alternative.price)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[#6b6b8a] mb-0.5">lucro/peça</p>
                  <p className="text-sm font-mono text-[#6b6b8a] tabular-nums">
                    +R${brl(alternative.profit)}
                  </p>
                </div>
              </div>
            )}

            {/* Boundary warning */}
            {boundaryWarning && (
              <p className="text-xs text-amber-400/90">{boundaryWarning.message}</p>
            )}

            {/* Margin chips */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {[
                { value: marginSuggestion.conservative, label: 'Conservadora' },
                { value: marginSuggestion.balanced,     label: 'Equilibrada'  },
                { value: marginSuggestion.aggressive,   label: 'Agressiva'    },
              ].map(({ value, label: chipLabel }) => (
                <button
                  key={chipLabel}
                  type="button"
                  onClick={() => onMarginChange(value)}
                  className={`px-2.5 py-1 rounded-full text-xs font-mono border transition-colors duration-150 ${
                    currentMargin === value
                      ? 'bg-[#4f46e5] border-[#4f46e5] text-white'
                      : 'border-[#1e1e32] text-[#6b6b8a] hover:border-[#4f46e5]/60 hover:text-[#e8e8f0]'
                  }`}
                >
                  {value}% {chipLabel}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Channel notes */}
        {warnings.map((w, i) => (
          <p key={i} className="text-xs text-[#6b6b8a] flex items-start gap-1">
            <span className="shrink-0">ℹ</span>
            <span>{w}</span>
          </p>
        ))}
      </div>
    </div>
  )
}
