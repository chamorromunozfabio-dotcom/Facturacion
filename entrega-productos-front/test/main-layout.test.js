import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { h } from 'vue'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))

vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))

import MainLayout from '../src/layouts/MainLayout.vue'
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

const mountLayout = () =>
  mount(MainLayout, {
    global: {
      components: { RouterLink: RouterLinkStub, RouterView: RouterViewStub },
    },
  })

describe('Test 8 — MainLayout', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    push.mockClear()
  })

  it('muestra el logo, el nombre del usuario y su rol', () => {
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })

    const wrapper = mountLayout()

    expect(wrapper.find('img').attributes('alt')).toBe('Logo de Entrega de Productos')
    expect(wrapper.text()).toContain('Ana')
    expect(wrapper.text()).toContain('Rol: admin')
  })

  it('oculta Usuarios, Permisos y Roles para el bodeguero', () => {
    useAuthStore().saveSession('token-123', { nombre: 'Luis', rol: 'bodeguero' })

    const wrapper = mountLayout()
    const menu = wrapper.findAll('.menu__item').map((link) => link.text()).join(' ')

    expect(menu).toContain('Tipos')
    expect(menu).not.toContain('Usuarios')
    expect(menu).not.toContain('Permisos')
    expect(menu).not.toContain('Roles')
    expect(menu).not.toContain('Órdenes')
  })

  it('muestra Usuarios y Permisos para el rol admin', () => {
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })

    const wrapper = mountLayout()
    const menu = wrapper.findAll('.menu__item').map((link) => link.text()).join(' ')

    expect(menu).toContain('Usuarios')
    expect(menu).toContain('Permisos')
  })

  it('cierra sesión, limpia localStorage y redirige al login', async () => {
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })
    const wrapper = mountLayout()

    await wrapper.find('.logout').trigger('click')
    await flushPromises()

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
    expect(useAuthStore().isAuthenticated).toBe(false)
    expect(push).toHaveBeenCalledWith({ name: 'login' })
  })

  it('abre el menú con el botón hamburguesa y lo cierra con el fondo', async () => {
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })
    const wrapper = mountLayout()
    const toggle = wrapper.find('[data-test="menu-toggle"]')

    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('[data-test="sidebar"]').classes()).not.toContain('sidebar--abierto')
    expect(wrapper.find('[data-test="sidebar-backdrop"]').exists()).toBe(false)

    await toggle.trigger('click')
    await flushPromises()

    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('[data-test="sidebar"]').classes()).toContain('sidebar--abierto')
    expect(wrapper.find('[data-test="sidebar-backdrop"]').exists()).toBe(true)

    await wrapper.find('[data-test="sidebar-backdrop"]').trigger('click')
    await flushPromises()

    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('[data-test="sidebar-backdrop"]').exists()).toBe(false)
  })

  it('cierra el menú al elegir una opción o al presionar Escape', async () => {
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })
    const wrapper = mountLayout()
    const toggle = wrapper.find('[data-test="menu-toggle"]')

    await toggle.trigger('click')
    await flushPromises()
    expect(toggle.attributes('aria-expanded')).toBe('true')

    await wrapper.findAll('.menu__item')[0].trigger('click')
    await flushPromises()
    expect(toggle.attributes('aria-expanded')).toBe('false')

    await toggle.trigger('click')
    await flushPromises()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()

    expect(toggle.attributes('aria-expanded')).toBe('false')
  })

  it('cierra el menú al cerrar sesión', async () => {
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })
    const wrapper = mountLayout()
    const toggle = wrapper.find('[data-test="menu-toggle"]')

    await toggle.trigger('click')
    await flushPromises()
    expect(toggle.attributes('aria-expanded')).toBe('true')

    await wrapper.find('.logout').trigger('click')
    await flushPromises()

    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(push).toHaveBeenCalledWith({ name: 'login' })
  })
})
