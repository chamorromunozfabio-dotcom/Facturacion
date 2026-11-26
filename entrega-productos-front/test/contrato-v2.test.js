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
  buscarClientes: vi.fn(),
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

const empresas = vi.hoisted(() => ({ listActivas: vi.fn() }))

vi.mock('../src/modules/catalogos/api/bodegas', () => ({ default: bodegas }))
vi.mock('../src/modules/catalogos/api/usuarios', () => ({ default: usuarios }))
vi.mock('../src/modules/catalogos/api/tipos', () => ({ default: { list: vi.fn().mockResolvedValue({ data: [] }) } }))
vi.mock('../src/modules/empresas/api/empresas', () => ({ default: empresas }))
vi.mock('../src/modules/facturas/api/facturas', async () => {
  const actual = await vi.importActual('../src/modules/facturas/api/facturas')
  return { ...actual, default: facturas }
})
vi.mock('../src/shared/api/axios', () => ({
  default: {},
  getErrorMessage: vi.fn((error) => error?.message || 'Error'),
  isDuplicateError: vi.fn(() => false),
}))

import { hasPermission } from '../src/shared/config/permissions'
import { visibleMenuFor } from '../src/shared/config/navigation'
import router from '../src/router'
import BodegasView from '../src/modules/catalogos/views/BodegasView.vue'
import FacturaView from '../src/modules/facturas/views/FacturaView.vue'
import { useAuthStore } from '../src/modules/auth/store/auth'

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
    facturas.buscarClientes.mockResolvedValue({
      data: [{ id: 5, nombre: 'Cliente Prueba', tipo_documento: 'CC', numero_documento: '1020304050' }],
      total: 1,
      page: 1,
      limit: 20,
    })
    empresas.listActivas.mockResolvedValue({
      data: [{ id: 1, razon_social: 'Distribuidora Andina S.A.S.' }],
    })
    bodegas.create.mockResolvedValue({ id: 3, nombre: 'Bodega Sur', bodeguero_id: 2 })
  })

  it('el bodeguero ya no ve Bodegas ni Usuarios', () => {
    for (const action of ['view', 'create', 'edit', 'delete']) {
      expect(hasPermission('bodeguero', 'bodegas', action)).toBe(false)
    }
    expect(hasPermission('bodeguero', 'usuarios', 'view')).toBe(false)
    expect(hasPermission('admin', 'usuarios', 'delete')).toBe(true)
    expect(hasPermission('cliente', 'facturas', 'aceptar')).toBe(true)

    const menu = visibleMenuFor('bodeguero').map((item) => item.label)
    expect(menu).toContain('Tipos')
    expect(menu).toContain('Facturas')
    expect(menu).not.toContain('Bodegas')
    expect(menu).not.toContain('Usuarios')
  })

  it('la ruta /usuarios queda protegida por usuarios_view', async () => {
    expect(router.getRoutes().find((route) => route.name === 'usuarios')?.meta.permission).toBe(
      'usuarios:view',
    )

    await router.push({ name: 'login', query: { reset: String(Math.random()) } })
    useAuthStore().saveSession('token-123', { nombre: 'Luis', rol: 'bodeguero' })
    await router.push('/usuarios')

    expect(router.currentRoute.value.name).toBe('inicio')
  })

  it('el bodeguero es redirigido si intenta entrar directamente a /bodegas', async () => {
    await router.push({ name: 'login', query: { reset: String(Math.random()) } })
    useAuthStore().saveSession('token-123', { nombre: 'Luis', rol: 'bodeguero' })
    await router.push('/bodegas')

    expect(router.currentRoute.value.name).toBe('inicio')
  })

  it('el admin asigna dueño desde el listado de bodegueros', async () => {
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })

    const wrapper = mount(BodegasView)
    await flushPromises()
    await wrapper.find('[data-test="create"]').trigger('click')

    expect(usuarios.list).toHaveBeenCalledWith({ rol: 'bodeguero', page: 1, limit: 100 })
    expect(wrapper.find('[data-test="field-bodeguero_id"]').exists()).toBe(true)

    const datos = {
      empresa_id: 1,
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

    expect(bodegas.create).toHaveBeenCalledWith({
      ...datos,
      bodeguero_id: 2,
      recibe_nombre: 'Luis Gómez',
      recibe_cargo: 'Bodeguero',
    })
  })

  it('el selector de clientes de facturas usa /clientes/buscar', async () => {
    useAuthStore().saveSession('token-123', { nombre: 'Luis', rol: 'bodeguero' })

    const wrapper = mount(FacturaView)
    await flushPromises()
    await wrapper.find('[data-test="create"]').trigger('click')
    await flushPromises()

    await wrapper.find('[data-test="field-cliente_id"]').setValue('Prueba')
    await new Promise((resolve) => setTimeout(resolve, 350))
    await flushPromises()

    expect(facturas.buscarClientes).toHaveBeenCalledWith('Prueba')
    expect(usuarios.list).not.toHaveBeenCalledWith(expect.objectContaining({ rol: 'cliente' }))
  })
})
