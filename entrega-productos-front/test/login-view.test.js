import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push }),
}))

import LoginView from '../src/views/LoginView.vue'
import { useAuthStore } from '../src/stores/auth'

describe('Test 7 — LoginView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    push.mockClear()
  })

  it('muestra el formulario, el logo y el aviso de modo demo', () => {
    const wrapper = mount(LoginView)

    expect(wrapper.find('h1').text()).toBe('Iniciar sesión')
    expect(wrapper.find('img').attributes('alt')).toBe('Logo de Entrega de Productos')
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Modo demo activo')
  })

  it('valida campos vacíos sin iniciar sesión', async () => {
    const wrapper = mount(LoginView)

    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('.error').text()).toBe('Ingresa correo y contraseña.')
    expect(push).not.toHaveBeenCalled()
    expect(useAuthStore().isAuthenticated).toBe(false)
  })

  it('hace login demo y redirige al inicio', async () => {
    const wrapper = mount(LoginView)

    await wrapper.find('input[type="email"]').setValue('demo@entrega.com')
    await wrapper.find('input[type="password"]').setValue('1234')
    await wrapper.find('form').trigger('submit')
    await new Promise((resolve) => setTimeout(resolve, 350))
    await flushPromises()

    expect(useAuthStore().isAuthenticated).toBe(true)
    expect(push).toHaveBeenCalledWith('/')
  })
})
