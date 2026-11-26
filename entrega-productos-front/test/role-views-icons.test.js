import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { h } from 'vue'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))

vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))

import MainLayout from '../src/modules/layout/layouts/MainLayout.vue'
import DashboardView from '../src/modules/inicio/views/DashboardView.vue'
import { useAuthStore } from '../src/modules/auth/store/auth'

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

  it('admin ve los 9 módulos con iconos SVG en vez de emoji', () => {
    login('admin')

    const wrapper = mount(MainLayout, { global: globalOptions })
    const labels = wrapper.findAll('.menu__item').map((item) => item.text())

    expect(labels).toHaveLength(9)
    expect(labels).toContain('Empresas')
    expect(labels).toContain('Permisos')
    expect(labels).toContain('Roles')
    expect(labels).toContain('Estadísticas')
    expect(wrapper.findAll('.menu__item svg')).toHaveLength(9)
    expect(wrapper.text()).not.toContain('🏠')
  })

  it('empresa ve Inicio, Tipos, Bodegas, Facturas y Estadísticas (sin Usuarios)', () => {
    login('empresa')

    const wrapper = mount(MainLayout, { global: globalOptions })
    const labels = wrapper.findAll('.menu__item').map((item) => item.text())

    expect(labels).toEqual([
      'Inicio',
      'Tipos',
      'Bodegas',
      'Facturas',
      'Estadísticas',
    ])
    expect(wrapper.text()).not.toContain('Usuarios')
    expect(wrapper.text()).not.toContain('Empresas')
    expect(wrapper.text()).not.toContain('Permisos')
    expect(wrapper.text()).not.toContain('Roles')
  })

  it('bodeguero ve Inicio, Tipos, Facturas y Estadísticas (sin Bodegas)', () => {
    login('bodeguero')

    const wrapper = mount(MainLayout, { global: globalOptions })
    const labels = wrapper.findAll('.menu__item').map((item) => item.text())

    expect(labels).toEqual(['Inicio', 'Tipos', 'Facturas', 'Estadísticas'])
    expect(wrapper.findAll('.menu__item svg')).toHaveLength(4)
    expect(wrapper.text()).not.toContain('Bodegas')
    expect(wrapper.text()).not.toContain('Permisos')
    expect(wrapper.text()).not.toContain('Roles')
  })

  it('cliente ve Inicio, Facturas y Estadísticas', () => {
    login('cliente')

    const wrapper = mount(MainLayout, { global: globalOptions })
    const labels = wrapper.findAll('.menu__item').map((item) => item.text())

    expect(labels).toEqual(['Inicio', 'Facturas', 'Estadísticas'])
    expect(wrapper.findAll('.menu__item svg')).toHaveLength(3)
  })

  it('el dashboard muestra solo los módulos del rol y un mensaje acorde', () => {
    login('cliente')

    const wrapper = mount(DashboardView, { global: globalOptions })
    const cards = wrapper.findAll('.card')

    expect(cards).toHaveLength(2)
    expect(cards[0].text()).toContain('Facturas')
    expect(cards[1].text()).toContain('Estadísticas')
    expect(cards[0].find('svg').exists()).toBe(true)
    expect(wrapper.text()).toContain('Consulta tus facturas')
    expect(wrapper.text()).not.toContain('Estado del día 1')
  })

  it('el mensaje del inicio menciona Estadísticas y se ajusta a cada rol', () => {
    const mensajes = {
      admin: 'Supervisa todos los módulos, el ciclo completo de las facturas y las estadísticas globales.',
      empresa:
        'Administra tus bodegas, tu equipo y las facturas de tu empresa, y revisa sus estadísticas.',
      bodeguero:
        'Gestionas Tipos, tus bodegas, el ciclo de las facturas y consultas tus estadísticas.',
      cliente:
        'Consulta tus facturas, acéptalas o recházalas, descarga el PDF y revisa tus estadísticas.',
    }

    for (const [rol, mensaje] of Object.entries(mensajes)) {
      login(rol)
      const wrapper = mount(DashboardView, { global: globalOptions })

      expect(wrapper.find('.subtitle').text()).toBe(mensaje)
      wrapper.unmount()
    }
  })

  it('el contenido del layout usa una transición de Vue', () => {
    login('admin')

    const wrapper = mount(MainLayout, { global: globalOptions })

    expect(wrapper.findComponent({ name: 'Transition' }).exists()).toBe(true)
  })
})
