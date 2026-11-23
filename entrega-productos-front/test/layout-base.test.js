import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

const esMovil = vi.hoisted(() => vi.fn())

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: esMovil },
}))

import { menuController } from '@ionic/vue'
import LayoutBase from '../src/layouts/LayoutBase.vue'

const montar = (abierto = false) =>
  mount(LayoutBase, {
    props: { abierto, menu: [], logoUrl: '/logo.png', role: 'admin' },
    slots: {
      sidebar: '<aside data-test="sidebar-slot">sidebar</aside>',
      topbar: '<header data-test="topbar-slot">topbar</header>',
      default: '<p data-test="contenido">contenido</p>',
    },
  })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('LayoutBase — layout web y shell Ionic', () => {
  it('en navegador conserva el grid y los slots de sidebar, topbar y contenido', () => {
    esMovil.mockReturnValue(false)

    const wrapper = montar()
    const layout = wrapper.find('.layout')

    expect(layout.exists()).toBe(true)
    expect(layout.attributes('data-role')).toBe('admin')
    expect(wrapper.find('[data-test="sidebar-slot"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="topbar-slot"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="contenido"]').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'IonMenu' }).exists()).toBe(false)
  })

  it('en móvil usa IonMenu, IonHeader, IonToolbar, IonContent e IonPage', () => {
    esMovil.mockReturnValue(true)

    const wrapper = montar()

    for (const nombre of ['IonMenu', 'IonHeader', 'IonToolbar', 'IonContent', 'IonPage']) {
      expect(wrapper.findComponent({ name: nombre }).exists()).toBe(true)
    }
    expect(wrapper.find('.layout').exists()).toBe(false)
    expect(wrapper.find('[data-test="contenido"]').exists()).toBe(true)
  })

  it('abre y cierra el menú Ionic cuando cambia el estado', async () => {
    esMovil.mockReturnValue(true)

    const wrapper = montar()
    await wrapper.setProps({ abierto: true })

    expect(menuController.open).toHaveBeenCalledWith('menu-principal')

    await wrapper.setProps({ abierto: false })
    expect(menuController.close).toHaveBeenCalledWith('menu-principal')
  })

  it('avisa al padre cuando Ionic cierra el menú', () => {
    esMovil.mockReturnValue(true)

    const wrapper = montar(true)
    wrapper.findComponent({ name: 'IonMenu' }).vm.$emit('ionDidClose')

    expect(wrapper.emitted('cerrar')).toHaveLength(1)
  })
})
