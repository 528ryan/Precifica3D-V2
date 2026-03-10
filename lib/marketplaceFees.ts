import type { MarketplaceToggles } from '@/types'

// ── Fee configuration per marketplace channel ──────────────────────────────

export interface FeeConfig {
  key: keyof MarketplaceToggles
  label: string
  shortLabel: string
  defaultCommissionRate: number      // decimal
  fixedFee: number                   // R$
  fixedFeeThreshold: number          // price below which fixed fee applies (Infinity = always)
  lowPriceThreshold: number          // price below which 50% rule applies (0 = n/a)
  lowPriceFeeRate: number            // usually 0.5
  keepFixedFeeOnLowPrice: boolean
  blockForCpf: boolean               // if true + regime=cpf → exclude result entirely
  requiresCnpjWarning: boolean       // if true + regime=cpf/mei → show warning
  commissionDescription: string
}

// ── Constants ──────────────────────────────────────────────────────────────

const ML_FIXED_FEE = 5.5
const ML_FIXED_FEE_THRESHOLD = 79
const ML_LOW_PRICE_THRESHOLD = 12.5
const ML_LOW_PRICE_FEE_RATE = 0.5

const SHOPEE_CPF_FIXED_FEE = 7.0
const SHOPEE_LOW_PRICE_THRESHOLD = 10.0
const SHOPEE_LOW_PRICE_FEE_RATE = 0.5

const SHOPEE_CNPJ_FIXED_FEE = 4.0

const TIKTOK_FIXED_FEE = 2.0
const TIKTOK_FIXED_FEE_THRESHOLD = 79

// ── Fee configs ────────────────────────────────────────────────────────────

export const FEE_CONFIGS: FeeConfig[] = [
  {
    key: 'mlClassico',
    label: 'Mercado Livre Clássico',
    shortLabel: 'ML Clássico',
    defaultCommissionRate: 0.12,
    fixedFee: ML_FIXED_FEE,
    fixedFeeThreshold: ML_FIXED_FEE_THRESHOLD,
    lowPriceThreshold: ML_LOW_PRICE_THRESHOLD,
    lowPriceFeeRate: ML_LOW_PRICE_FEE_RATE,
    keepFixedFeeOnLowPrice: false,
    blockForCpf: false,
    requiresCnpjWarning: false,
    commissionDescription: '10–14% (ajustável) + R$5,50 fixo se < R$79',
  },
  {
    key: 'mlPremium',
    label: 'Mercado Livre Premium',
    shortLabel: 'ML Premium',
    defaultCommissionRate: 0.16,
    fixedFee: ML_FIXED_FEE,
    fixedFeeThreshold: ML_FIXED_FEE_THRESHOLD,
    lowPriceThreshold: ML_LOW_PRICE_THRESHOLD,
    lowPriceFeeRate: ML_LOW_PRICE_FEE_RATE,
    keepFixedFeeOnLowPrice: false,
    blockForCpf: false,
    requiresCnpjWarning: false,
    commissionDescription: '15–19% (ajustável) + R$5,50 fixo se < R$79',
  },
  {
    key: 'shopeeCpfSemFrete',
    label: 'Shopee CPF',
    shortLabel: 'Shopee CPF',
    defaultCommissionRate: 0.14,
    fixedFee: SHOPEE_CPF_FIXED_FEE,
    fixedFeeThreshold: Infinity,
    lowPriceThreshold: SHOPEE_LOW_PRICE_THRESHOLD,
    lowPriceFeeRate: SHOPEE_LOW_PRICE_FEE_RATE,
    keepFixedFeeOnLowPrice: true,
    blockForCpf: false,
    requiresCnpjWarning: false,
    commissionDescription: '14% + R$7,00 fixo',
  },
  {
    key: 'shopeeCpfComFrete',
    label: 'Shopee CPF — Frete Grátis Extra',
    shortLabel: 'Shopee Frete',
    defaultCommissionRate: 0.20,
    fixedFee: SHOPEE_CPF_FIXED_FEE,
    fixedFeeThreshold: Infinity,
    lowPriceThreshold: SHOPEE_LOW_PRICE_THRESHOLD,
    lowPriceFeeRate: SHOPEE_LOW_PRICE_FEE_RATE,
    keepFixedFeeOnLowPrice: true,
    blockForCpf: false,
    requiresCnpjWarning: false,
    commissionDescription: '20% + R$7,00 fixo',
  },
  {
    key: 'shopeeCnpj',
    label: 'Shopee CNPJ',
    shortLabel: 'Shopee CNPJ',
    defaultCommissionRate: 0.14,   // 12% plataforma + 2% transação
    fixedFee: SHOPEE_CNPJ_FIXED_FEE,
    fixedFeeThreshold: Infinity,
    lowPriceThreshold: 0,
    lowPriceFeeRate: 0,
    keepFixedFeeOnLowPrice: false,
    blockForCpf: false,
    requiresCnpjWarning: true,
    commissionDescription: '12% + 2% transação + R$4,00 fixo',
  },
  {
    key: 'tiktokShop',
    label: 'TikTok Shop',
    shortLabel: 'TikTok',
    defaultCommissionRate: 0.06,
    fixedFee: TIKTOK_FIXED_FEE,
    fixedFeeThreshold: TIKTOK_FIXED_FEE_THRESHOLD,
    lowPriceThreshold: 0,
    lowPriceFeeRate: 0,
    keepFixedFeeOnLowPrice: false,
    blockForCpf: true,             // CPF → bloquear resultado
    requiresCnpjWarning: true,
    commissionDescription: '6% + R$2,00 fixo se < R$79',
  },
  {
    key: 'vendaDireta',
    label: 'Venda Direta',
    shortLabel: 'Direta',
    defaultCommissionRate: 0.0,
    fixedFee: 0,
    fixedFeeThreshold: 0,
    lowPriceThreshold: 0,
    lowPriceFeeRate: 0,
    keepFixedFeeOnLowPrice: false,
    blockForCpf: false,
    requiresCnpjWarning: false,
    commissionDescription: 'Sem comissão de marketplace — apenas imposto',
  },
]

// ── ML commission ranges ────────────────────────────────────────────────────

export const ML_CLASSICO_RANGE = { min: 10, max: 14, default: 12 }
export const ML_PREMIUM_RANGE  = { min: 15, max: 19, default: 16 }

export function getFeeConfig(key: keyof MarketplaceToggles): FeeConfig {
  const config = FEE_CONFIGS.find((c) => c.key === key)
  if (!config) throw new Error(`Marketplace desconhecido: ${key}`)
  return config
}
