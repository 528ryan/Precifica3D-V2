'use client'

import type { SellerInput } from '@/types'
import { TAX_RULES } from '@/lib/taxRates'
import CollapsibleSection from '@/components/ui/CollapsibleSection'

interface Props {
  value: SellerInput
  onChange: (v: Partial<SellerInput>) => void
}

export default function SellerSection({ value, onChange }: Props) {
  const currentRule = TAX_RULES.find((r) => r.regime === value.taxRegime)

  return (
    <CollapsibleSection title="Regime Fiscal" icon="👤">
      <select
        value={value.taxRegime}
        onChange={(e) => onChange({ taxRegime: e.target.value as SellerInput['taxRegime'] })}
        className="input-base w-full"
      >
        {TAX_RULES.map((r) => (
          <option key={r.regime} value={r.regime}>
            {r.label}
          </option>
        ))}
      </select>

      {currentRule && (
        <div className="rounded-lg border border-[#1e1e32] bg-white/[0.02] p-3 space-y-1">
          <p className="text-xs text-[#6b6b8a] flex items-center gap-1.5">
            <span className="text-[#4f46e5] font-mono font-semibold">
              {currentRule.percentOnRevenue > 0
                ? `${(currentRule.percentOnRevenue * 100).toFixed(1)}%`
                : '0%'}
            </span>
            <span>sobre receita bruta</span>
          </p>
          <p className="text-xs text-[#6b6b8a]">{currentRule.description}</p>
          {currentRule.warning && (
            <p className="text-xs text-amber-400/80 flex items-start gap-1 pt-0.5">
              <span className="shrink-0">⚠</span>
              <span>{currentRule.warning}</span>
            </p>
          )}
        </div>
      )}
    </CollapsibleSection>
  )
}
