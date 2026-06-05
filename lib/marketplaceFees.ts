import type { FeeRule } from '@/types'

// ── ML operational cost by weight (março 2026) ───────────────────────────────

export interface MLWeightRule {
  maxWeightG: number      // limite superior da faixa em gramas (inclusive)
  operationalCost: number // R$ cobrado pelo ML nessa faixa
  label: string           // ex: "Até 100g"
}

// Tabela vigente março 2026 — Mercado Livre custo operacional por peso
// Fonte: tabela de tarifas do Seller Center ML Brasil
export const ML_WEIGHT_RULES: MLWeightRule[] = [
  { maxWeightG: 100,   operationalCost: 3.99,  label: 'Até 100g'  },
  { maxWeightG: 300,   operationalCost: 5.49,  label: 'Até 300g'  },
  { maxWeightG: 700,   operationalCost: 7.49,  label: 'Até 700g'  },
  { maxWeightG: 1000,  operationalCost: 8.99,  label: 'Até 1kg'   },
  { maxWeightG: 2000,  operationalCost: 11.99, label: 'Até 2kg'   },
  { maxWeightG: 5000,  operationalCost: 16.99, label: 'Até 5kg'   },
  { maxWeightG: 10000, operationalCost: 22.99, label: 'Até 10kg'  },
  { maxWeightG: 15000, operationalCost: 28.99, label: 'Até 15kg'  },
  { maxWeightG: 30000, operationalCost: 39.99, label: 'Até 30kg'  },
]

export function getMLOperationalCost(totalWeightG: number): MLWeightRule {
  return (
    ML_WEIGHT_RULES.find((r) => totalWeightG <= r.maxWeightG) ??
    ML_WEIGHT_RULES[ML_WEIGHT_RULES.length - 1]
  )
}

// ── Marketplace fee configuration (março 2026) ──────────────────────────────

export interface MarketplaceFeeConfig {
  key: string
  label: string
  rules: FeeRule[]         // ordenadas por minPrice crescente
  requiresCNPJ: boolean
  notes?: string
}

export const MARKETPLACE_FEES: MarketplaceFeeConfig[] = [
  {
    key: 'ml_classico',
    label: 'Mercado Livre Clássico',
    requiresCNPJ: false,
    notes: 'Comissão 12%. Custo operacional calculado automaticamente pelo peso do envio.',
    rules: [
      { label: 'Padrão', minPrice: 0, maxPrice: Infinity, commissionPercent: 12, fixedFee: 0 },
    ],
  },
  {
    key: 'ml_premium',
    label: 'Mercado Livre Premium',
    requiresCNPJ: false,
    notes: 'Comissão 16%. Parcelamento 12× sem juros para o comprador.',
    rules: [
      { label: 'Padrão', minPrice: 0, maxPrice: Infinity, commissionPercent: 16, fixedFee: 0 },
    ],
  },
  {
    key: 'shopee',
    label: 'Shopee',
    requiresCNPJ: false,
    notes: 'Frete Grátis obrigatório desde 01/03/2026. Faixa determinada pelo preço final do produto.',
    rules: [
      { label: 'Faixa 1 — até R$7,99',        minPrice: 0,   maxPrice: 7.99,    commissionPercent: 50, fixedFee: 0  },
      { label: 'Faixa 2 — R$8 a R$79,99',     minPrice: 8,   maxPrice: 79.99,   commissionPercent: 20, fixedFee: 4  },
      { label: 'Faixa 3 — R$80 a R$99,99',    minPrice: 80,  maxPrice: 99.99,   commissionPercent: 14, fixedFee: 16 },
      { label: 'Faixa 4 — R$100 a R$199,99',  minPrice: 100, maxPrice: 199.99,  commissionPercent: 14, fixedFee: 20 },
      { label: 'Faixa 5 — R$200+',            minPrice: 200, maxPrice: Infinity, commissionPercent: 14, fixedFee: 26 },
    ],
  },
  {
    key: 'tiktok',
    label: 'TikTok Shop',
    requiresCNPJ: true,
    notes: 'Requer CNPJ. Taxa fixa R$4 para produtos abaixo de R$79 (desde fev/2026).',
    rules: [
      { label: 'Abaixo de R$79', minPrice: 0,  maxPrice: 78.99,   commissionPercent: 6, fixedFee: 4 },
      { label: 'R$79 ou mais',   minPrice: 79, maxPrice: Infinity, commissionPercent: 6, fixedFee: 0 },
    ],
  },
  {
    key: 'venda_direta',
    label: 'Venda Direta',
    requiresCNPJ: false,
    notes: 'Sem comissão de marketplace. Apenas imposto do regime fiscal.',
    rules: [
      { label: 'Sem taxas', minPrice: 0, maxPrice: Infinity, commissionPercent: 0, fixedFee: 0 },
    ],
  },
]

