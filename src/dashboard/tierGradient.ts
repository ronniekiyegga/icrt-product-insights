import type { Tier } from '../entitlements/types'

export const TIER_GRADIENT: Record<Tier, string> = {
  basic: 'bg-gradient-blue',
  premium: 'bg-gradient-to-b from-gradient-blue-from to-gradient-red-to',
  enterprise: 'bg-gradient-red',
}
