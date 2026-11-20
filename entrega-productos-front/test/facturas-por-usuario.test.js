import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const api = vi.hoisted(() => ({
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

vi.mock('../src/api/facturas', async () => {
  const actual = await vi.importActual('../src/api/facturas')
  return { ...actual, default: api }
})
vi.mock('../src/api/usuarios', () => ({ default: { list: vi.fn().mockResolvedValue({ data: [] }) } }))
vi.mock('../src/api/bodegas', () => ({ default: { list: vi.fn().mockResolvedValue({ data: [] }) } }))
vi.mock('../src/api/tipos', () => ({ default: { list: vi.fn().mockResolvedValue({ data: [] }) } }))
vi.mock('../src/api/axios', () => ({
  default: {},
  getErrorMessage: vi.fn(
    (error) => error?.response?.data?.detail || error?.message || 'Error',
  ),
  isDuplicateError: vi.fn(() => false),
}))

import FacturaView from '../src/views/FacturaView.vue'
import { useAuthStore } from '../src/stores/auth'

const PERMISOS = [{ nombre: 'facturas_view' }, { nombre: 'facturas_create' }]

// Escenario real verificado contra el servidor (19-11-2026).
const filasReales = [
  { id: 21, numero: 'FE-0009', estado: 'recibida', cliente_id: 5, cliente_nombre: 'Cliente Prueba', creado_por_id: 1, creado_por_nombre: 'Administrador', total: 1190 },
  { id: 20, numero: 'FE-0008', estado: 'recibida', cliente_id: 5, cliente_nombre: 'Cliente Prueba', creado_por_id: 20, creado_por_nombre: 'Fabio', total: 1190 },
  { id: 19, numero: 'FE-0007', estado: 'recibida', cliente_id: 5, cliente_nombre: 'Cliente Prueba', creado_por_id: 2, creado_por_nombre: 'Bodeguero Prueba', total: 1190 },
  { id: 15, numero: 'FE-0006', estado: 'recibida', cliente_id: 5, cliente_nombre: 'Cliente Prueba', creado_por_id: 2, creado_por_nombre: 'Bodeguero Prueba', total: 1190 },
  { id: 5, numero: 'FE-0001', estado: 'recibida', cliente_id: 5, cliente_nombre: 'Cliente Prueba', creado_por_id: 2, creado_por_nombre: 'Bodeguero Prueba', total: 1190 },
]

async function montarComo(rol, idUsuario, datos = filasReales) {
  useAuthStore().saveSession('token-123', {
    id: idUsuario,
    nombre: 'Usuario de prueba',
    rol,
    permisos: PERMISOS,
  })
  api.list.mockResolvedValue({ data: datos, total: datos.length, page: 1, limit: 10 })
  const wrapper = mount(FacturaView)
  await flushPromises()
  return wrapper
}

describe('Test 46 — Facturas propias por usuario', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('el admin ve las 5 facturas, con cualquier creador', async () => {
    const wrapper = await montarComo('admin', 1)

    expect(wrapper.findAll('tbody tr')).toHaveLength(5)
    expect(wrapper.find('[data-test="aviso-alcance"]').exists()).toBe(false)
    expect(wrapper.find('.facturas-page__header p').text()).toBe(
      'Supervisa todas las facturas y el ciclo completo de entrega.',
    )
    expect(api.list).toHaveBeenCalledWith({ q: '', page: 1, limit: 10 })
  })

  it('Bodeguero Prueba ve solo las 3 que creó', async () => {
    const wrapper = await montarComo('bodeguero', 2)

    expect(wrapper.findAll('tbody tr')).toHaveLength(3)
    expect(wrapper.text()).toContain('FE-0001')
    expect(wrapper.text()).toContain('FE-0006')
    expect(wrapper.text()).toContain('FE-0007')
    expect(wrapper.text()).not.toContain('FE-0008')
    expect(wrapper.text()).not.toContain('FE-0009')
    expect(wrapper.find('[data-test="aviso-alcance"]').exists()).toBe(false)
    expect(wrapper.find('.facturas-page__header p').text()).toBe(
      'Consulta el estado de tus facturas y gestiona la entrega.',
    )
  })

  it('otro usuario con creador propio ve solo su factura', async () => {
    const wrapper = await montarComo('bodeguero', 20)

    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(wrapper.text()).toContain('FE-0008')
  })

  it('el cliente ve las 5 que son para él, aunque las crearon otros', async () => {
    const wrapper = await montarComo('cliente', 5)

    expect(wrapper.findAll('tbody tr')).toHaveLength(5)
    expect(wrapper.find('[data-test="aviso-alcance"]').exists()).toBe(false)
  })

  it('compatibilidad: si el backend aún no envía creado_por_id, se muestra lo que devuelve', async () => {
    const sinCreador = filasReales.map(({ creado_por_id, creado_por_nombre, ...fila }) => fila)
    const wrapper = await montarComo('bodeguero', 2, sinCreador)

    expect(wrapper.findAll('tbody tr')).toHaveLength(5)
  })

  it('una factura ajena que responde 404 no deja el detalle abierto', async () => {
    const wrapper = await montarComo('bodeguero', 2)
    api.get.mockRejectedValue({ response: { data: { detail: 'Factura no encontrada' } } })

    await wrapper.findAll('tbody tr')[0].find('[data-test="ver"]').trigger('click')
    await flushPromises()

    expect(api.get).toHaveBeenCalledWith(19)
    expect(wrapper.find('[data-test="detail-modal"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Factura no encontrada')
  })
})
