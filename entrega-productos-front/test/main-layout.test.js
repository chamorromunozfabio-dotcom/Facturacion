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
    return () => h('div', slots.default?.())
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

  it('oculta Usuarios y Permisos para el rol bodeguero', () => {
    useAuthStore().saveSession('token-123', { nombre: 'Luis', rol: 'bodeguero' })

    const wrapper = mountLayout()
    const menu = wrapper.findAll('.menu__item').map((link) => link.text()).join(' ')

    expect(menu).toContain('Tipos')
    expect(menu).not.toContain('Usuarios')
    expect(menu).not.toContain('Permisos')
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
})
