import type { TaxRegime, FlagColor } from '@/types'

// ── Tax Rules ──────────────────────────────────────────────────────────────

export interface TaxRule {
  regime: TaxRegime
  label: string
  shortLabel: string
  percentOnRevenue: number  // decimal: 0.04 = 4%
  description: string
  warning?: string
}

export const TAX_RULES: TaxRule[] = [
  {
    regime: 'cpf',
    label: 'CPF — Pessoa Física',
    shortLabel: 'CPF',
    percentOnRevenue: 0.0,
    description: '0% por venda — declaração no IR anual',
    warning: 'Vendas recorrentes como CPF podem exigir CNPJ. Consulte um contador.',
  },
  {
    regime: 'mei',
    label: 'MEI — Microempreendedor Individual',
    shortLabel: 'MEI',
    percentOnRevenue: 0.0,
    description: '0% por venda — DAS fixo mensal (não entra no cálculo)',
    warning: 'Limite de faturamento: R$81.000/ano ≈ R$6.750/mês.',
  },
  {
    regime: 'me_simples',
    label: 'ME — Simples Nacional',
    shortLabel: 'Simples',
    percentOnRevenue: 0.04,
    description: '4,0% sobre receita bruta — Faixa 1 (até R$180k/ano)',
  },
  {
    regime: 'lucro_presumido',
    label: 'ME — Lucro Presumido',
    shortLabel: 'Presumido',
    percentOnRevenue: 0.145,
    description: '≈14,5% estimativa conservadora (IRPJ + CSLL + PIS + COFINS)',
  },
  {
    regime: 'lucro_real',
    label: 'Lucro Real',
    shortLabel: 'L. Real',
    percentOnRevenue: 0.15,
    description: '≈15% placeholder — carga real é muito variável',
    warning: 'Estimativa. Consulte seu contador para cálculo preciso.',
  },
]

export function getTaxRule(regime: TaxRegime): TaxRule {
  const rule = TAX_RULES.find((r) => r.regime === regime)
  if (!rule) throw new Error(`Regime desconhecido: ${regime}`)
  return rule
}

// ── Energy Flags (ANEEL — março 2026) ─────────────────────────────────────

export interface EnergyFlag {
  id: FlagColor
  label: string
  emoji: string
  surchargePerKwh: number  // R$/kWh adicional
}

export const ENERGY_FLAGS: EnergyFlag[] = [
  { id: 'verde',     label: 'Verde',               emoji: '🟢', surchargePerKwh: 0.0000  },
  { id: 'amarela',   label: 'Amarela',              emoji: '🟡', surchargePerKwh: 0.01880 },
  { id: 'vermelha1', label: 'Vermelha – Patamar 1', emoji: '🔴', surchargePerKwh: 0.04460 },
  { id: 'vermelha2', label: 'Vermelha – Patamar 2', emoji: '🔴', surchargePerKwh: 0.07870 },
]

export const DEFAULT_ENERGY_FLAG = ENERGY_FLAGS[0]

export function getEnergyFlag(id: FlagColor): EnergyFlag {
  const flag = ENERGY_FLAGS.find((f) => f.id === id)
  if (!flag) throw new Error(`Bandeira desconhecida: ${id}`)
  return flag
}
