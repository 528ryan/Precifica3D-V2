import type {
  CalculatorInput,
  CalculatorOutput,
  CostBreakdown,
  MarketplaceResult,
  FeeRule,
} from '@/types'
import { MARKETPLACE_FEES, getMLOperationalCost, type MarketplaceFeeConfig } from '@/lib/marketplaceFees'
import { getTaxRule } from '@/lib/taxRates'

// ── Helpers ──────────────────────────────────────────────────────────────────

function brl(n: number): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function r2(n: number): number {
  return Math.round(n * 100) / 100
}

function ruleAt(price: number, config: MarketplaceFeeConfig): FeeRule {
  return (
    config.rules.find((r) => price >= r.minPrice && price <= r.maxPrice) ??
    config.rules[config.rules.length - 1]
  )
}

// ── Price resolver ────────────────────────────────────────────────────────────
//
// Formula:  price = (cost + fixedFee + mlOpCost) / (1 - commission - tax - margin)
//
// Since fixedFee and commissionPercent come from the fee rule that applies at
// the computed price (circular dependency), we resolve iteratively.
// Starting from a very high price ensures convergence from the top tier down.

function resolvePrice(
  cost: number,
  taxDecimal: number,
  marginPercent: number,
  config: MarketplaceFeeConfig,
  mlOpCost: number = 0,
  maxIterations: number = 10,
): { price: number; rule: FeeRule; impossible: boolean } {
  const baseDenom = 1 - marginPercent / 100 - taxDecimal
  if (baseDenom <= 0) {
    return { price: 0, rule: config.rules[config.rules.length - 1], impossible: true }
  }

  let estimatedPrice = 1e6 // start high → converges from last (highest-price) rule

  for (let i = 0; i < maxIterations; i++) {
    const rule = ruleAt(estimatedPrice, config)
    const denom = baseDenom - rule.commissionPercent / 100

    if (denom <= 0) {
      return { price: 0, rule, impossible: true }
    }

    const newPrice = (cost + rule.fixedFee + mlOpCost) / denom
    const newRule = ruleAt(newPrice, config)

    if (newRule.label === rule.label) {
      return { price: r2(Math.max(0, newPrice)), rule: newRule, impossible: false }
    }
    estimatedPrice = newPrice
  }

  // Fallback after max iterations
  const rule = ruleAt(estimatedPrice, config)
  return { price: r2(Math.max(0, estimatedPrice)), rule, impossible: false }
}

// ── Net profit for a given fixed price ───────────────────────────────────────
//
// When price comes from resolvePrice(cost, tax, margin, …):
//   netProfit = price × margin/100  (algebraically exact)
//
// For boundary analysis (fixed price, not from the formula):
//   netProfit = price × (1 − commission − tax) − cost − fixedFee − mlOpCost

function netProfitForFixed(
  price: number,
  rule: FeeRule,
  taxDecimal: number,
  cost: number,
  mlOpCost: number,
): number {
  return price * (1 - rule.commissionPercent / 100 - taxDecimal) - cost - rule.fixedFee - mlOpCost
}

// ── Margin suggestions (capped at cost × 4) ──────────────────────────────────

function calcMarginSuggestion(
  cost: number,
  taxDecimal: number,
  config: MarketplaceFeeConfig,
  mlOpCost: number,
): { conservative: number; balanced: number; aggressive: number } {
  const PRICE_CAP = cost * 4
  let conservative = -1
  let balanced = -1
  let aggressive = -1

  for (let m = 1; m <= 80; m++) {
    const { price, impossible } = resolvePrice(cost, taxDecimal, m, config, mlOpCost)
    if (impossible || price <= 0 || price > PRICE_CAP) continue

    const netProfit = price * m / 100

    if (conservative < 0 && netProfit > cost * 0.2) conservative = m
    if (balanced < 0 && m >= 35) balanced = m
    aggressive = m // keep updating → find highest valid m
  }

  if (conservative < 0) conservative = 5
  if (balanced < 0) balanced = Math.max(conservative, 35)
  if (aggressive < 0) aggressive = Math.max(conservative, 30)

  return { conservative, balanced, aggressive }
}

// ── Boundary warning ──────────────────────────────────────────────────────────
// Only fires when the recommended price is within R$5 of a tier boundary
// AND moving to the better side would yield > R$1 more profit.
// Returns at most 1 warning (highest profitDiff).

function calcBoundaryWarning(
  cost: number,
  taxDecimal: number,
  config: MarketplaceFeeConfig,
  mlOpCost: number,
  recommendedPrice: number,
): MarketplaceResult['boundaryWarning'] {
  const PROXIMITY = 5
  const MIN_DIFF  = 1

  let best: MarketplaceResult['boundaryWarning'] = undefined
  let bestDiff = 0

  for (let i = 0; i < config.rules.length - 1; i++) {
    const B  = config.rules[i].maxPrice
    const rA = config.rules[i]
    const rB = config.rules[i + 1]

    // Only check if recommended price is within R$5 of this boundary
    const dist = Math.min(Math.abs(recommendedPrice - B), Math.abs(recommendedPrice - (B + 0.01)))
    if (dist > PROXIMITY) continue

    const profitAtB    = netProfitForFixed(B,        rA, taxDecimal, cost, mlOpCost)
    const profitAboveB = netProfitForFixed(B + 0.01, rB, taxDecimal, cost, mlOpCost)
    const diff = r2(Math.abs(profitAtB - profitAboveB))

    if (diff <= MIN_DIFF) continue

    if (profitAtB > profitAboveB && recommendedPrice > B) {
      // User is above boundary; better to stay at/below B
      if (diff > bestDiff) {
        bestDiff = diff
        best = {
          message: `⚡ Baixar para R$${brl(B)} rende +R$${brl(diff)} por peça (mantém faixa anterior)`,
          direction: 'lower',
          profitDiff: diff,
        }
      }
    } else if (profitAboveB > profitAtB && recommendedPrice <= B) {
      // User is at/below boundary; better to go above B
      if (diff > bestDiff) {
        bestDiff = diff
        best = {
          message: `⚡ Subir para R$${brl(B + 0.01)} rende +R$${brl(diff)} por peça (entra na próxima faixa)`,
          direction: 'higher',
          profitDiff: diff,
        }
      }
    }
  }

  return best
}

// ── Main export ───────────────────────────────────────────────────────────────

export function calculatePricing(input: CalculatorInput): CalculatorOutput {
  const { production, seller, marketplaces, overrides, mlShipping, desiredMarginPercent } = input
  const errors: string[] = []

  // Validation
  if (production.filamentWeightGrams <= 0) {
    errors.push('Peso do filamento deve ser maior que zero.')
  }
  if (production.filamentPricePerKg < 0) {
    errors.push('Preço do filamento não pode ser negativo.')
  }

  // Cost breakdown
  const filamentCost         = r2((production.filamentPricePerKg / 1000) * production.filamentWeightGrams)
  const postProcessingCost   = r2(production.postProcessingCost)
  const otherDirectCosts     = r2(production.otherDirectCosts)
  const baseCost             = r2(filamentCost + postProcessingCost + otherDirectCosts)
  const failureRate          = Math.min(Math.max(production.failureRatePercent, 0), 99)
  const effectiveCostPerUnit = r2(baseCost / (1 - failureRate / 100))

  const costBreakdown: CostBreakdown = {
    filamentCost,
    postProcessingCost,
    otherDirectCosts,
    failureRatePercent: failureRate,
    baseCost,
    effectiveCostPerUnit,
  }

  if (errors.length > 0) {
    return { costBreakdown, results: [], errors }
  }

  const taxRule    = getTaxRule(seller.taxRegime)
  const taxDecimal = taxRule.percentOnRevenue
  const hasCNPJ    = seller.taxRegime !== 'cpf'

  const results: MarketplaceResult[] = []
  const activeKeys = (Object.keys(marketplaces) as (keyof typeof marketplaces)[])
    .filter((k) => marketplaces[k])

  for (const key of activeKeys) {
    const feeConfig = MARKETPLACE_FEES.find((f) => f.key === key)
    if (!feeConfig) continue

    // CNPJ gate
    if (feeConfig.requiresCNPJ && !hasCNPJ) {
      results.push({
        key,
        label: feeConfig.label,
        appliedRule: feeConfig.rules[0],
        recommendedPrice: 0,
        recommendedProfit: 0,
        recommendedMarginPercent: 0,
        marginSuggestion: { conservative: 0, balanced: 0, aggressive: 0 },
        warnings: [],
        isBlocked: true,
        blockedReason: 'Requer CNPJ. Regime fiscal atual (CPF) não é permitido neste canal.',
        isBestPrice: false,
        isBestProfit: false,
      })
      continue
    }

    // Apply ML commission overrides
    let configToUse = feeConfig
    let mlOpCost = 0

    if (key === 'ml_classico' || key === 'ml_premium') {
      const commission = key === 'ml_classico' ? overrides.mlClassicoCommission : overrides.mlPremiumCommission
      configToUse = {
        ...feeConfig,
        rules: feeConfig.rules.map((r) => ({ ...r, commissionPercent: commission })),
      }
      const totalWeightG = production.filamentWeightGrams + mlShipping.packagingWeightG
      mlOpCost = getMLOperationalCost(totalWeightG).operationalCost
    }

    const cost = effectiveCostPerUnit
    const marginSuggestion = calcMarginSuggestion(cost, taxDecimal, configToUse, mlOpCost)

    // Recommended price = exact desired margin
    const recommended = resolvePrice(cost, taxDecimal, desiredMarginPercent, configToUse, mlOpCost)

    if (recommended.impossible) {
      results.push({
        key,
        label: feeConfig.label,
        appliedRule: configToUse.rules[0],
        recommendedPrice: 0,
        recommendedProfit: 0,
        recommendedMarginPercent: 0,
        marginSuggestion,
        warnings: [`Impossível: comissão + imposto + margem (${desiredMarginPercent}%) ≥ 100%.`],
        isBlocked: false,
        isBestPrice: false,
        isBestProfit: false,
      })
      continue
    }

    const recommendedPrice  = recommended.price
    const recommendedProfit = r2(recommendedPrice * desiredMarginPercent / 100)
    const appliedRule       = recommended.rule

    // Alternative: conservative margin, only shown when desiredMargin > conservative + 2%
    let alternative: MarketplaceResult['alternative'] = undefined
    if (desiredMarginPercent > marginSuggestion.conservative + 2) {
      const altRes = resolvePrice(cost, taxDecimal, marginSuggestion.conservative, configToUse, mlOpCost)
      if (!altRes.impossible && altRes.price > 0) {
        alternative = {
          price: altRes.price,
          profit: r2(altRes.price * marginSuggestion.conservative / 100),
          marginPercent: marginSuggestion.conservative,
          label: 'Mínimo sustentável',
        }
      }
    }

    // Boundary warning (max 1, only within R$5 proximity AND diff > R$1)
    const boundaryWarning = calcBoundaryWarning(cost, taxDecimal, configToUse, mlOpCost, recommendedPrice)

    const warnings: string[] = []
    if (feeConfig.notes) warnings.push(feeConfig.notes)

    results.push({
      key,
      label: feeConfig.label,
      appliedRule,
      recommendedPrice,
      recommendedProfit,
      recommendedMarginPercent: desiredMarginPercent,
      alternative,
      boundaryWarning,
      marginSuggestion,
      warnings,
      isBlocked: false,
      isBestPrice: false,
      isBestProfit: false,
    })
  }

  // Mark best price / best profit among non-blocked results
  const nonBlocked = results.filter((r) => !r.isBlocked)
  if (nonBlocked.length > 0) {
    const minPrice  = Math.min(...nonBlocked.map((r) => r.recommendedPrice === 0 ? Infinity : r.recommendedPrice))
    const maxProfit = Math.max(...nonBlocked.map((r) => r.recommendedProfit))

    for (const r of results) {
      if (r.isBlocked || r.recommendedPrice === 0) continue
      r.isBestPrice  = r.recommendedPrice  === minPrice
      r.isBestProfit = r.recommendedProfit === maxProfit
    }
  }

  return { costBreakdown, results, errors }
}

// ── Kit pricing ───────────────────────────────────────────────────────────────

export interface KitPriceResult {
  key: string
  label: string
  recommendedPrice: number
  netProfitPerKit: number
  marginPercent: number
  rule: FeeRule
  isBlocked: boolean
  blockedReason?: string
  errorMsg?: string
}

export function calculateKitPricing(
  kitTotalCost: number,
  input: CalculatorInput,
): KitPriceResult[] {
  const { production, seller, marketplaces, overrides, mlShipping, desiredMarginPercent } = input
  const taxRule    = getTaxRule(seller.taxRegime)
  const taxDecimal = taxRule.percentOnRevenue
  const hasCNPJ    = seller.taxRegime !== 'cpf'

  const activeKeys = (Object.keys(marketplaces) as (keyof typeof marketplaces)[])
    .filter((k) => marketplaces[k])

  const results: KitPriceResult[] = []

  for (const key of activeKeys) {
    const feeConfig = MARKETPLACE_FEES.find((f) => f.key === key)
    if (!feeConfig) continue

    if (feeConfig.requiresCNPJ && !hasCNPJ) {
      results.push({ key, label: feeConfig.label, recommendedPrice: 0, netProfitPerKit: 0, marginPercent: 0, rule: feeConfig.rules[0], isBlocked: true, blockedReason: 'Requer CNPJ.' })
      continue
    }

    let configToUse = feeConfig
    let mlOpCost = 0

    if (key === 'ml_classico' || key === 'ml_premium') {
      const commission = key === 'ml_classico' ? overrides.mlClassicoCommission : overrides.mlPremiumCommission
      configToUse = { ...feeConfig, rules: feeConfig.rules.map((r) => ({ ...r, commissionPercent: commission })) }
      const totalWeightG = production.filamentWeightGrams + mlShipping.packagingWeightG
      mlOpCost = getMLOperationalCost(totalWeightG).operationalCost
    }

    const resolved = resolvePrice(kitTotalCost, taxDecimal, desiredMarginPercent, configToUse, mlOpCost)
    if (resolved.impossible) {
      results.push({ key, label: feeConfig.label, recommendedPrice: 0, netProfitPerKit: 0, marginPercent: 0, rule: configToUse.rules[0], isBlocked: false, errorMsg: 'Impossível com a margem atual.' })
      continue
    }

    const netProfit = r2(resolved.price * desiredMarginPercent / 100)
    results.push({
      key, label: feeConfig.label,
      recommendedPrice: resolved.price,
      netProfitPerKit: netProfit,
      marginPercent: resolved.price > 0 ? r2(netProfit / resolved.price * 100) : 0,
      rule: resolved.rule,
      isBlocked: false,
    })
  }

  return results
}
