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

export interface MarketplaceOverrides {
  mlClassicoCommission: number       // inteiro: 10–14
  mlPremiumCommission: number        // inteiro: 15–19
  mlOperationalCostPerUnit: number   // R$ — custo operacional (peso/dimensão) por unidade
}

// ── Calculator Input ────────────────────────────────────────────────────────
export interface CalculatorInput {
  production: ProductionInput
  seller: SellerInput
  marketplaces: MarketplaceToggles
  overrides: MarketplaceOverrides
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

// ── Price Candidate ─────────────────────────────────────────────────────────
export interface PriceCandidate {
  rank: number              // 1/2/3 for top 3; 0 for "user price" outside top 3
  price: number
  netProfitPerUnit: number
  marginPercent: number
  rule: FeeRule
  rationale: string
  isUserMargin?: boolean
  isMathematicallyImpossible?: boolean
}

// ── Margin Suggestion ────────────────────────────────────────────────────────
export interface MarginSuggestion {
  conservative: number
  balanced: number
  aggressive: number
  conservativeRationale: string
  balancedRationale: string
  aggressiveRationale: string
}

// ── Boundary Warning ─────────────────────────────────────────────────────────
export interface BoundaryWarning {
  message: string
  profitDifference: number
  currentPrice: number
  suggestedPrice: number
}

// ── Marketplace Result ───────────────────────────────────────────────────────
export interface MarketplaceResult {
  key: string
  label: string
  activeRule: FeeRule
  candidates: PriceCandidate[]
  marginSuggestion: MarginSuggestion
  boundaryWarnings: BoundaryWarning[]
  isBestPrice: boolean
  isBestProfit: boolean
  isBlocked: boolean
  blockedReason?: string
  requiresCNPJ: boolean
  notes?: string
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
