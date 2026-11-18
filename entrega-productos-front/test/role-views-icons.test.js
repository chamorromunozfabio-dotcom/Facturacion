import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { h } from 'vue'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))

vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))

import MainLayout from '../src/layouts/MainLayout.vue'
import DashboardView from '../src/views/DashboardView.vue'
import { useAuthStore } from '../src/stores/auth'

const RouterLinkStub = {
  props: ['to'],
  setup(props, { slots }) {
    return () => h('a', { href: props.to }, slots.default?.())
  },
}

const RouterViewStub = {
  setup(_, { slots }) {
    return () => h('div', slots.default?.({ Component: h('p', 'Contenido de prueba') }))
  },
}

const globalOptions = {
  components: { RouterLink: RouterLinkStub, RouterView: RouterViewStub },
}

const login = (role) => useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: role })

describe('Test 25 — Vistas por rol con iconos Lucide y transiciones', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    push.mockClear()
  })

  it('admin ve los 7 módulos con iconos SVG en vez de emoji', () => {
    login('admin')

    const wrapper = mount(MainLayout, { global: globalOptions })
    const labels = wrapper.findAll('.menu__item').map((item) => item.text())

    expect(labels).toHaveLength(7)
    expect(labels).toContain('Permisos')
    expect(labels).toContain('Roles')
    expect(wrapper.findAll('.menu__item svg')).toHaveLength(7)
    expect(wrapper.text()).not.toContain('🏠')
  })

  it('bodeguero ve solo Inicio, Tipos, Bodegas, Usuarios y Facturas', () => {
    login('bodeguero')

    const wrapper = mount(MainLayout, { global: globalOptions })
    const labels = wrapper.findAll('.menu__item').map((item) => item.text())

    expect(labels).toEqual(['Inicio', 'Tipos', 'Bodegas', 'Usuarios', 'Facturas'])
    expect(wrapper.findAll('.menu__item svg')).toHaveLength(5)
    expect(wrapper.text()).not.toContain('Permisos')
    expect(wrapper.text()).not.toContain('Roles')
  })

  it('cliente ve solo Inicio y Facturas', () => {
    login('cliente')

    const wrapper = mount(MainLayout, { global: globalOptions })
    const labels = wrapper.findAll('.menu__item').map((item) => item.text())

    expect(labels).toEqual(['Inicio', 'Facturas'])
    expect(wrapper.findAll('.menu__item svg')).toHaveLength(2)
  })

  it('el dashboard muestra solo los módulos del rol y un mensaje acorde', () => {
    login('cliente')

    const wrapper = mount(DashboardView, { global: globalOptions })
    const cards = wrapper.findAll('.card')

    expect(cards).toHaveLength(1)
    expect(cards[0].text()).toContain('Facturas')
    expect(cards[0].find('svg').exists()).toBe(true)
    expect(wrapper.text()).toContain('Consulta tus facturas')
    expect(wrapper.text()).not.toContain('Estado del día 1')
  })

  it('el contenido del layout usa una transición de Vue', () => {
    login('admin')

    const wrapper = mount(MainLayout, { global: globalOptions })

    expect(wrapper.findComponent({ name: 'Transition' }).exists()).toBe(true)
  })
})
