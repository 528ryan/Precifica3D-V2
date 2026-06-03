'use client'

import type { MarketplaceToggles, MarketplaceOverrides, TaxRegime } from '@/types'
import { MARKETPLACE_FEES } from '@/lib/marketplaceFees'
import { ML_CLASSICO_RANGE, ML_PREMIUM_RANGE } from '@/lib/marketplaceFees'
import CollapsibleSection from '@/components/ui/CollapsibleSection'
import Toggle from '@/components/ui/Toggle'
import Slider from '@/components/ui/Slider'
import Badge from '@/components/ui/Badge'
import Field from './Field'

interface Props {
  marketplaces: MarketplaceToggles
  overrides: MarketplaceOverrides
  taxRegime: TaxRegime
  onToggle: (key: keyof MarketplaceToggles, value: boolean) => void
  onOverride: (partial: Partial<MarketplaceOverrides>) => void
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
  onToggle,
  onOverride,
}: Props) {
  const activeCount = Object.values(marketplaces).filter(Boolean).length
  const hasCNPJ = taxRegime !== 'cpf'

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

              {/* ML Clássico — commission slider + operational cost */}
              {isEnabled && config.key === 'ml_classico' && (
                <div className="px-3 pb-3 space-y-3 border-t border-[#1e1e32]/50">
                  <div className="pt-2">
                    <Slider
                      label="Comissão"
                      value={overrides.mlClassicoCommission}
                      onChange={(v) => onOverride({ mlClassicoCommission: v })}
                      min={ML_CLASSICO_RANGE.min}
                      max={ML_CLASSICO_RANGE.max}
                      displayValue={`${overrides.mlClassicoCommission}%`}
                    />
                  </div>
                  <Field label="Custo operacional" hint="R$/un. — consulte o Seller Center (peso + dimensão)">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[#6b6b8a]">R$</span>
                      <input
                        type="number"
                        value={overrides.mlOperationalCostPerUnit}
                        min={0}
                        step={0.5}
                        onChange={(e) =>
                          onOverride({ mlOperationalCostPerUnit: parseFloat(e.target.value) || 0 })
                        }
                        className="input-base"
                      />
                    </div>
                  </Field>
                </div>
              )}

              {/* ML Premium — commission slider */}
              {isEnabled && config.key === 'ml_premium' && (
                <div className="px-3 pb-3 border-t border-[#1e1e32]/50">
                  <div className="pt-2">
                    <Slider
                      label="Comissão"
                      value={overrides.mlPremiumCommission}
                      onChange={(v) => onOverride({ mlPremiumCommission: v })}
                      min={ML_PREMIUM_RANGE.min}
                      max={ML_PREMIUM_RANGE.max}
                      displayValue={`${overrides.mlPremiumCommission}%`}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </CollapsibleSection>
  )
}
