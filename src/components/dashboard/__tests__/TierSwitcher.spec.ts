import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TierSwitcher from '../TierSwitcher.vue'

describe('TierSwitcher', () => {
  it('emits the selected tier', async () => {
    const wrapper = mount(TierSwitcher, { props: { tier: 'basic' } })

    await wrapper.get('#tier-switcher').trigger('click')
    await wrapper.get('[role="menuitemradio"][aria-checked="false"]').trigger('click')

    expect(wrapper.emitted('update:tier')?.[0]).toEqual(['premium'])
  })

  it('opens the menu on avatar hover', async () => {
    const wrapper = mount(TierSwitcher, { props: { tier: 'basic' } })

    expect(wrapper.get('#tier-switcher').text()).toContain('basic')
    expect(wrapper.get('#tier-switcher').text()).toContain('Alex Johnson')
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)

    await wrapper.trigger('mouseenter')

    expect(wrapper.find('[role="menu"]').exists()).toBe(true)
  })

  it('supports arrow-key navigation and Escape', async () => {
    const wrapper = mount(TierSwitcher, { props: { tier: 'basic' }, attachTo: document.body })
    const trigger = wrapper.get('#tier-switcher')

    await trigger.trigger('keydown', { key: 'ArrowDown' })
    await wrapper.vm.$nextTick()

    const options = wrapper.findAll('[role="menuitemradio"]')
    expect(options).toHaveLength(3)
    expect(document.activeElement).toBe(options[0]?.element)

    await options[0]?.trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(options[1]?.element)

    await options[1]?.trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger.element)

    wrapper.unmount()
  })
})
