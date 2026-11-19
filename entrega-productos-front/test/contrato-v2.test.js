import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const bodegas = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))

const usuarios = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))

const facturas = vi.hoisted(() => ({
  list: vi.fn(),
  listClientes: vi.fn(),
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

vi.mock('../src/api/bodegas', () => ({ default: bodegas }))
vi.mock('../src/api/usuarios', () => ({ default: usuarios }))
vi.mock('../src/api/tipos', () => ({ default: { list: vi.fn().mockResolvedValue({ data: [] }) } }))
vi.mock('../src/api/facturas', async () => {
  const actual = await vi.importActual('../src/api/facturas')
  return { ...actual, default: facturas }
})
vi.mock('../src/api/axios', () => ({
  default: {},
  getErrorMessage: vi.fn((error) => error?.message || 'Error'),
  isDuplicateError: vi.fn(() => false),
}))

import { hasPermission } from '../src/config/permissions'
import { visibleMenuFor } from '../src/config/navigation'
import router from '../src/router'
import BodegasView from '../src/views/BodegasView.vue'
import FacturaView from '../src/views/FacturaView.vue'
import { useAuthStore } from '../src/stores/auth'

describe('Test 35 — Contrato v2: bodegas propias y sin Usuarios', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
    bodegas.list.mockResolvedValue({
      data: [{ id: 3, nombre: 'Bodega Sur', bodeguero_id: 2, ciudad: 'Bogotá' }],
      total: 1,
      page: 1,
      limit: 10,
    })
    usuarios.list.mockResolvedValue({
      data: [{ id: 2, nombre: 'Luis Gómez', rol: 'bodeguero' }],
      total: 1,
      page: 1,
      limit: 100,
    })
    facturas.list.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 })
    facturas.listClientes.mockResolvedValue({
      data: [{ id: 5, nombre: 'Cliente Prueba', tipo_documento: 'CC', numero_documento: '1020304050' }],
      total: 1,
      page: 1,
      limit: 100,
    })
    bodegas.create.mockResolvedValue({ id: 3, nombre: 'Bodega Sur', bodeguero_id: 2 })
  })

  it('el bodeguero gestiona bodegas pero ya no ve Usuarios', () => {
    for (const action of ['view', 'create', 'edit', 'delete']) {
      expect(hasPermission('bodeguero', 'bodegas', action)).toBe(true)
    }
    expect(hasPermission('bodeguero', 'usuarios', 'view')).toBe(false)
    expect(hasPermission('admin', 'usuarios', 'delete')).toBe(true)
    expect(hasPermission('cliente', 'facturas', 'aceptar')).toBe(true)

    const menu = visibleMenuFor('bodeguero').map((item) => item.label)
    expect(menu).toContain('Bodegas')
    expect(menu).not.toContain('Usuarios')
  })

  it('la ruta /usuarios queda restringida al admin', () => {
    expect(router.getRoutes().find((route) => route.name === 'usuarios')?.meta.roles).toEqual([
      'admin',
    ])
  })

  it('el bodeguero crea bodegas sin elegir dueño (lo asigna el backend)', async () => {
    useAuthStore().saveSession('token-123', { nombre: 'Luis', rol: 'bodeguero' })

    const wrapper = mount(BodegasView)
    await flushPromises()
    await wrapper.find('[data-test="create"]').trigger('click')

    expect(wrapper.find('[data-test="edit"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="delete"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="field-bodeguero_id"]').exists()).toBe(false)
    expect(usuarios.list).not.toHaveBeenCalled()

    const datos = {
      nombre: 'Bodega Sur',
      codigo: 'SUR-01',
      direccion: 'Calle 1 2 3',
      ciudad: 'Bogotá',
      departamento: 'Cundinamarca',
      telefono: '3001234567',
      correo: 'sur@entrega.com',
      recibe_nombre: 'Ana Recibe',
      recibe_documento: '1020304052',
      recibe_cargo: 'Supervisora',
      recibe_telefono: '3109876545',
    }
    for (const [key, value] of Object.entries(datos)) {
      await wrapper.find(`[data-test="field-${key}"]`).setValue(value)
    }
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(bodegas.create).toHaveBeenCalledWith(datos)
  })

  it('el admin asigna dueño desde el listado de bodegueros', async () => {
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })

    const wrapper = mount(BodegasView)
    await flushPromises()
    await wrapper.find('[data-test="create"]').trigger('click')

    expect(usuarios.list).toHaveBeenCalledWith({ rol: 'bodeguero', page: 1, limit: 100 })
    expect(wrapper.find('[data-test="field-bodeguero_id"]').exists()).toBe(true)

    const datos = {
      nombre: 'Bodega Sur',
      codigo: 'SUR-01',
      direccion: 'Calle 1 2 3',
      ciudad: 'Bogotá',
      departamento: 'Cundinamarca',
      telefono: '3001234567',
      correo: 'sur@entrega.com',
      recibe_nombre: 'Ana Recibe',
      recibe_documento: '1020304052',
      recibe_cargo: 'Supervisora',
      recibe_telefono: '3109876545',
    }
    for (const [key, value] of Object.entries(datos)) {
      await wrapper.find(`[data-test="field-${key}"]`).setValue(value)
    }
    await wrapper.find('[data-test="field-bodeguero_id"]').setValue('2')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(bodegas.create).toHaveBeenCalledWith({ ...datos, bodeguero_id: 2 })
  })

  it('el selector de clientes de facturas usa /facturas/clientes', async () => {
    useAuthStore().saveSession('token-123', { nombre: 'Luis', rol: 'bodeguero' })

    const wrapper = mount(FacturaView)
    await flushPromises()
    await wrapper.find('[data-test="create"]').trigger('click')
    await flushPromises()

    expect(facturas.listClientes).toHaveBeenCalledWith({ page: 1, limit: 100 })
    expect(usuarios.list).not.toHaveBeenCalledWith(expect.objectContaining({ rol: 'cliente' }))
  })
})
