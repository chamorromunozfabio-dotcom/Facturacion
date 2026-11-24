import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push }),
}))

import LoginView from '../src/modules/auth/views/LoginView.vue'
import { useAuthStore } from '../src/modules/auth/store/auth'
import { MOCK_ACCOUNTS } from '../src/shared/api/mocks'

describe('Test 30 — Cuentas demo por rol', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    push.mockClear()
  })

  it('cada cuenta demo entra con su rol y nombre', async () => {
    for (const cuenta of MOCK_ACCOUNTS) {
      localStorage.clear()
      setActivePinia(createPinia())
      const auth = useAuthStore()

      await auth.login({ correo: cuenta.correo, contrasena: cuenta.contrasena })

      expect(auth.role).toBe(cuenta.user.rol)
      expect(auth.userName).toBe(cuenta.user.nombre)
      expect(JSON.parse(localStorage.getItem('user')).rol).toBe(cuenta.user.rol)
      expect(localStorage.getItem('token')).toContain(cuenta.user.rol)
    }
  })

  it('conserva el rol al recuperar la sesión con GET /me (mocks)', async () => {
    localStorage.setItem('token', 'token-demo-cliente')
    localStorage.setItem('user', JSON.stringify(MOCK_ACCOUNTS[2].user))
    setActivePinia(createPinia())
    const auth = useAuthStore()

    await auth.fetchMe()

    expect(auth.role).toBe('cliente')
    expect(auth.userName).toBe('Juan Pérez')
  })

  it('el login muestra los atajos y llena las credenciales', async () => {
    const wrapper = mount(LoginView)
    const botones = wrapper.findAll('.demo-accounts__btn')

    expect(botones.map((boton) => boton.text())).toEqual(['Admin', 'Bodeguero', 'Cliente'])

    await botones[1].trigger('click')

    expect(wrapper.find('input[type="email"]').element.value).toBe('luis@entrega.com')
    expect(wrapper.find('input[type="password"]').element.value).toBe('Bodega123*')
  })
})
