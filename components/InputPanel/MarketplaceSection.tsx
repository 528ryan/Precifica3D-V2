'use client'

import type { MarketplaceToggles, MarketplaceOverrides, MLShipping, TaxRegime } from '@/types'
import { MARKETPLACE_FEES, ML_CLASSICO_RANGE, ML_PREMIUM_RANGE, getMLOperationalCost } from '@/lib/marketplaceFees'
import CollapsibleSection from '@/components/ui/CollapsibleSection'
import Toggle from '@/components/ui/Toggle'
import Slider from '@/components/ui/Slider'
import Badge from '@/components/ui/Badge'

interface Props {
  marketplaces: MarketplaceToggles
  overrides: MarketplaceOverrides
  taxRegime: TaxRegime
  filamentWeightGrams: number
  mlShipping: MLShipping
  onToggle: (key: keyof MarketplaceToggles, value: boolean) => void
  onOverride: (partial: Partial<MarketplaceOverrides>) => void
  onMlShipping: (v: MLShipping) => void
}

const ICONS: Record<string, string> = {
  ml_classico:  '🛒',
  ml_premium:   '⭐',
  shopee:       '🛍️',
  tiktok:       '🎵',
  venda_direta: '🤝',
}

export default function MarketplaceSection({
  marketplaces,
  overrides,
  taxRegime,
  filamentWeightGrams,
  mlShipping,
  onToggle,
  onOverride,
  onMlShipping,
}: Props) {
  const activeCount = Object.values(marketplaces).filter(Boolean).length
  const hasCNPJ = taxRegime !== 'cpf'

  const totalWeightG = filamentWeightGrams + mlShipping.packagingWeightG
  const weightRule   = getMLOperationalCost(totalWeightG)
  const isOverWeight = totalWeightG > 30000

  return (
    <CollapsibleSection
      title="Canais de Venda"
      icon="📦"
      badge={
        activeCount > 0 ? (
          <Badge label={`${activeCount} ativos`} variant="indigo" size="xs" />
        ) : undefined
      }
    >
      <div className="space-y-2">
        {MARKETPLACE_FEES.map((config) => {
          const key = config.key as keyof MarketplaceToggles
          const isEnabled = marketplaces[key]
          const isBlocked = config.requiresCNPJ && !hasCNPJ
          const icon = ICONS[config.key] ?? '🏬'
          const isMlChannel = config.key === 'ml_classico' || config.key === 'ml_premium'

          return (
            <div
              key={config.key}
              className={`rounded-lg border transition-colors duration-150 overflow-hidden ${
                isEnabled
                  ? 'border-[#4f46e5]/30 bg-[#4f46e5]/5'
                  : 'border-[#1e1e32] bg-white/[0.01]'
              }`}
            >
              {/* Toggle row */}
              <div className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base">{icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-medium text-[#e8e8f0] truncate">
                        {config.label}
                      </span>
                      {isBlocked && (
                        <Badge label="Requer CNPJ" variant="amber" size="xs" />
                      )}
                    </div>
                    {isEnabled && (
                      <p className="text-xs text-[#6b6b8a] mt-0.5 truncate">
                        {config.notes}
                      </p>
                    )}
                  </div>
                </div>
                <Toggle
                  checked={isEnabled}
                  onChange={(v) => onToggle(key, v)}
                />
              </div>

              {/* ML channels — commission slider + weight block */}
              {isEnabled && isMlChannel && (
                <div className="px-3 pb-3 space-y-3 border-t border-[#1e1e32]/50">
                  {/* Commission slider */}
                  <div className="pt-2">
                    <Slider
                      label="Comissão"
                      value={config.key === 'ml_classico' ? overrides.mlClassicoCommission : overrides.mlPremiumCommission}
                      onChange={(v) =>
                        onOverride(
                          config.key === 'ml_classico'
                            ? { mlClassicoCommission: v }
                            : { mlPremiumCommission: v }
                        )
                      }
                      min={config.key === 'ml_classico' ? ML_CLASSICO_RANGE.min : ML_PREMIUM_RANGE.min}
                      max={config.key === 'ml_classico' ? ML_CLASSICO_RANGE.max : ML_PREMIUM_RANGE.max}
                      displayValue={`${config.key === 'ml_classico' ? overrides.mlClassicoCommission : overrides.mlPremiumCommission}%`}
                    />
                  </div>

                  {/* Weight block */}
                  <div className="space-y-1.5 pt-1">
                    <p className="text-xs font-medium text-[#6b6b8a]">Peso do envio</p>

                    {/* Produto — read-only */}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[#6b6b8a] w-24 shrink-0">Produto</p>
                      <div className="flex items-center gap-1.5 flex-1 justify-end">
                        <input
                          type="number"
                          value={filamentWeightGrams}
                          readOnly
                          className="input-base w-20 opacity-50 cursor-not-allowed text-right"
                        />
                        <span className="text-xs text-[#6b6b8a] w-3">g</span>
                      </div>
                    </div>

                    {/* Embalagem — editable */}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[#6b6b8a] w-24 shrink-0">Embalagem</p>
                      <div className="flex items-center gap-1.5 flex-1 justify-end">
                        <input
                          type="number"
                          value={mlShipping.packagingWeightG}
                          min={0}
                          step={10}
                          onChange={(e) =>
                            onMlShipping({ packagingWeightG: parseFloat(e.target.value) || 0 })
                          }
                          className="input-base w-20 text-right"
                        />
                        <span className="text-xs text-[#6b6b8a] w-3">g</span>
                      </div>
                    </div>

                    {/* Divider + total */}
                    <div className="border-t border-[#1e1e32]/70 pt-1.5 flex items-center justify-between">
                      <p className="text-xs text-[#6b6b8a] w-24 shrink-0">Total</p>
                      <p className="font-mono text-sm text-[#e8e8f0]">
                        {totalWeightG.toLocaleString('pt-BR')}g
                      </p>
                    </div>

                    {/* Custo calculado */}
                    <div className="rounded-md bg-white/[0.02] border border-[#1e1e32] px-2.5 py-1.5 mt-1">
                      <p className="text-xs text-[#6b6b8a]">
                        Custo operacional ML:{' '}
                        <span className="font-mono text-[#e8e8f0]">
                          R$ {weightRule.operationalCost.toFixed(2).replace('.', ',')}
                        </span>
                        {' · '}Faixa: {weightRule.label}
                      </p>
                      <p className="text-xs text-[#6b6b8a] mt-0.5">(calculado automaticamente)</p>
                    </div>

                    {isOverWeight && (
                      <p className="text-xs text-[#f59e0b]">
                        Peso acima de 30kg — consulte o ML para tarifas especiais
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Non-ML channels — no extra controls */}
            </div>
          )
        })}
      </div>
    </CollapsibleSection>
  )
}
