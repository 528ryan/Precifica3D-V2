'use client'

import type { CalculatorInput, MarketplaceToggles, ProductionInput, EnergyInput, SellerInput } from '@/types'
import { ML_CLASSICO_RANGE, ML_PREMIUM_RANGE } from '@/lib/marketplaceFees'
import Slider from '@/components/ui/Slider'
import CollapsibleSection from '@/components/ui/CollapsibleSection'
import PrinterSection from './PrinterSection'
import EnergySection from './EnergySection'
import ProductionSection from './ProductionSection'
import SellerSection from './SellerSection'
import MarketplaceSection from './MarketplaceSection'
import PresetManager from './PresetManager'

interface Props {
  value: CalculatorInput
  onChange: (v: CalculatorInput) => void
}

export default function InputPanel({ value, onChange }: Props) {
  const update = (partial: Partial<CalculatorInput>) =>
    onChange({ ...value, ...partial })

  const updateProduction = (partial: Partial<ProductionInput>) =>
    update({ production: { ...value.production, ...partial } })

  const updateEnergy = (partial: Partial<EnergyInput>) =>
    update({ energy: { ...value.energy, ...partial } })

  const updateSeller = (partial: Partial<SellerInput>) =>
    update({ seller: { ...value.seller, ...partial } })

  const toggleMarketplace = (key: keyof MarketplaceToggles, val: boolean) =>
    update({ marketplaces: { ...value.marketplaces, [key]: val } })

  return (
    <div className="space-y-3">
      <PresetManager currentInput={value} onLoad={(input) => onChange(input)} />

      <PrinterSection value={value.production} onChange={updateProduction} />
      <EnergySection value={value.energy} onChange={updateEnergy} />
      <ProductionSection value={value.production} onChange={updateProduction} />
      <SellerSection value={value.seller} onChange={updateSeller} />

      {/* Margin */}
      <CollapsibleSection title="Margem Desejada" icon="📈">
        <Slider
          label="Margem sobre preço de venda"
          value={value.desiredMarginPercent}
          onChange={(v) => update({ desiredMarginPercent: v })}
          min={5}
          max={80}
          displayValue={`${value.desiredMarginPercent}%`}
        />
        <p className="text-xs text-slate-500">
          Capacidade mensal calculada com base em 30 dias × 24h = 720h/mês.
        </p>
      </CollapsibleSection>

      <MarketplaceSection
        marketplaces={value.marketplaces}
        taxRegime={value.seller.taxRegime}
        mlClassicoOverride={value.mlClassicoCommissionOverride ?? ML_CLASSICO_RANGE.default}
        mlPremiumOverride={value.mlPremiumCommissionOverride ?? ML_PREMIUM_RANGE.default}
        onToggle={toggleMarketplace}
        onMlClassicoOverride={(v) => update({ mlClassicoCommissionOverride: v })}
        onMlPremiumOverride={(v) => update({ mlPremiumCommissionOverride: v })}
      />
    </div>
  )
}
