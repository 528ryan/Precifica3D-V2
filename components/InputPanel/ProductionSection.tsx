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
  return (
    <CollapsibleSection title="Produção" icon="🏭">
      {/* Print time */}
      <div>
        <p className="text-xs font-medium text-slate-400 mb-1.5">Tempo de impressão</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={value.printTimeHours}
              min={0}
              max={999}
              step={1}
              onChange={(e) =>
                onChange({ printTimeHours: parseInt(e.target.value) || 0 })
              }
              className="input-base text-center"
            />
            <span className="text-xs text-slate-500 shrink-0">h</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={value.printTimeMinutes}
              min={0}
              max={59}
              step={1}
              onChange={(e) =>
                onChange({ printTimeMinutes: parseInt(e.target.value) || 0 })
              }
              className="input-base text-center"
            />
            <span className="text-xs text-slate-500 shrink-0">min</span>
          </div>
        </div>
        {value.printTimeHours === 0 && value.printTimeMinutes === 0 && (
          <p className="text-xs text-red-400 mt-1">⚠ Defina o tempo de impressão.</p>
        )}
      </div>

      {/* Filament */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Filamento" hint="R$/kg">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">R$</span>
            <input
              type="number"
              value={value.filamentPricePerKg}
              min={0}
              step={5}
              onChange={(e) =>
                onChange({ filamentPricePerKg: parseFloat(e.target.value) || 0 })
              }
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
              onChange={(e) =>
                onChange({ filamentWeightGrams: parseFloat(e.target.value) || 0 })
              }
              className="input-base"
            />
            <span className="text-xs text-slate-500 shrink-0">g</span>
          </div>
        </Field>
      </div>

      {/* Labor */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Mão de obra" hint="R$/h">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">R$</span>
            <input
              type="number"
              value={value.laborRatePerHour}
              min={0}
              step={5}
              onChange={(e) =>
                onChange({ laborRatePerHour: parseFloat(e.target.value) || 0 })
              }
              className="input-base"
            />
          </div>
        </Field>
        <Field label="Horas MO">
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={value.laborHours}
              min={0}
              step={0.5}
              onChange={(e) =>
                onChange({ laborHours: parseFloat(e.target.value) || 0 })
              }
              className="input-base"
            />
            <span className="text-xs text-slate-500 shrink-0">h</span>
          </div>
        </Field>
      </div>

      {/* Post processing */}
      <Field label="Pós-processamento" hint="R$ fixo">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500">R$</span>
          <input
            type="number"
            value={value.postProcessingCost}
            min={0}
            step={1}
            onChange={(e) =>
              onChange({ postProcessingCost: parseFloat(e.target.value) || 0 })
            }
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
    </CollapsibleSection>
  )
}
