import type { FeeRule } from '@/types'

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
    notes: 'Comissão ajustável 10–14%. Custo operacional (peso/dimensão) informado manualmente no Seller Center.',
    rules: [
      { label: 'Padrão', minPrice: 0, maxPrice: Infinity, commissionPercent: 12, fixedFee: 0 },
    ],
    // commissionPercent é sobrescrito pelo slider do usuário (10–14)
  },
  {
    key: 'ml_premium',
    label: 'Mercado Livre Premium',
    requiresCNPJ: false,
    notes: 'Comissão ajustável 15–19%. Parcelamento 12× sem juros para o comprador.',
    rules: [
      { label: 'Padrão', minPrice: 0, maxPrice: Infinity, commissionPercent: 16, fixedFee: 0 },
    ],
    // commissionPercent é sobrescrito pelo slider do usuário (15–19)
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

// ── ML commission ranges ─────────────────────────────────────────────────────
export const ML_CLASSICO_RANGE = { min: 10, max: 14, default: 12 }
export const ML_PREMIUM_RANGE  = { min: 15, max: 19, default: 16 }
