import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

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
  getErrorMessage: vi.fn((error) => error?.message || 'Error'),
  isDuplicateError: vi.fn(() => false),
}))

import FacturaView from '../src/views/FacturaView.vue'
import SignaturePad from '../src/components/SignaturePad.vue'
import FacturaDetail from '../src/components/FacturaDetail.vue'
import { useAuthStore } from '../src/stores/auth'

const FIRMA = 'data:image/png;base64,YWJj'

const filas = [
  { id: 1, numero: 'FE-0001', estado: 'emitida', cliente_nombre: 'Juan Pérez', fecha_emision: '2026-11-18', total: 36750 },
  { id: 2, numero: 'FE-0002', estado: 'entregada', cliente_nombre: 'Juan Pérez', fecha_emision: '2026-11-18', total: 10000 },
  { id: 3, numero: 'FE-0003', estado: 'firmada', cliente_nombre: 'Juan Pérez', fecha_emision: '2026-11-18', total: 20000 },
  { id: 4, numero: 'FE-0004', estado: 'rechazada', cliente_nombre: 'Juan Pérez', fecha_emision: '2026-11-18', total: 30000 },
  { id: 5, numero: 'FE-0005', estado: 'recibida', cliente_nombre: 'Juan Pérez', fecha_emision: '2026-11-18', total: 40000 },
]

const mountView = async (rol = 'admin') => {
  useAuthStore().saveSession('token-123', { nombre: 'Usuario', rol })
  const wrapper = mount(FacturaView)
  await flushPromises()
  return wrapper
}

describe('Test 24 — FacturaView (listado, detalle y acciones)', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
    api.list.mockResolvedValue({ data: filas, total: filas.length, page: 1, limit: 10 })
    api.get.mockResolvedValue({ ...filas[0], detalle: [], totales: { total: 0 } })
    api.entregar.mockResolvedValue({ id: 1, estado: 'entregada' })
    api.aceptar.mockResolvedValue({ id: 2, estado: 'firmada' })
    api.rechazar.mockResolvedValue({ id: 2, estado: 'rechazada' })
    api.recibir.mockResolvedValue({ id: 3, estado: 'recibida' })
    api.remove.mockResolvedValue({ detail: 'Eliminado' })
    api.descargarPdf.mockResolvedValue('FE-0001.pdf')
  })

  it('muestra el listado con las columnas del contrato y el filtro de estados', async () => {
    const wrapper = await mountView()

    const headers = wrapper.findAll('th').map((th) => th.text())
    expect(headers).toContain('Número')
    expect(headers).toContain('Cliente')
    expect(headers).toContain('Estado')
    expect(headers).toContain('Total')
    expect(wrapper.findAll('tbody tr')).toHaveLength(5)
    expect(api.list).toHaveBeenCalledWith({ q: '', page: 1, limit: 10 })

    const opciones = wrapper.findAll('[data-test="estado-filter"] option').map((o) => o.text())
    expect(opciones).toEqual(['Todos', 'emitida', 'entregada', 'firmada', 'rechazada', 'recibida'])
  })

  it('el admin ve acciones distintas según el estado', async () => {
    const wrapper = await mountView()
    const filasDom = wrapper.findAll('tbody tr')

    const creada = filasDom[0]
    expect(creada.find('[data-test="edit"]').exists()).toBe(true)
    expect(creada.find('[data-test="delete"]').exists()).toBe(true)
    expect(creada.find('[data-test="entregar"]').exists()).toBe(true)
    expect(creada.find('[data-test="aceptar"]').exists()).toBe(false)

    const entregada = filasDom[1]
    expect(entregada.find('[data-test="edit"]').exists()).toBe(false)
    expect(entregada.find('[data-test="aceptar"]').exists()).toBe(false)

    const aceptada = filasDom[2]
    expect(aceptada.find('[data-test="recibir"]').exists()).toBe(true)
    expect(aceptada.find('[data-test="edit"]').exists()).toBe(false)

    const final = filasDom[4]
    expect(final.find('[data-test="recibir"]').exists()).toBe(false)
    expect(final.find('[data-test="pdf"]').exists()).toBe(true)
  })

  it('el cliente solo ve desde entregada y puede aceptar o rechazar', async () => {
    const wrapper = await mountView('cliente')

    expect(wrapper.find('[data-test="create"]').exists()).toBe(false)
    const opciones = wrapper.findAll('[data-test="estado-filter"] option').map((o) => o.text())
    expect(opciones).not.toContain('emitida')

    const entregada = wrapper.findAll('tbody tr')[1]
    expect(entregada.find('[data-test="aceptar"]').exists()).toBe(true)
    expect(entregada.find('[data-test="rechazar"]').exists()).toBe(true)
    expect(entregada.find('[data-test="edit"]').exists()).toBe(false)
    expect(entregada.find('[data-test="entregar"]').exists()).toBe(false)
  })

  it('el admin elimina una factura emitida solo después de confirmar', async () => {
    const wrapper = await mountView()
    const filasDom = wrapper.findAll('tbody tr')

    expect(filasDom[1].find('[data-test="delete"]').exists()).toBe(false)

    await filasDom[0].find('[data-test="delete"]').trigger('click')
    expect(wrapper.find('[data-test="confirm-delete"]').exists()).toBe(true)
    expect(api.remove).not.toHaveBeenCalled()

    await wrapper.find('[data-test="confirm"]').trigger('click')
    await flushPromises()

    expect(api.remove).toHaveBeenCalledWith(1)
    expect(wrapper.text()).toContain('Factura eliminada.')
    expect(wrapper.findAll('tbody tr')).toHaveLength(4)
  })

  it('entregar cambia el estado en la fila', async () => {
    const wrapper = await mountView()

    await wrapper.findAll('tbody tr')[0].find('[data-test="entregar"]').trigger('click')
    await flushPromises()

    expect(api.entregar).toHaveBeenCalledWith(1)
    expect(wrapper.text()).toContain('Factura entregada.')
  })

  it('aceptar valida la firma y la envía completa', async () => {
    const wrapper = await mountView('cliente')

    await wrapper.findAll('tbody tr')[1].find('[data-test="aceptar"]').trigger('click')
    expect(wrapper.find('[data-test="firma-modal"]').exists()).toBe(true)

    await wrapper.find('[data-test="firma-confirm"]').trigger('click')
    expect(wrapper.find('[data-test="firma-error"]').text()).toContain('imagen PNG')

    wrapper.findComponent(SignaturePad).vm.$emit('update:modelValue', FIRMA)
    await nextTick()
    await wrapper.find('[data-test="firma-confirm"]').trigger('click')
    await flushPromises()

    expect(api.aceptar).toHaveBeenCalledWith(2, FIRMA)
    expect(wrapper.find('[data-test="firma-modal"]').exists()).toBe(false)
  })

  it('rechazar exige motivo y lo envía recortado', async () => {
    const wrapper = await mountView('cliente')

    await wrapper.findAll('tbody tr')[1].find('[data-test="rechazar"]').trigger('click')

    await wrapper.find('[data-test="rechazo-confirm"]').trigger('click')
    expect(wrapper.find('[data-test="rechazo-error"]').text()).toBe('Escribe el motivo del rechazo.')

    await wrapper.find('[data-test="motivo"]').setValue('  Cantidad incorrecta  ')
    await wrapper.find('[data-test="rechazo-confirm"]').trigger('click')
    await flushPromises()

    expect(api.rechazar).toHaveBeenCalledWith(2, 'Cantidad incorrecta')
  })

  it('recibir y PDF llaman a los endpoints correctos', async () => {
    const wrapper = await mountView()

    await wrapper.findAll('tbody tr')[2].find('[data-test="recibir"]').trigger('click')
    await wrapper.findAll('tbody tr')[0].find('[data-test="pdf"]').trigger('click')
    await flushPromises()

    expect(api.recibir).toHaveBeenCalledWith(3)
    expect(api.descargarPdf).toHaveBeenCalledWith(1, 'FE-0001')
    expect(wrapper.text()).toContain('Descargando FE-0001.pdf.')
  })

  it('Ver carga el detalle completo', async () => {
    const wrapper = await mountView()

    await wrapper.findAll('tbody tr')[0].find('[data-test="ver"]').trigger('click')
    await flushPromises()

    expect(api.get).toHaveBeenCalledWith(1)
    expect(wrapper.find('[data-test="detail-modal"]').exists()).toBe(true)
    expect(wrapper.findComponent(FacturaDetail).exists()).toBe(true)
  })
})
