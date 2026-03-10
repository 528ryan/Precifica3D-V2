// ── Printer ────────────────────────────────────────────────────────────────
export interface PrinterPreset {
  id: string
  name: string
  avgWatts: number  // consumo médio real durante impressão (não pico)
}

// ── Production ─────────────────────────────────────────────────────────────
export interface ProductionInput {
  printer: PrinterPreset
  printTimeHours: number
  printTimeMinutes: number
  filamentPricePerKg: number
  filamentWeightGrams: number
  laborRatePerHour: number
  laborHours: number
  postProcessingCost: number
  failureRatePercent: number  // 0–50
}

// ── Energy ─────────────────────────────────────────────────────────────────
export type FlagColor = 'verde' | 'amarela' | 'vermelha1' | 'vermelha2'

export interface EnergyInput {
  baseTariffPerKwh: number
  flagSurchargePerKwh: number
  flagColor: FlagColor
}

// ── Seller ─────────────────────────────────────────────────────────────────
export type TaxRegime =
  | 'cpf'
  | 'mei'
  | 'me_simples'
  | 'lucro_presumido'
  | 'lucro_real'

export interface SellerInput {
  taxRegime: TaxRegime
}

// ── Marketplace ────────────────────────────────────────────────────────────
export interface MarketplaceToggles {
  mlClassico: boolean
  mlPremium: boolean
  shopeeCpfSemFrete: boolean
  shopeeCpfComFrete: boolean
  shopeeCnpj: boolean
  tiktokShop: boolean
  vendaDireta: boolean
}

// ── Calculator Input ───────────────────────────────────────────────────────
export interface CalculatorInput {
  production: ProductionInput
  energy: EnergyInput
  seller: SellerInput
  marketplaces: MarketplaceToggles
  desiredMarginPercent: number
  mlClassicoCommissionOverride?: number  // como inteiro: ex: 12
  mlPremiumCommissionOverride?: number
}

// ── Presets / Kits ─────────────────────────────────────────────────────────
export interface SavedPreset {
  id: string
  name: string
  createdAt: string
  input: CalculatorInput
}

export interface KitItem {
  id: string
  name: string
  presetId?: string
  presetName?: string
  quantity: number
  unitCost: number
}

export interface SavedKit {
  id: string
  name: string
  createdAt: string
  items: KitItem[]
}

// ── Calculator Output ──────────────────────────────────────────────────────
export interface MarketplaceResult {
  key: keyof MarketplaceToggles
  label: string
  commissionPercent: number
  fixedFeeR$: number
  taxPercent: number
  breakevenPrice: number
  recommendedPrice: number
  netProfitPerUnit: number
  effectiveMarginPercent: number
  warnings: string[]
  isBestPrice: boolean
  isBestProfit: boolean
}

export interface CostBreakdown {
  filament: number
  electricity: number
  labor: number
  postProcessing: number
}

export interface CalculatorOutput {
  validationErrors: string[]
  totalPrintHoursPerMonth: number     // 720 fixo
  effectivePrintHoursPerMonth: number
  baseCostPerUnit: number
  costBreakdown: CostBreakdown
  effectiveCostWithFailures: number
  effectiveTariff: number
  unitsPerMonth: number
  results: MarketplaceResult[]
  bestPrice: keyof MarketplaceToggles | null
  bestProfit: keyof MarketplaceToggles | null
}
