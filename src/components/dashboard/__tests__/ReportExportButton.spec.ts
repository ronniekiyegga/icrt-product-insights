import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ReportExportButton from '../ReportExportButton.vue'

describe('ReportExportButton', () => {
  it('refuses the action when ungated', async () => {
    const wrapper = mount(ReportExportButton, { props: { enabled: false, visible: true } })
    const button = wrapper.get('button')

    expect(button.attributes('aria-disabled')).toBe('true')
    expect(button.attributes('disabled')).toBeUndefined()
    expect(button.classes()).toContain('text-text-disabled')
    expect(button.classes()).not.toContain('bg-gradient-chart-bar')
    expect(button.attributes('aria-describedby')).toBe('export-gate-reason')
    const gateReason = wrapper.get('#export-gate-reason')
    expect(gateReason.text()).toBe('Report export requires Enterprise access')
    expect(gateReason.classes()).not.toContain('invisible')
    expect(gateReason.attributes('aria-hidden')).toBeUndefined()

    await button.trigger('click')
    await button.trigger('keydown.enter')
    await button.trigger('keydown.space')

    expect(wrapper.emitted('export')).toBeUndefined()
  })

  it('emits export when enabled', async () => {
    const wrapper = mount(ReportExportButton, { props: { enabled: true, visible: true } })

    expect(wrapper.get('#export-gate-reason').classes()).toContain('invisible')
    expect(wrapper.get('#export-gate-reason').attributes('aria-hidden')).toBe('true')
    expect(wrapper.get('button').attributes('aria-describedby')).toBeUndefined()
    expect(wrapper.get('button').classes()).toContain('bg-background-card')
    expect(wrapper.get('button').classes()).not.toContain('bg-gradient-chart-bar')
    expect(wrapper.get('button').text()).toContain('Download PDF Report')

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('export')).toEqual([[]])
  })

  it('is present in the tree but removed from layout when hidden', async () => {
    const wrapper = mount(ReportExportButton, { props: { enabled: false, visible: false } })
    const button = wrapper.get('button')

    expect(wrapper.classes()).toContain('hidden')
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(button.attributes('tabindex')).toBe('-1')

    await button.trigger('click')

    expect(wrapper.emitted('export')).toBeUndefined()
  })
})
