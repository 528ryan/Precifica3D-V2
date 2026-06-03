'use client'

import type { ProductionInput } from '@/types'
import CollapsibleSection from '@/components/ui/CollapsibleSection'
import Slider from '@/components/ui/Slider'
import Field from './Field'

interface Props {
  value: ProductionInput
  onChange: (v: Partial<ProductionInput>) => void
}

export default function ProductionSection({ value, onChange }: Props) {
  const filamentCost = (value.filamentPricePerKg / 1000) * value.filamentWeightGrams
  const baseCost = filamentCost + value.postProcessingCost + value.otherDirectCosts
  const effectiveCost = baseCost / (1 - value.failureRatePercent / 100)

  function brl(n: number) {
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <CollapsibleSection title="Custo do Produto" icon="📦">
      {/* Filament */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Filamento" hint="R$/kg">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#6b6b8a]">R$</span>
            <input
              type="number"
              value={value.filamentPricePerKg}
              min={0}
              step={5}
              onChange={(e) => onChange({ filamentPricePerKg: parseFloat(e.target.value) || 0 })}
              className="input-base"
            />
          </div>
        </Field>
        <Field label="Peso usado" hint="gramas">
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={value.filamentWeightGrams}
              min={0}
              step={5}
              onChange={(e) => onChange({ filamentWeightGrams: parseFloat(e.target.value) || 0 })}
              className="input-base"
            />
            <span className="text-xs text-[#6b6b8a] shrink-0">g</span>
          </div>
        </Field>
      </div>

      {/* Post-processing */}
      <Field label="Pós-processamento" hint="R$ fixo (acabamento, pintura…)">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#6b6b8a]">R$</span>
          <input
            type="number"
            value={value.postProcessingCost}
            min={0}
            step={1}
            onChange={(e) => onChange({ postProcessingCost: parseFloat(e.target.value) || 0 })}
            className="input-base"
          />
        </div>
      </Field>

      {/* Other direct costs */}
      <Field label="Outros custos diretos" hint="R$ — embalagem, etiqueta, suporte…">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#6b6b8a]">R$</span>
          <input
            type="number"
            value={value.otherDirectCosts}
            min={0}
            step={0.5}
            onChange={(e) => onChange({ otherDirectCosts: parseFloat(e.target.value) || 0 })}
            className="input-base"
          />
        </div>
      </Field>

      {/* Failure rate */}
      <Slider
        label="Taxa de falha"
        value={value.failureRatePercent}
        onChange={(v) => onChange({ failureRatePercent: v })}
        min={0}
        max={50}
        displayValue={`${value.failureRatePercent}%`}
      />

      {/* Live effective cost */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-[#1e1e32]">
        <span className="text-xs text-[#6b6b8a]">Custo efetivo calculado</span>
        <span className="text-sm font-mono font-bold text-[#e8e8f0]">
          R${brl(effectiveCost)}
        </span>
      </div>
    </CollapsibleSection>
  )
}
