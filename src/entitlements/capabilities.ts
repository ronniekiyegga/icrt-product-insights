import type { Capabilities, Tier } from './types'

const CAPABILITIES: Readonly<Record<Tier, Capabilities>> = Object.freeze({
  basic: { viewAggregates: true, viewComparison: false, exportReport: false },
  premium: { viewAggregates: true, viewComparison: true, exportReport: false },
  enterprise: { viewAggregates: true, viewComparison: true, exportReport: true },
})

export const TIERS = ['basic', 'premium', 'enterprise'] as const satisfies readonly Tier[]

export function isTier(value: unknown): value is Tier {
  return TIERS.some((tier) => tier === value)
}

export function resolveCapabilities(tier: unknown): Capabilities {
  return isTier(tier) ? CAPABILITIES[tier] : CAPABILITIES.basic
}
