import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import { h } from 'vue'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))

vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))

import MainLayout from '../src/layouts/MainLayout.vue'
import SidebarMenu from '../src/components/layout/SidebarMenu.vue'
import TopBar from '../src/components/layout/TopBar.vue'
import { useAuthStore } from '../src/stores/auth'

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8')

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

const mountLayout = () =>
  mount(MainLayout, {
    global: { components: { RouterLink: RouterLinkStub, RouterView: RouterViewStub } },
  })

describe('Test 53 — MainLayout modular: sidebar y barra superior', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    push.mockClear()
  })

  it('el layout solo coordina y deja el markup en las dos piezas', () => {
    const vista = leer('../src/layouts/MainLayout.vue')

    expect(vista).toContain('SidebarMenu')
    expect(vista).toContain('TopBar')
    expect(vista).not.toContain('data-test="sidebar"')
    expect(vista).not.toContain('data-test="menu-toggle"')
    expect(vista.split('\n').length).toBeLessThan(150)
  })

  it('SidebarMenu conserva el drawer, el fondo y la accesibilidad', () => {
    const codigo = leer('../src/components/layout/SidebarMenu.vue')

    for (const test of ['sidebar-backdrop', 'sidebar', 'cerrar-menu']) {
      expect(codigo).toContain(`data-test="${test}"`)
    }
    expect(codigo).toContain('id="menu-principal"')
    expect(codigo).toContain('useModalA11y')
    expect(codigo).toContain('@media (max-width: 1024px)')
    expect(codigo).toContain('transform: translateX(-100%)')
    expect(codigo).toContain('.sidebar--abierto')
  })

  it('TopBar conserva el botón hamburguesa, el usuario y el logout', () => {
    const codigo = leer('../src/components/layout/TopBar.vue')

    expect(codigo).toContain('data-test="menu-toggle"')
    expect(codigo).toContain('aria-controls="menu-principal"')
    expect(codigo).toContain('class="logout"')
    expect(codigo).toContain('menu-toggle__texto')
    expect(codigo).toContain('@media (max-width: 768px)')
  })

  it('las piezas siguen respondiendo al abrir, elegir, Escape y salir', async () => {
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })
    const wrapper = mountLayout()

    expect(wrapper.findComponent(SidebarMenu).exists()).toBe(true)
    expect(wrapper.findComponent(TopBar).exists()).toBe(true)

    const toggle = wrapper.find('[data-test="menu-toggle"]')
    await toggle.trigger('click')
    await flushPromises()

    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('[data-test="sidebar"]').classes()).toContain('sidebar--abierto')
    expect(wrapper.find('[data-test="sidebar-backdrop"]').exists()).toBe(true)

    await wrapper.findAll('.menu__item')[0].trigger('click')
    await flushPromises()
    expect(toggle.attributes('aria-expanded')).toBe('false')

    await toggle.trigger('click')
    await flushPromises()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()
    expect(toggle.attributes('aria-expanded')).toBe('false')

    await wrapper.find('.logout').trigger('click')
    await flushPromises()
    expect(push).toHaveBeenCalledWith({ name: 'login' })
  })
})
