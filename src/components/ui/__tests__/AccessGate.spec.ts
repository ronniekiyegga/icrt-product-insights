import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AccessGate from '../AccessGate.vue'

describe('AccessGate', () => {
  it('renders the gate copy', () => {
    const wrapper = mount(AccessGate, {
      props: {
        title: 'Product-level results',
        description: 'Premium opens up the individual scores and testing times behind that average.',
        actionLabel: 'See Premium Plans',
      },
    })

    expect(wrapper.text()).toContain('Product-level results')
    expect(wrapper.text()).toContain(
      'Premium opens up the individual scores and testing times behind that average.',
    )
    expect(wrapper.get('button').text()).toContain('See Premium Plans')
  })
})
