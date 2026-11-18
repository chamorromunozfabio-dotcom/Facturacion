import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import router from '../src/router'
import { useAuthStore } from '../src/stores/auth'

describe('Test 4 — guardas del router', () => {
  beforeEach(async () => {
    localStorage.clear()
    setActivePinia(createPinia())
    window.history.pushState({}, '', '/')
    // Ruta "neutra" con query distinto para evitar navegaciones duplicadas entre tests
    await router.push({ name: 'login', query: { reset: String(Math.random()) } })
  })

  it('sin token redirige a /login y guarda la ruta solicitada', async () => {
    await router.push('/tipos')

    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/tipos')
  })

  it('con token y rol admin permite entrar a /usuarios', async () => {
    const auth = useAuthStore()
    auth.saveSession('token-123', { nombre: 'Ana', rol: 'admin' })

    await router.push('/usuarios')

    expect(router.currentRoute.value.name).toBe('usuarios')
  })

  it('con rol bodeguero no permite /usuarios', async () => {
    const auth = useAuthStore()
    auth.saveSession('token-123', { nombre: 'Luis', rol: 'bodeguero' })

    await router.push('/usuarios')

    expect(router.currentRoute.value.name).toBe('inicio')
  })

  it('con rol bodeguero no permite /roles', async () => {
    const auth = useAuthStore()
    auth.saveSession('token-123', { nombre: 'Luis', rol: 'bodeguero' })

    await router.push('/roles')

    expect(router.currentRoute.value.name).toBe('inicio')
  })

  it('con rol cliente no permite /tipos', async () => {
    const auth = useAuthStore()
    auth.saveSession('token-123', { nombre: 'Carlos', rol: 'cliente' })

    await router.push('/tipos')

    expect(router.currentRoute.value.name).toBe('inicio')
  })

  it('con sesión, /login redirige al inicio', async () => {
    const auth = useAuthStore()
    auth.saveSession('token-123', { nombre: 'Ana', rol: 'admin' })

    await router.push('/login')

    expect(router.currentRoute.value.name).toBe('inicio')
  })
})
