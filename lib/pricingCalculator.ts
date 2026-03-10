import type {
  CalculatorInput,
  CalculatorOutput,
  MarketplaceResult,
  MarketplaceToggles,
} from '@/types'
import { FEE_CONFIGS, type FeeConfig } from '@/lib/marketplaceFees'
import { getTaxRule } from '@/lib/taxRates'

// ──────────────────────────────────────────────────────────────────────────
// Price solver — algebraic, with iterative threshold handling
//
// Formula: finalPrice = (effectiveCost + fixedFee) / (1 - commission - tax - margin)
// ──────────────────────────────────────────────────────────────────────────

interface PriceSolveResult {
  price: number
  fixedFeeApplied: number
  commissionUsed: number
  errorMsg?: string
  warnings: string[]
}

function solvePrice(
  effectiveCost: number,
  config: FeeConfig,
  commissionRate: number,
  taxRate: number,
  marginRate: number,
): PriceSolveResult {
  const warnings: string[] = []

  if (commissionRate + taxRate + marginRate >= 1.0) {
    return {
      price: 0,
      fixedFeeApplied: 0,
      commissionUsed: commissionRate,
      errorMsg: `Impossível precificar: comissão (${pct(commissionRate)}) + imposto (${pct(taxRate)}) + margem (${pct(marginRate)}) ≥ 100%`,
      warnings,
    }
  }

  const denom = 1 - commissionRate - taxRate - marginRate

  // ── Step 1: Determine if fixed fee applies (iterative self-consistency) ──
  let fixedFee: number

  if (config.fixedFeeThreshold === Infinity || config.fixedFeeThreshold === 0) {
    // fixedFeeThreshold=Infinity → always apply; =0 → never apply
    fixedFee = config.fixedFeeThreshold === 0 ? 0 : config.fixedFee
  } else {
    const estNoFee = effectiveCost / denom
    const feeA = estNoFee < config.fixedFeeThreshold ? config.fixedFee : 0
    const priceA = (effectiveCost + feeA) / denom
    const feeB = priceA < config.fixedFeeThreshold ? config.fixedFee : 0
    if (feeB !== feeA) {
      const priceB = (effectiveCost + feeB) / denom
      fixedFee = priceB < config.fixedFeeThreshold ? config.fixedFee : 0
    } else {
      fixedFee = feeA
    }
  }

  const priceNormal = (effectiveCost + fixedFee) / denom

  // ── Step 2: Low-price threshold check (Shopee < R$10, ML < R$12.50) ────
  if (config.lowPriceThreshold > 0 && priceNormal < config.lowPriceThreshold - 1e-9) {
    const denomLow = 1 - config.lowPriceFeeRate - taxRate - marginRate

    if (denomLow <= 0) {
      return {
        price: 0,
        fixedFeeApplied: 0,
        commissionUsed: config.lowPriceFeeRate,
        errorMsg: `Preço abaixo do limiar R$${config.lowPriceThreshold.toFixed(2)}: margem + impostos ≥ 50%`,
        warnings,
      }
    }

    const fixedFeeLow = config.keepFixedFeeOnLowPrice ? config.fixedFee : 0
    const priceLow = (effectiveCost + fixedFeeLow) / denomLow

    if (priceLow < config.lowPriceThreshold - 1e-9) {
      warnings.push(`Regra especial aplicada: taxa = 50% do preço (preço < R$${config.lowPriceThreshold.toFixed(2)})`)
      return {
        price: priceLow,
        fixedFeeApplied: fixedFeeLow,
        commissionUsed: config.lowPriceFeeRate,
        warnings,
      }
    }
  }

  return { price: priceNormal, fixedFeeApplied: fixedFee, commissionUsed: commissionRate, warnings }
}

function pct(d: number): string {
  return `${Math.round(d * 100)}%`
}

function r2(v: number): number {
  return Math.round(v * 100) / 100
}

// ──────────────────────────────────────────────────────────────────────────
// Kit pricing (public — used by KitBuilder)
// ──────────────────────────────────────────────────────────────────────────

export interface KitPriceResult {
  key: keyof MarketplaceToggles
  label: string
  price: number
  netProfit: number
  effectiveMargin: number
  errorMsg?: string
}

export function calculateKitPricing(
  kitTotalCost: number,
  input: CalculatorInput,
): KitPriceResult[] {
  const taxRule = getTaxRule(input.seller.taxRegime)
  const taxRate = taxRule.percentOnRevenue
  const marginRate = input.desiredMarginPercent / 100

  return FEE_CONFIGS
    .filter((c) => input.marketplaces[c.key])
    .filter((c) => !(c.blockForCpf && input.seller.taxRegime === 'cpf'))
    .map((config) => {
      const commission = getCommission(config, input)
      const solved = solvePrice(kitTotalCost, config, commission, taxRate, marginRate)

      if (solved.errorMsg) {
        return { key: config.key, label: config.label, price: 0, netProfit: 0, effectiveMargin: 0, errorMsg: solved.errorMsg }
      }

      const netProfit = solved.price * (1 - solved.commissionUsed - taxRate) - kitTotalCost - solved.fixedFeeApplied
      const effectiveMargin = solved.price > 0 ? (netProfit / solved.price) * 100 : 0

      return {
        key: config.key,
        label: config.label,
        price: r2(solved.price),
        netProfit: r2(netProfit),
        effectiveMargin: parseFloat(effectiveMargin.toFixed(2)),
      }
    })
}

// ──────────────────────────────────────────────────────────────────────────
// Helper: resolve commission for a config
// ──────────────────────────────────────────────────────────────────────────

function getCommission(config: FeeConfig, input: CalculatorInput): number {
  if (config.key === 'mlClassico' && input.mlClassicoCommissionOverride !== undefined) {
    return input.mlClassicoCommissionOverride / 100
  }
  if (config.key === 'mlPremium' && input.mlPremiumCommissionOverride !== undefined) {
    return input.mlPremiumCommissionOverride / 100
  }
  return config.defaultCommissionRate
}

// ──────────────────────────────────────────────────────────────────────────
// Main export
// ──────────────────────────────────────────────────────────────────────────

export function calculatePricing(input: CalculatorInput): CalculatorOutput {
  const validationErrors: string[] = []

  // ── Validations ──────────────────────────────────────────────────────────
  const printHours =
    input.production.printTimeHours + input.production.printTimeMinutes / 60

  if (printHours <= 0) {
    validationErrors.push('Tempo de impressão deve ser maior que zero.')
  }

  if (
    input.production.printer.id === 'custom' &&
    input.production.printer.avgWatts <= 0
  ) {
    validationErrors.push('Informe o consumo em Watts da impressora personalizada.')
  }

  const effectiveTariff =
    input.energy.baseTariffPerKwh + input.energy.flagSurchargePerKwh

  // ── Cost breakdown ───────────────────────────────────────────────────────
  const filament =
    (input.production.filamentPricePerKg / 1000) * input.production.filamentWeightGrams

  const electricity =
    (input.production.printer.avgWatts / 1000) * printHours * effectiveTariff

  const labor =
    input.production.laborRatePerHour * input.production.laborHours

  const postProcessing = input.production.postProcessingCost

  const baseCostPerUnit = filament + electricity + labor + postProcessing

  const failureRate = Math.min(Math.max(input.production.failureRatePercent, 0), 99)
  const effectiveCostWithFailures = baseCostPerUnit / (1 - failureRate / 100)

  // ── Monthly capacity (720h = 30 × 24) ───────────────────────────────────
  const MONTHLY_HOURS = 720
  const unitsPerMonth =
    printHours > 0 ? Math.floor(MONTHLY_HOURS / printHours) : 0

  const effectivePrintHoursPerMonth = MONTHLY_HOURS * (1 - failureRate / 100)

  // ── Early return if validation failed ───────────────────────────────────
  if (validationErrors.length > 0) {
    return {
      validationErrors,
      totalPrintHoursPerMonth: MONTHLY_HOURS,
      effectivePrintHoursPerMonth,
      baseCostPerUnit,
      costBreakdown: { filament, electricity, labor, postProcessing },
      effectiveCostWithFailures,
      effectiveTariff,
      unitsPerMonth,
      results: [],
      bestPrice: null,
      bestProfit: null,
    }
  }

  // ── Per-marketplace pricing ──────────────────────────────────────────────
  const taxRule = getTaxRule(input.seller.taxRegime)
  const taxRate = taxRule.percentOnRevenue
  const marginRate = input.desiredMarginPercent / 100

  const results: MarketplaceResult[] = []

  for (const config of FEE_CONFIGS) {
    if (!input.marketplaces[config.key]) continue

    // TikTok with CPF → block
    if (config.blockForCpf && input.seller.taxRegime === 'cpf') continue

    const commission = getCommission(config, input)
    const solved = solvePrice(
      effectiveCostWithFailures,
      config,
      commission,
      taxRate,
      marginRate,
    )

    const warnings: string[] = [...solved.warnings]

    // CNPJ warning for CPF/MEI
    if (
      config.requiresCnpjWarning &&
      (input.seller.taxRegime === 'cpf' || input.seller.taxRegime === 'mei')
    ) {
      warnings.push('Requer CNPJ ativo')
    }

    if (solved.errorMsg) {
      results.push({
        key: config.key,
        label: config.label,
        commissionPercent: Math.round(commission * 100),
        fixedFeeR$: config.fixedFee,
        taxPercent: Math.round(taxRate * 100),
        breakevenPrice: 0,
        recommendedPrice: 0,
        netProfitPerUnit: 0,
        effectiveMarginPercent: 0,
        warnings: [...warnings, solved.errorMsg],
        isBestPrice: false,
        isBestProfit: false,
      })
      continue
    }

    const finalPrice = solved.price
    const fixedFeeApplied = solved.fixedFeeApplied
    const commissionUsed = solved.commissionUsed

    const denomBE = 1 - commissionUsed - taxRate
    const breakevenPrice =
      denomBE > 0
        ? r2((effectiveCostWithFailures + fixedFeeApplied) / denomBE)
        : 0

    const netProfitPerUnit = r2(
      finalPrice * (1 - commissionUsed - taxRate) -
        effectiveCostWithFailures -
        fixedFeeApplied,
    )

    const effectiveMarginPercent = parseFloat(
      (finalPrice > 0 ? (netProfitPerUnit / finalPrice) * 100 : 0).toFixed(2),
    )

    // MEI monthly revenue warning
    const projectedMonthlyRevenue = unitsPerMonth * finalPrice
    if (
      input.seller.taxRegime === 'mei' &&
      projectedMonthlyRevenue > 6750
    ) {
      warnings.push(
        `Receita projetada R$${brl(projectedMonthlyRevenue)}/mês ultrapassa o limite MEI (R$6.750)`,
      )
    }

    results.push({
      key: config.key,
      label: config.label,
      commissionPercent: Math.round(commissionUsed * 100),
      fixedFeeR$: r2(fixedFeeApplied),
      taxPercent: Math.round(taxRate * 100),
      breakevenPrice,
      recommendedPrice: r2(finalPrice),
      netProfitPerUnit,
      effectiveMarginPercent,
      warnings,
      isBestPrice: false,
      isBestProfit: false,
    })
  }

  // ── Badges ───────────────────────────────────────────────────────────────
  const valid = results.filter((r) => r.recommendedPrice > 0)

  if (valid.length > 0) {
    const minPrice = Math.min(...valid.map((r) => r.recommendedPrice))
    const maxProfit = Math.max(...valid.map((r) => r.netProfitPerUnit))

    for (const r of results) {
      if (r.recommendedPrice > 0) {
        r.isBestPrice = r.recommendedPrice === minPrice
        r.isBestProfit = r.netProfitPerUnit === maxProfit
      }
    }
  }

  const bestPrice =
    valid.find((r) => r.isBestPrice)?.key ?? null
  const bestProfit =
    valid.find((r) => r.isBestProfit)?.key ?? null

  return {
    validationErrors,
    totalPrintHoursPerMonth: MONTHLY_HOURS,
    effectivePrintHoursPerMonth,
    baseCostPerUnit: r2(baseCostPerUnit),
    costBreakdown: {
      filament: r2(filament),
      electricity: r2(electricity),
      labor: r2(labor),
      postProcessing: r2(postProcessing),
    },
    effectiveCostWithFailures: r2(effectiveCostWithFailures),
    effectiveTariff,
    unitsPerMonth,
    results,
    bestPrice,
    bestProfit,
  }
}

function brl(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
