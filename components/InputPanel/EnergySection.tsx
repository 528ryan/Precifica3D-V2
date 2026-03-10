'use client'

import type { EnergyInput } from '@/types'
import { ENERGY_FLAGS } from '@/lib/taxRates'
import CollapsibleSection from '@/components/ui/CollapsibleSection'
import Field from './Field'

interface Props {
  value: EnergyInput
  onChange: (v: Partial<EnergyInput>) => void
}

export default function EnergySection({ value, onChange }: Props) {
  const effectiveTariff = value.baseTariffPerKwh + value.flagSurchargePerKwh
  const selectedFlag = ENERGY_FLAGS.find((f) => f.id === value.flagColor) ?? ENERGY_FLAGS[0]

  return (
    <CollapsibleSection title="Energia Elétrica" icon="⚡">
      <Field label="Tarifa base" hint="R$/kWh">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">R$</span>
          <input
            type="number"
            value={value.baseTariffPerKwh}
            min={0}
            max={5}
            step={0.01}
            onChange={(e) =>
              onChange({ baseTariffPerKwh: parseFloat(e.target.value) || 0 })
            }
            className="input-base"
          />
        </div>
      </Field>

      <Field label="Bandeira tarifária (ANEEL)">
        <select
          value={value.flagColor}
          onChange={(e) => {
            const flag = ENERGY_FLAGS.find((f) => f.id === e.target.value)
            if (flag) {
              onChange({
                flagColor: flag.id,
                flagSurchargePerKwh: flag.surchargePerKwh,
              })
            }
          }}
          className="input-base"
        >
          {ENERGY_FLAGS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.emoji} {f.label}
              {f.surchargePerKwh > 0 ? ` (+R$${f.surchargePerKwh.toFixed(5)}/kWh)` : ' (sem acréscimo)'}
            </option>
          ))}
        </select>
      </Field>

      {/* Effective tariff display */}
      <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.03] border border-dark-border">
        <span className="text-xs text-slate-400">Tarifa efetiva</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{selectedFlag.emoji}</span>
          <span className="text-sm font-bold text-slate-200 tabular-nums">
            R${effectiveTariff.toFixed(4)}/kWh
          </span>
        </div>
      </div>
    </CollapsibleSection>
  )
}
