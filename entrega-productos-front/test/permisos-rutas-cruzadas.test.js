import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { visibleMenuFor } from '../src/config/navigation'
import router from '../src/router'
import { useAuthStore } from '../src/stores/auth'

describe('Test 43 — El acceso a rutas sigue al permiso, no al rol fijo', () => {
  beforeEach(async () => {
    localStorage.clear()
    setActivePinia(createPinia())
    window.history.pushState({}, '', '/')
    await router.push({ name: 'login', query: { reset: String(Math.random()) } })
  })

  it('un cliente con tipos_view puede entrar a /tipos', async () => {
    useAuthStore().saveSession('token-123', {
      nombre: 'Cliente Prueba',
      rol: 'cliente',
      permisos: [{ id: 23, nombre: 'tipos_view' }],
    })

    await router.push('/tipos')

    expect(router.currentRoute.value.name).toBe('tipos')
  })

  it('el menú y la ruta coinciden para un cliente con permiso de otro módulo', async () => {
    const permisos = [{ id: 23, nombre: 'tipos_view' }]
    expect(visibleMenuFor('cliente', permisos).map((item) => item.label)).toContain('Tipos')

    useAuthStore().saveSession('token-123', { nombre: 'Cliente', rol: 'cliente', permisos })
    await router.push('/tipos')

    expect(router.currentRoute.value.name).toBe('tipos')
  })

  it('un cliente sin tipos_view sigue sin poder entrar', async () => {
    useAuthStore().saveSession('token-123', {
      nombre: 'Cliente',
      rol: 'cliente',
      permisos: [{ id: 7, nombre: 'facturas_view' }],
    })

    await router.push('/tipos')

    expect(router.currentRoute.value.name).toBe('inicio')
  })

  it('un bodeguero con usuarios_view puede entrar a /usuarios', async () => {
    useAuthStore().saveSession('token-123', {
      nombre: 'Bodeguero',
      rol: 'bodeguero',
      permisos: [{ nombre: 'usuarios_view' }],
    })

    await router.push('/usuarios')

    expect(router.currentRoute.value.name).toBe('usuarios')
  })

  it('un rol nuevo del backend entra si recibió el permiso de ver', async () => {
    useAuthStore().saveSession('token-123', {
      nombre: 'Auditor',
      rol: 'auditor',
      permisos: [{ nombre: 'bodegas_view' }],
    })

    await router.push('/bodegas')

    expect(router.currentRoute.value.name).toBe('bodegas')
  })

  it('sin permisos, la matriz del rol sigue protegiendo las rutas', async () => {
    useAuthStore().saveSession('token-123', { nombre: 'Cliente', rol: 'cliente' })

    await router.push('/roles')

    expect(router.currentRoute.value.name).toBe('inicio')
  })
})
