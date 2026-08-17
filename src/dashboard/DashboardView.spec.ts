import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DashboardView from './DashboardView.vue'

describe('DashboardView', () => {
  it('keeps product identifiers out of the DOM when comparison is gated', () => {
    const wrapper = mount(DashboardView)
    const html = wrapper.html()

    expect(wrapper.findComponent({ name: 'ScoreComparison' }).exists()).toBe(false)
    expect(html).not.toContain('BrandA')
    expect(html).not.toContain('BrandB')
    expect(html).not.toContain('BrandC')
    expect(html).not.toContain('DW-100')
    expect(html).not.toContain('DW-200')
    expect(html).not.toContain('DW-300')
  })

  it('hides the export control on the gated comparison tier', () => {
    const wrapper = mount(DashboardView)
    const exportControl = wrapper.findComponent({ name: 'ReportExportButton' })

    expect(exportControl.exists()).toBe(true)
    expect(exportControl.props('visible')).toBe(false)
    expect(exportControl.props('enabled')).toBe(false)
  })
})
