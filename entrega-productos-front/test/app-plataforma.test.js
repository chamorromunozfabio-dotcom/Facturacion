import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

const esMovil = vi.hoisted(() => vi.fn())

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: esMovil },
}))

import App from '../src/App.vue'

const ruta = { template: '<div data-test="ruta">pantalla</div>' }
const montar = () => mount(App, { global: { stubs: { RouterView: ruta } } })

describe('App.vue — separación web/móvil', () => {
  it('en navegador no monta IonApp, para que el documento pueda scrollear', () => {
    esMovil.mockReturnValue(false)

    const wrapper = montar()

    expect(wrapper.findComponent({ name: 'IonApp' }).exists()).toBe(false)
    expect(wrapper.find('[data-test="ruta"]').exists()).toBe(true)
  })

  it('en el WebView nativo sí monta IonApp', () => {
    esMovil.mockReturnValue(true)

    const wrapper = montar()

    expect(wrapper.findComponent({ name: 'IonApp' }).exists()).toBe(true)
    expect(wrapper.find('[data-test="ruta"]').exists()).toBe(true)
  })
})
