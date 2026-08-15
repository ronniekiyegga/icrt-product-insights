import { describe, expect, it } from 'vitest'
import { resolveCapabilities } from './capabilities'

describe('resolveCapabilities', () => {
  it('basic resolves to aggregates only', () => {
    expect(resolveCapabilities('basic')).toEqual({
      viewAggregates: true,
      viewComparison: false,
      exportReport: false,
    })
  })

  it('premium resolves to aggregates and comparison, no export', () => {
    expect(resolveCapabilities('premium')).toEqual({
      viewAggregates: true,
      viewComparison: true,
      exportReport: false,
    })
  })

  it('enterprise resolves to all three', () => {
    expect(resolveCapabilities('enterprise')).toEqual({
      viewAggregates: true,
      viewComparison: true,
      exportReport: true,
    })
  })

  it('unknown input falls back to basic', () => {
    const basic = resolveCapabilities('basic')

    expect(resolveCapabilities('unknown')).toEqual(basic)
    expect(resolveCapabilities(undefined)).toEqual(basic)
    expect(resolveCapabilities(null)).toEqual(basic)
    expect(resolveCapabilities(1)).toEqual(basic)
  })
})
