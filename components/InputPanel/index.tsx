'use client'

import type { CalculatorInput, ProductionInput, SellerInput, MarketplaceToggles, MLShipping } from '@/types'
import ProductionSection from './ProductionSection'
import SellerSection from './SellerSection'
import MarketplaceSection from './MarketplaceSection'

interface Props {
  value: CalculatorInput
  onChange: (v: CalculatorInput) => void
}

export default function InputPanel({ value, onChange }: Props) {
  const update = (partial: Partial<CalculatorInput>) =>
    onChange({ ...value, ...partial })

  const updateProduction = (partial: Partial<ProductionInput>) =>
    update({ production: { ...value.production, ...partial } })

  const updateSeller = (partial: Partial<SellerInput>) =>
    update({ seller: { ...value.seller, ...partial } })

  const toggleMarketplace = (key: keyof MarketplaceToggles, val: boolean) =>
    update({ marketplaces: { ...value.marketplaces, [key]: val } })

  const updateMlShipping = (v: MLShipping) =>
    update({ mlShipping: v })

  return (
    <div className="space-y-3">
      <ProductionSection value={value.production} onChange={updateProduction} />
      <SellerSection value={value.seller} onChange={updateSeller} />
      <MarketplaceSection
        marketplaces={value.marketplaces}
        taxRegime={value.seller.taxRegime}
        filamentWeightGrams={value.production.filamentWeightGrams}
        mlShipping={value.mlShipping}
        onToggle={toggleMarketplace}
        onMlShipping={updateMlShipping}
      />
    </div>
  )
}
