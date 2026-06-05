// ── Seller ─────────────────────────────────────────────────────────────────
export type TaxRegime =
  | 'cpf'
  | 'mei'
  | 'me_simples'
  | 'lucro_presumido'
  | 'lucro_real'

// ── Production ─────────────────────────────────────────────────────────────
export interface ProductionInput {
  filamentPricePerKg: number       // R$/kg
  filamentWeightGrams: number      // gramas por peça
  postProcessingCost: number       // R$ fixo (acabamento, pintura etc.)
  otherDirectCosts: number         // R$ — outros custos diretos
  failureRatePercent: number       // 0–50
}

export interface SellerInput {
  taxRegime: TaxRegime
}

// ── Marketplace ─────────────────────────────────────────────────────────────
export interface MarketplaceToggles {
  ml_classico: boolean
  ml_premium: boolean
  shopee: boolean
  tiktok: boolean
  venda_direta: boolean
}

export interface MLShipping {
  packagingWeightG: number  // peso da embalagem em gramas (default: 50)
}

// ── Calculator Input ────────────────────────────────────────────────────────
export interface CalculatorInput {
  production: ProductionInput
  seller: SellerInput
  marketplaces: MarketplaceToggles
  mlShipping: MLShipping
  desiredMarginPercent: number
}

// ── Cost Breakdown ──────────────────────────────────────────────────────────
export interface CostBreakdown {
  filamentCost: number
  postProcessingCost: number
  otherDirectCosts: number
  failureRatePercent: number
  baseCost: number
  effectiveCostPerUnit: number
}

// ── Fee Rule (for new marketplace model) ────────────────────────────────────
export interface FeeRule {
  label: string
  minPrice: number
  maxPrice: number          // Infinity for last tier
  commissionPercent: number // whole number, e.g. 20
  fixedFee: number          // R$
}

// ── Fee Breakdown ────────────────────────────────────────────────────────────
export interface FeeBreakdown {
  effectiveCost: number      // R$ — custo efetivo por peça
  commissionAmount: number   // R$ — price × commissionPercent/100
  commissionPercent: number  // % — para exibição
  fixedFee: number           // R$ — taxa fixa da regra aplicada
  mlOperationalCost: number  // R$ — custo operacional ML (0 para outros canais)
  taxAmount: number          // R$ — price × taxDecimal
  taxPercent: number         // % — para exibição (ex: 6 para MEI)
  netProfit: number          // R$ — lucro líquido por peça
}

// ── Marketplace Result ───────────────────────────────────────────────────────
export interface MarketplaceResult {
  key: string
  label: string
  appliedRule: FeeRule
  recommendedPrice: number
  recommendedProfit: number
  recommendedMarginPercent: number
  alternative?: {
    price: number
    profit: number
    marginPercent: number
    label: string
  }
  boundaryWarning?: {
    message: string
    direction: 'lower' | 'higher'
    profitDiff: number
  }
  marginSuggestion: {
    conservative: number
    balanced: number
    aggressive: number
  }
  feeBreakdown: FeeBreakdown
  warnings: string[]
  isBlocked: boolean
  blockedReason?: string
  isBestPrice: boolean
  isBestProfit: boolean
}

// ── Calculator Output ────────────────────────────────────────────────────────
export interface CalculatorOutput {
  costBreakdown: CostBreakdown
  results: MarketplaceResult[]
  errors: string[]
}

// ── Presets / Kits ───────────────────────────────────────────────────────────
export interface KitItem {
  id: string
  name: string
  quantity: number
  unitCost: number
}

export interface SavedPreset {
  id: string
  name: string
  createdAt: string
  input: CalculatorInput
}

export interface SavedKit {
  id: string
  name: string
  createdAt: string
  items: KitItem[]
}
