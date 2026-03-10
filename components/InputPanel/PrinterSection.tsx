'use client'

import type { ProductionInput } from '@/types'
import { PRINTER_PRESETS } from '@/lib/printerPresets'
import CollapsibleSection from '@/components/ui/CollapsibleSection'
import Field from './Field'

interface Props {
  value: ProductionInput
  onChange: (v: Partial<ProductionInput>) => void
}

export default function PrinterSection({ value, onChange }: Props) {
  const isCustom = value.printer.id === 'custom'

  return (
    <CollapsibleSection title="Impressora" icon="🖨️">
      <Field label="Modelo">
        <select
          value={value.printer.id}
          onChange={(e) => {
            const preset = PRINTER_PRESETS.find((p) => p.id === e.target.value)
            if (preset) onChange({ printer: preset })
          }}
          className="input-base"
        >
          {PRINTER_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>

      {!isCustom && value.printer.avgWatts > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500/5 border border-indigo-500/15">
          <span className="text-lg">⚡</span>
          <div>
            <p className="text-xs text-slate-400">Consumo médio medido</p>
            <p className="text-sm font-semibold text-indigo-300">{value.printer.avgWatts} W</p>
          </div>
        </div>
      )}

      {isCustom && (
        <Field label="Consumo médio da impressora" hint="Watts durante impressão">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={value.printer.avgWatts || ''}
              min={1}
              max={2000}
              placeholder="ex: 200"
              onChange={(e) =>
                onChange({
                  printer: { ...value.printer, avgWatts: parseFloat(e.target.value) || 0 },
                })
              }
              className="input-base"
            />
            <span className="text-sm text-slate-500 shrink-0">W</span>
          </div>
          {value.printer.avgWatts <= 0 && (
            <p className="text-xs text-red-400 mt-1">
              ⚠ Informe o consumo para calcular a energia elétrica.
            </p>
          )}
        </Field>
      )}
    </CollapsibleSection>
  )
}
