'use client'

import type { CalculatorInput, MarketplaceToggles, TaxRegime } from '@/types'
import { FEE_CONFIGS, ML_CLASSICO_RANGE, ML_PREMIUM_RANGE } from '@/lib/marketplaceFees'
import CollapsibleSection from '@/components/ui/CollapsibleSection'
import Toggle from '@/components/ui/Toggle'
import Slider from '@/components/ui/Slider'
import Badge from '@/components/ui/Badge'

interface Props {
  marketplaces: MarketplaceToggles
  taxRegime: TaxRegime
  mlClassicoOverride?: number
  mlPremiumOverride?: number
  onToggle: (key: keyof MarketplaceToggles, value: boolean) => void
  onMlClassicoOverride: (v: number) => void
  onMlPremiumOverride: (v: number) => void
}

// Marketplace icons
const ICONS: Partial<Record<keyof MarketplaceToggles, string>> = {
  mlClassico: '🛒',
  mlPremium: '⭐',
  shopeeCpfSemFrete: '🛍️',
  shopeeCpfComFrete: '🚚',
  shopeeCnpj: '🏪',
  tiktokShop: '🎵',
  vendaDireta: '🤝',
}

export default function MarketplaceSection({
  marketplaces,
  taxRegime,
  mlClassicoOverride,
  mlPremiumOverride,
  onToggle,
  onMlClassicoOverride,
  onMlPremiumOverride,
}: Props) {
  const activeCount = Object.values(marketplaces).filter(Boolean).length

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
        {FEE_CONFIGS.map((config) => {
          const isEnabled = marketplaces[config.key]
          const isCpf = taxRegime === 'cpf'
          const isBlocked = config.blockForCpf && isCpf
          const icon = ICONS[config.key] ?? '🏬'

          return (
            <div
              key={config.key}
              className={`rounded-lg border transition-colors duration-150 overflow-hidden ${
                isEnabled
                  ? 'border-indigo-500/30 bg-indigo-500/5'
                  : 'border-dark-border bg-white/[0.01]'
              }`}
            >
              <div className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base">{icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-medium text-slate-200 truncate">
                        {config.label}
                      </span>
                      {isBlocked && (
                        <Badge label="Requer CNPJ" variant="amber" size="xs" />
                      )}
                    </div>
                    {isEnabled && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {config.commissionDescription}
                      </p>
                    )}
                  </div>
                </div>
                <Toggle
                  checked={isEnabled}
                  onChange={(v) => onToggle(config.key, v)}
                />
              </div>

              {/* ML commission sliders */}
              {isEnabled && config.key === 'mlClassico' && (
                <div className="px-3 pb-3">
                  <Slider
                    label="Comissão Clássico"
                    value={mlClassicoOverride ?? ML_CLASSICO_RANGE.default}
                    onChange={onMlClassicoOverride}
                    min={ML_CLASSICO_RANGE.min}
                    max={ML_CLASSICO_RANGE.max}
                    displayValue={`${mlClassicoOverride ?? ML_CLASSICO_RANGE.default}%`}
                  />
                </div>
              )}

              {isEnabled && config.key === 'mlPremium' && (
                <div className="px-3 pb-3">
                  <Slider
                    label="Comissão Premium"
                    value={mlPremiumOverride ?? ML_PREMIUM_RANGE.default}
                    onChange={onMlPremiumOverride}
                    min={ML_PREMIUM_RANGE.min}
                    max={ML_PREMIUM_RANGE.max}
                    displayValue={`${mlPremiumOverride ?? ML_PREMIUM_RANGE.default}%`}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </CollapsibleSection>
  )
}
