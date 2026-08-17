import type { Tier } from '../entitlements/types'

export const TIER_GRADIENT: Record<Tier, string> = {
  basic: 'bg-gradient-blue',
  premium: 'bg-gradient-to-b from-gradient-blue-from to-gradient-red-to',
  enterprise: 'bg-gradient-red',
}

export const TIER_MENU_DOT: Record<Tier, string> = {
  basic: 'bg-gradient-blue',
  premium: 'bg-gradient-premium-menu',
  enterprise: 'bg-gradient-red',
}

export const TIER_MENU_DOT_RING: Record<Tier, string> = {
  basic: 'tier-badge--basic',
  premium: 'tier-badge--premium',
  enterprise: 'tier-badge--enterprise',
}
