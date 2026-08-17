import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TierSwitcher from './TierSwitcher.vue'

describe('TierSwitcher', () => {
  it('emits the selected tier', async () => {
    const wrapper = mount(TierSwitcher, { props: { tier: 'basic' } })

    await wrapper.get('#tier-switcher').trigger('click')
    await wrapper.get('[aria-selected="false"] button').trigger('click')

    expect(wrapper.emitted('update:tier')?.[0]).toEqual(['premium'])
  })

  it('opens the menu on avatar hover', async () => {
    const wrapper = mount(TierSwitcher, { props: { tier: 'basic' } })

    expect(wrapper.get('#tier-switcher').text()).toContain('basic')
    expect(wrapper.get('#tier-switcher').text()).toContain('Alex Johnson')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)

    await wrapper.trigger('mouseenter')

    expect(wrapper.find('[role="listbox"]').exists()).toBe(true)
  })
})
