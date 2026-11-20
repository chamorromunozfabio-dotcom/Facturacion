import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push }),
}))

import LoginView from '../src/views/LoginView.vue'
import { avisoSesionVencida, marcarSesionVencida } from '../src/config/sessionNotice'

describe('Test 49 — Aviso de sesión vencida en el login', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    push.mockClear()
    avisoSesionVencida.value = false
  })

  it('muestra el aviso pendiente y limpia el guardado al entrar', async () => {
    marcarSesionVencida()
    expect(localStorage.getItem('sesion_vencida')).toBe('1')

    const wrapper = mount(LoginView)

    expect(wrapper.find('[data-test="sesion-vencida"]').text()).toContain('sesión venció')
    expect(localStorage.getItem('sesion_vencida')).toBeNull()

    await wrapper.find('.aviso-sesion__cerrar').trigger('click')

    expect(wrapper.find('[data-test="sesion-vencida"]').exists()).toBe(false)
  })

  it('aparece si el token vence cuando el login ya estaba abierto', async () => {
    const wrapper = mount(LoginView)

    expect(wrapper.find('[data-test="sesion-vencida"]').exists()).toBe(false)

    marcarSesionVencida()
    await nextTick()

    expect(wrapper.find('[data-test="sesion-vencida"]').exists()).toBe(true)
  })

  it('no aparece en un ingreso normal', () => {
    const wrapper = mount(LoginView)

    expect(wrapper.find('[data-test="sesion-vencida"]').exists()).toBe(false)
  })
})
