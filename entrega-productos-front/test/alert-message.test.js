import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AlertMessage from '../src/components/AlertMessage.vue'

function mountAlert(props = {}) {
  return mount(AlertMessage, {
    props: { message: 'Registro guardado', ...props },
  })
}

describe('Test 12 — AlertMessage', () => {
  it('muestra el mensaje con rol alert', () => {
    const wrapper = mountAlert()

    expect(wrapper.text()).toContain('Registro guardado')
    expect(wrapper.attributes('role')).toBe('alert')
  })

  it('aplica la clase según el tipo', () => {
    const success = mountAlert({ type: 'success' })
    const error = mountAlert({ type: 'error' })

    expect(success.classes()).toContain('alert--success')
    expect(error.classes()).toContain('alert--error')
  })

  it('emite close al cerrar', async () => {
    const wrapper = mountAlert()

    await wrapper.find('[data-test="close"]').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('oculta el botón de cerrar si dismissible es false', () => {
    const wrapper = mountAlert({ dismissible: false })

    expect(wrapper.find('[data-test="close"]').exists()).toBe(false)
  })
})
