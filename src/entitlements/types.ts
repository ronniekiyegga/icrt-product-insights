export type Tier = 'basic' | 'premium' | 'enterprise'

export interface Capabilities {
  viewAggregates: boolean
  viewComparison: boolean
  exportReport: boolean
}
