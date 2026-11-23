import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

const esMovil = vi.hoisted(() => vi.fn())

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: esMovil },
}))

import ModalBase from '../src/components/ui/ModalBase.vue'

const montar = (open) =>
  mount(ModalBase, {
    props: { open, testId: 'dialogo', label: 'Diálogo de prueba' },
    slots: { default: '<p data-test="contenido">contenido</p>' },
  })

describe('ModalBase — diálogos web y móvil', () => {
  it('en navegador conserva el modal HTML con backdrop', () => {
    esMovil.mockReturnValue(false)

    const wrapper = montar(true)

    expect(wrapper.find('.modal').exists()).toBe(true)
    expect(wrapper.find('.modal__backdrop').exists()).toBe(true)
    expect(wrapper.find('[data-test="dialogo"]').attributes('role')).toBe('dialog')
    expect(wrapper.find('[data-test="contenido"]').exists()).toBe(true)
  })

  it('en navegador no renderiza el panel cuando está cerrado', () => {
    esMovil.mockReturnValue(false)

    expect(montar(false).find('[data-test="dialogo"]').exists()).toBe(false)
  })

  it('en móvil usa IonModal sin el backdrop propio', () => {
    esMovil.mockReturnValue(true)

    const wrapper = montar(true)

    expect(wrapper.findComponent({ name: 'IonModal' }).exists()).toBe(true)
    expect(wrapper.find('[data-test="dialogo"]').exists()).toBe(true)
    expect(wrapper.find('.modal__backdrop').exists()).toBe(false)
  })
})
