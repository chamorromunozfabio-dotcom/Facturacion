import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const tipos = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))

const facturas = vi.hoisted(() => ({
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  entregar: vi.fn(),
  aceptar: vi.fn(),
  rechazar: vi.fn(),
  recibir: vi.fn(),
  descargarPdf: vi.fn(),
}))

vi.mock('../src/modules/catalogos/api/tipos', () => ({ default: tipos }))
vi.mock('../src/modules/facturas/api/facturas', async () => {
  const actual = await vi.importActual('../src/modules/facturas/api/facturas')
  return { ...actual, default: facturas }
})
vi.mock('../src/modules/catalogos/api/usuarios', () => ({ default: { list: vi.fn().mockResolvedValue({ data: [] }) } }))
vi.mock('../src/modules/catalogos/api/bodegas', () => ({ default: { list: vi.fn().mockResolvedValue({ data: [] }) } }))
vi.mock('../src/shared/api/axios', () => ({
  default: {},
  getErrorMessage: vi.fn((error) => error?.message || 'Error'),
  isDuplicateError: vi.fn(() => false),
}))

import { hasPermission } from '../src/shared/config/permissions'
import TiposView from '../src/modules/catalogos/views/TiposView.vue'
import FacturaView from '../src/modules/facturas/views/FacturaView.vue'
import { useAuthStore } from '../src/modules/auth/store/auth'

describe('Test 34 — Permisos reales del bodeguero', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
    tipos.list.mockResolvedValue({ data: [{ id: 1, nombre: 'pap' }], total: 1, page: 1, limit: 10 })
    facturas.list.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 })
  })

  it('el bodeguero gestiona Tipos y sus Bodegas, pero no Usuarios', () => {
    for (const action of ['view', 'create', 'edit', 'delete']) {
      expect(hasPermission('bodeguero', 'tipos', action)).toBe(true)
      expect(hasPermission('bodeguero', 'bodegas', action)).toBe(true)
    }
    expect(hasPermission('bodeguero', 'usuarios', 'view')).toBe(false)
    expect(hasPermission('bodeguero', 'usuarios', 'create')).toBe(false)
    expect(hasPermission('bodeguero', 'roles', 'view')).toBe(false)
    expect(hasPermission('bodeguero', 'permisos', 'view')).toBe(false)
  })

  it('el bodeguero ve Crear, Editar y Eliminar en el listado de Tipos', async () => {
    useAuthStore().saveSession('token-123', { nombre: 'Luis', rol: 'bodeguero' })

    const wrapper = mount(TiposView)
    await flushPromises()

    expect(wrapper.text()).toContain('pap')
    expect(wrapper.find('[data-test="create"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="edit"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="delete"]').exists()).toBe(true)
  })

  it('el bodeguero pide solo las facturas de su bodega', async () => {
    useAuthStore().saveSession('token-123', {
      nombre: 'Luis',
      rol: 'bodeguero',
      bodega_id: 5,
    })

    mount(FacturaView)
    await flushPromises()

    expect(facturas.list).toHaveBeenCalledWith(
      expect.objectContaining({ bodega_id: 5, q: '', page: 1, limit: 10 }),
    )
  })

  it('ni el admin ni el cliente envían bodega_id en el listado', async () => {
    for (const rol of ['admin', 'cliente']) {
      vi.clearAllMocks()
      facturas.list.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 })
      localStorage.clear()
      setActivePinia(createPinia())
      useAuthStore().saveSession('token-123', { nombre: 'Ana', rol, bodega_id: 5 })

      mount(FacturaView)
      await flushPromises()

      const params = facturas.list.mock.calls[0][0]
      expect(params).not.toHaveProperty('bodega_id')
    }
  })
})
