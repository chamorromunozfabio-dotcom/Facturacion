import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const tipos = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('../src/modules/catalogos/api/tipos', () => ({ default: tipos }))

import { CATALOGO_PERMISOS, claveDelNombreBackend, tienePermiso } from '../src/shared/config/permissions'
import { visibleMenuFor } from '../src/shared/config/navigation'
import router from '../src/router'
import TiposView from '../src/modules/catalogos/views/TiposView.vue'
import { useAuthStore } from '../src/modules/auth/store/auth'

describe('Test 41 — Menú, botones y rutas con los permisos reales de la sesión', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
    window.history.pushState({}, '', '/')
    tipos.list.mockResolvedValue({
      data: [{ id: 1, nombre: 'Alimentos' }],
      total: 1,
      page: 1,
      limit: 10,
    })
  })

  it('una acción aparece solo si el permiso está en la sesión', () => {
    const permisos = [{ id: 23, nombre: 'tipos_view' }]

    expect(tienePermiso(permisos, 'bodeguero', 'tipos', 'view')).toBe(true)
    expect(tienePermiso(permisos, 'bodeguero', 'tipos', 'create')).toBe(false)
    expect(tienePermiso(['tipos_create'], 'bodeguero', 'tipos', 'create')).toBe(true)
  })

  it('el admin siempre tiene acceso, salvo aceptar/rechazar facturas ajenas', () => {
    expect(tienePermiso([], 'admin', 'permisos', 'delete')).toBe(true)
    expect(tienePermiso(undefined, 'admin', 'usuarios', 'delete')).toBe(true)
    expect(tienePermiso([], 'admin', 'facturas', 'aceptar')).toBe(false)
    expect(tienePermiso([], 'admin', 'facturas', 'rechazar')).toBe(false)
  })

  it('usa la matriz del rol si la sesión es antigua o viene de los mocks', () => {
    expect(tienePermiso(undefined, 'bodeguero', 'tipos', 'create')).toBe(true)
    expect(tienePermiso([], 'cliente', 'usuarios', 'view')).toBe(false)
  })

  it('el menú se oculta cuando la sesión no tiene el permiso de ver', () => {
    const sinFacturas = [{ nombre: 'tipos_view' }]

    expect(visibleMenuFor('bodeguero', sinFacturas).map((item) => item.label)).not.toContain(
      'Facturas',
    )
    expect(
      visibleMenuFor('bodeguero', [...sinFacturas, { nombre: 'facturas_view' }]).map(
        (item) => item.label,
      ),
    ).toContain('Facturas')
  })

  it('el botón Crear de Tipos aparece solo con tipos_create', async () => {
    useAuthStore().saveSession('token-123', {
      nombre: 'Luis',
      rol: 'bodeguero',
      permisos: [{ id: 23, nombre: 'tipos_view' }],
    })

    const wrapper = mount(TiposView)
    await flushPromises()

    expect(wrapper.text()).toContain('Alimentos')
    expect(wrapper.find('[data-test="create"]').exists()).toBe(false)

    useAuthStore().saveSession('token-123', {
      nombre: 'Luis',
      rol: 'bodeguero',
      permisos: [
        { id: 23, nombre: 'tipos_view' },
        { id: 24, nombre: 'tipos_create' },
      ],
    })
    await flushPromises()

    expect(wrapper.find('[data-test="create"]').exists()).toBe(true)
  })

  it('el guard de ruta bloquea una página sin el permiso de ver', async () => {
    await router.push({ name: 'login', query: { reset: String(Math.random()) } })
    const auth = useAuthStore()

    auth.saveSession('token-123', {
      nombre: 'Luis',
      rol: 'bodeguero',
      permisos: [{ nombre: 'facturas_view' }],
    })
    await router.push('/tipos')
    expect(router.currentRoute.value.name).toBe('inicio')

    auth.saveSession('token-123', {
      nombre: 'Luis',
      rol: 'bodeguero',
      permisos: [{ nombre: 'facturas_view' }, { nombre: 'tipos_view' }],
    })
    await router.push('/tipos')
    expect(router.currentRoute.value.name).toBe('tipos')
  })

  it('el catálogo coincide con los nombres del backend y no tiene alias', () => {
    // 29 permisos originales + estadisticas_view (ya publicado por el backend).
    expect(CATALOGO_PERMISOS).toHaveLength(30)
    expect(CATALOGO_PERMISOS.map((permiso) => permiso.nombre)).toContain('usuarios_view')
    expect(CATALOGO_PERMISOS.map((permiso) => permiso.nombre)).toContain('estadisticas_view')
    expect(claveDelNombreBackend('usuarios_view')).toBe('usuarios:view')
    expect(claveDelNombreBackend('estadisticas_view')).toBe('estadisticas:view')
    expect(claveDelNombreBackend('ususarios')).toBeNull()
  })
})
