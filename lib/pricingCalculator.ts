import type {
  CalculatorInput,
  CalculatorOutput,
  CostBreakdown,
  MarketplaceResult,
  PriceCandidate,
  MarginSuggestion,
  BoundaryWarning,
  FeeRule,
} from '@/types'
import { MARKETPLACE_FEES, type MarketplaceFeeConfig } from '@/lib/marketplaceFees'
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

// ── Price resolver ───────────────────────────────────────────────────────────
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

// ── Margin suggestions ───────────────────────────────────────────────────────

function calcMarginSuggestion(
  cost: number,
  taxDecimal: number,
  config: MarketplaceFeeConfig,
  mlOpCost: number,
): MarginSuggestion {
  let conservative = -1
  let balanced = -1
  let aggressive = -1

  for (let m = 1; m <= 80; m++) {
    const { price, impossible } = resolvePrice(cost, taxDecimal, m, config, mlOpCost)
    if (impossible || price <= 0) continue

    // netProfit = price × m/100 (exact for resolvePrice-derived prices)
    const netProfit = price * m / 100

    if (conservative < 0 && netProfit > cost * 0.2) conservative = m
    if (balanced < 0 && m >= 35) balanced = m
    if (price < cost * 3.5) aggressive = m // keep updating → find max valid m
  }

  if (conservative < 0) conservative = 5
  if (balanced < 0) balanced = 35
  if (aggressive < 0) aggressive = Math.max(conservative, 30)

  const consRes = resolvePrice(cost, taxDecimal, conservative, config, mlOpCost)
  const consProfit = consRes.impossible ? 0 : r2(consRes.price * conservative / 100)
  const aggRes = resolvePrice(cost, taxDecimal, aggressive, config, mlOpCost)
  const aggPrice = aggRes.impossible ? 0 : aggRes.price

  return {
    conservative,
    balanced,
    aggressive,
    conservativeRationale: `Margem mínima sustentável (${conservative}%). Lucro R$${brl(consProfit)} cobre 20% do custo direto.`,
    balancedRationale: `Referência equilibrada: ${balanced}% do preço de venda para produto físico no Brasil.`,
    aggressiveRationale: `Margem máxima competitiva. Preço R$${brl(aggPrice)} ≤ 3,5× o custo direto.`,
  }
}

// ── Candidate generation ─────────────────────────────────────────────────────

function generateCandidates(
  cost: number,
  taxDecimal: number,
  desiredMarginPercent: number,
  config: MarketplaceFeeConfig,
  mlOpCost: number,
  marginSuggestion: MarginSuggestion,
): PriceCandidate[] {
  // Collect all candidate entries
  const pool: PriceCandidate[] = []

  function push(
    price: number,
    rule: FeeRule,
    rationale: string,
    isUserMargin = false,
    impossible = false,
  ) {
    const netProfit = impossible ? 0 : r2(netProfitForFixed(price, rule, taxDecimal, cost, mlOpCost))
    const marginPct = impossible || price <= 0 ? 0 : r2(netProfit / price * 100)
    pool.push({
      rank: 0,
      price: impossible ? 0 : price,
      netProfitPerUnit: netProfit,
      marginPercent: marginPct,
      rule,
      rationale,
      isUserMargin,
      isMathematicallyImpossible: impossible,
    })
  }

  // (a) User's desired margin
  const userRes = resolvePrice(cost, taxDecimal, desiredMarginPercent, config, mlOpCost)
  if (userRes.impossible) {
    push(0, config.rules[0],
      `Impossível: comissão + imposto + margem (${desiredMarginPercent}%) ≥ 100%.`,
      true, true)
  } else {
    const { price: uP, rule: uR } = userRes
    push(uP, uR,
      `Margem de ${desiredMarginPercent}%. ${uR.label} — ${uR.commissionPercent}%` +
      (uR.fixedFee > 0 ? ` + R$${brl(uR.fixedFee)} fixa` : '') + '.',
      true)
  }

  // (b) Boundary analysis — evaluate each faixa transition point
  for (let i = 0; i < config.rules.length - 1; i++) {
    const B = config.rules[i].maxPrice
    const rA = config.rules[i]         // rule at B (current faixa)
    const rB = config.rules[i + 1]     // rule at B + 0.01 (next faixa)

    const profitAtB    = netProfitForFixed(B,        rA, taxDecimal, cost, mlOpCost)
    const profitAboveB = netProfitForFixed(B + 0.01, rB, taxDecimal, cost, mlOpCost)

    if (profitAtB >= profitAboveB) {
      const diff = r2(profitAtB - profitAboveB)
      push(B, rA,
        `R$${brl(B)} mantém ${rA.label} (${rA.commissionPercent}%` +
        (rA.fixedFee > 0 ? `+R$${brl(rA.fixedFee)}` : '') +
        `). Cruzar para R$${brl(B + 0.01)} = ${rB.label}: lucro cai R$${brl(diff)}.`)
    } else {
      const diff = r2(profitAboveB - profitAtB)
      push(B + 0.01, rB,
        `R$${brl(B + 0.01)} entra em ${rB.label} (${rB.commissionPercent}%` +
        (rB.fixedFee > 0 ? `+R$${brl(rB.fixedFee)}` : '') +
        `). Lucro sobe R$${brl(diff)} vs ficar na faixa anterior.`)
    }
  }

  // (c) Margin suggestion candidates
  const suggestionEntries: [string, number, string][] = [
    ['conservative', marginSuggestion.conservative, marginSuggestion.conservativeRationale],
    ['balanced',     marginSuggestion.balanced,     marginSuggestion.balancedRationale],
    ['aggressive',   marginSuggestion.aggressive,   marginSuggestion.aggressiveRationale],
  ]
  for (const [, m, rationale] of suggestionEntries) {
    if (m > 0) {
      const res = resolvePrice(cost, taxDecimal, m, config, mlOpCost)
      if (!res.impossible) push(res.price, res.rule, rationale)
    }
  }

  // Separate user entry and non-user entries
  const userEntry = pool.find((c) => c.isUserMargin)
  const others = pool.filter((c) => !c.isUserMargin && !c.isMathematicallyImpossible)

  // Deduplicate by price (keep highest netProfit for same rounded price)
  const deduped = new Map<string, PriceCandidate>()
  for (const c of others) {
    const pk = c.price.toFixed(2)
    const existing = deduped.get(pk)
    if (!existing || c.netProfitPerUnit > existing.netProfitPerUnit) {
      deduped.set(pk, c)
    }
  }

  // Top 3 by netProfitPerUnit DESC
  const top3 = Array.from(deduped.values())
    .sort((a, b) => b.netProfitPerUnit - a.netProfitPerUnit)
    .slice(0, 3)

  // Assign ranks and mark user's price if it coincides
  const result: PriceCandidate[] = top3.map((c, i) => ({
    ...c,
    rank: i + 1,
    isUserMargin:
      userEntry &&
      !userEntry.isMathematicallyImpossible &&
      c.price.toFixed(2) === userEntry.price.toFixed(2)
        ? true
        : false,
  }))

  // Append user's candidate if not already in top 3
  if (userEntry) {
    const userPriceInTop3 =
      !userEntry.isMathematicallyImpossible &&
      top3.some((c) => c.price.toFixed(2) === userEntry.price.toFixed(2))

    if (!userPriceInTop3) {
      result.push({ ...userEntry, rank: 0 })
    }
  }

  return result
}

// ── Boundary warnings ─────────────────────────────────────────────────────────

function generateBoundaryWarnings(
  cost: number,
  taxDecimal: number,
  config: MarketplaceFeeConfig,
  mlOpCost: number,
  userPrice: number,
): BoundaryWarning[] {
  const warnings: BoundaryWarning[] = []

  for (let i = 0; i < config.rules.length - 1; i++) {
    const B  = config.rules[i].maxPrice
    const rA = config.rules[i]
    const rB = config.rules[i + 1]

    const profitAtB    = netProfitForFixed(B,        rA, taxDecimal, cost, mlOpCost)
    const profitAboveB = netProfitForFixed(B + 0.01, rB, taxDecimal, cost, mlOpCost)
    const diff = r2(Math.abs(profitAtB - profitAboveB))

    if (diff <= 1.0) continue

    const betterIsBoundary   = profitAtB >= profitAboveB
    const userIsAboveBoundary = userPrice > B

    if (userIsAboveBoundary && betterIsBoundary) {
      warnings.push({
        message: `⚡ R$${brl(B)} (${rA.label}) = lucro +R$${brl(diff)} por peça`,
        profitDifference: diff,
        currentPrice: userPrice,
        suggestedPrice: B,
      })
    } else if (!userIsAboveBoundary && !betterIsBoundary) {
      warnings.push({
        message: `⚡ R$${brl(B + 0.01)} (${rB.label}) = lucro +R$${brl(diff)} por peça`,
        profitDifference: diff,
        currentPrice: userPrice,
        suggestedPrice: B + 0.01,
      })
    }
  }

  return warnings
}

// ── Main export ───────────────────────────────────────────────────────────────

export function calculatePricing(input: CalculatorInput): CalculatorOutput {
  const { production, seller, marketplaces, overrides, desiredMarginPercent } = input
  const errors: string[] = []

  // Validation
  if (production.filamentWeightGrams <= 0) {
    errors.push('Peso do filamento deve ser maior que zero.')
  }
  if (production.filamentPricePerKg < 0) {
    errors.push('Preço do filamento não pode ser negativo.')
  }

  // Cost breakdown
  const filamentCost       = r2((production.filamentPricePerKg / 1000) * production.filamentWeightGrams)
  const postProcessingCost = r2(production.postProcessingCost)
  const otherDirectCosts   = r2(production.otherDirectCosts)
  const baseCost           = r2(filamentCost + postProcessingCost + otherDirectCosts)
  const failureRate        = Math.min(Math.max(production.failureRatePercent, 0), 99)
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
        activeRule: feeConfig.rules[0],
        candidates: [],
        marginSuggestion: {
          conservative: 0, balanced: 0, aggressive: 0,
          conservativeRationale: '', balancedRationale: '', aggressiveRationale: '',
        },
        boundaryWarnings: [],
        isBestPrice: false,
        isBestProfit: false,
        isBlocked: true,
        blockedReason: 'Requer CNPJ. Regime fiscal atual (CPF) não é permitido neste canal.',
        requiresCNPJ: true,
        notes: feeConfig.notes,
      })
      continue
    }

    // Apply ML commission overrides
    let configToUse = feeConfig
    let mlOpCost = 0

    if (key === 'ml_classico') {
      configToUse = {
        ...feeConfig,
        rules: feeConfig.rules.map((r) => ({ ...r, commissionPercent: overrides.mlClassicoCommission })),
      }
      mlOpCost = overrides.mlOperationalCostPerUnit
    } else if (key === 'ml_premium') {
      configToUse = {
        ...feeConfig,
        rules: feeConfig.rules.map((r) => ({ ...r, commissionPercent: overrides.mlPremiumCommission })),
      }
      mlOpCost = overrides.mlOperationalCostPerUnit
    }

    const marginSuggestion = calcMarginSuggestion(effectiveCostPerUnit, taxDecimal, configToUse, mlOpCost)
    const candidates       = generateCandidates(effectiveCostPerUnit, taxDecimal, desiredMarginPercent, configToUse, mlOpCost, marginSuggestion)

    // Active rule: from user's candidate (or rank 1 as fallback)
    const userC    = candidates.find((c) => c.isUserMargin && !c.isMathematicallyImpossible)
                  ?? candidates.find((c) => c.rank === 1)
    const activeRule = userC?.rule ?? configToUse.rules[0]
    const userPrice  = userC?.price ?? 0

    const boundaryWarnings = generateBoundaryWarnings(effectiveCostPerUnit, taxDecimal, configToUse, mlOpCost, userPrice)

    results.push({
      key,
      label: feeConfig.label,
      activeRule,
      candidates,
      marginSuggestion,
      boundaryWarnings,
      isBestPrice: false,
      isBestProfit: false,
      isBlocked: false,
      requiresCNPJ: feeConfig.requiresCNPJ,
      notes: feeConfig.notes,
    })
  }

  // Mark best price / best profit
  const nonBlocked = results.filter((r) => !r.isBlocked)
  if (nonBlocked.length > 0) {
    const top1Price  = (r: MarketplaceResult) => r.candidates.find((c) => c.rank === 1)?.price          ?? Infinity
    const top1Profit = (r: MarketplaceResult) => r.candidates.find((c) => c.rank === 1)?.netProfitPerUnit ?? -Infinity

    const minPrice  = Math.min(...nonBlocked.map(top1Price))
    const maxProfit = Math.max(...nonBlocked.map(top1Profit))

    for (const r of results) {
      if (r.isBlocked) continue
      const c = r.candidates.find((c) => c.rank === 1)
      if (c && !c.isMathematicallyImpossible) {
        r.isBestPrice  = c.price          === minPrice
        r.isBestProfit = c.netProfitPerUnit === maxProfit
      }
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
  const { seller, marketplaces, overrides, desiredMarginPercent } = input
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

    if (key === 'ml_classico') {
      configToUse = { ...feeConfig, rules: feeConfig.rules.map((r) => ({ ...r, commissionPercent: overrides.mlClassicoCommission })) }
      mlOpCost = overrides.mlOperationalCostPerUnit
    } else if (key === 'ml_premium') {
      configToUse = { ...feeConfig, rules: feeConfig.rules.map((r) => ({ ...r, commissionPercent: overrides.mlPremiumCommission })) }
      mlOpCost = overrides.mlOperationalCostPerUnit
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
