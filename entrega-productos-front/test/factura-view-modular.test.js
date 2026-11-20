import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'

const api = vi.hoisted(() => ({
  list: vi.fn(),
  get: vi.fn(),
  listClientes: vi.fn(),
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
vi.mock('../src/api/bodegas', () => ({ default: { list: vi.fn().mockResolvedValue({ data: [] }) } }))
vi.mock('../src/api/tipos', () => ({ default: { list: vi.fn().mockResolvedValue({ data: [] }) } }))
vi.mock('../src/api/axios', () => ({
  default: {},
  getErrorMessage: vi.fn((error) => error?.message || 'Error'),
  getFieldErrors: vi.fn(() => ({})),
  isDuplicateError: vi.fn(() => false),
}))

import FacturaView from '../src/views/FacturaView.vue'
import SignaturePad from '../src/components/SignaturePad.vue'
import { useAuthStore } from '../src/stores/auth'
import {
  COLUMNAS,
  aFormModel,
  creadorDe,
  estadosPara,
  mensajeCreacion,
} from '../src/utils/facturas'

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8')
const FIRMA = 'data:image/png;base64,YWJj'

const filas = [
  { id: 1, numero: 'FE-0001', estado: 'emitida', cliente_nombre: 'Juan Pérez', total: 100 },
  { id: 2, numero: 'FE-0002', estado: 'entregada', cliente_nombre: 'Juan Pérez', total: 200 },
  { id: 3, numero: 'FE-0003', estado: 'entregada', cliente_nombre: 'Ana López', total: 300 },
  { id: 4, numero: 'FE-0004', estado: 'firmada', cliente_nombre: 'Luis Ruiz', total: 400 },
]

const mountView = async (rol = 'admin') => {
  useAuthStore().saveSession('token-123', { nombre: 'Ana', rol })
  const wrapper = mount(FacturaView)
  await flushPromises()
  return wrapper
}

describe('Test 54 — FacturaView modular: lógica, modales y mapa', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
    api.list.mockResolvedValue({ data: filas, total: filas.length, page: 1, limit: 10 })
    api.get.mockResolvedValue({ ...filas[0], detalle: [], totales: { total: 0 } })
    api.listClientes.mockResolvedValue({ data: [] })
    api.aceptar.mockResolvedValue({ id: 2, estado: 'firmada' })
    api.rechazar.mockResolvedValue({ id: 3, estado: 'rechazada' })
  })

  it('la vista delega y conserva la alerta flotante y su responsive', () => {
    const vista = leer('../src/views/FacturaView.vue')

    expect(vista).toContain('useFacturas')
    for (const pieza of [
      'FacturaFiltros',
      'FacturaDetailModal',
      'FacturaFirmaModal',
      'FacturaRechazoModal',
    ]) {
      expect(vista).toContain(pieza)
    }
    expect(vista).not.toContain('async function confirmarAceptar')
    expect(vista).not.toContain('aviso-alcance')
    expect(vista).toContain('alert-flotante')
    expect(vista).toContain('z-index: 100')
    expect(vista).toContain('@media (max-width: 768px)')
    expect(vista.split('\n').length).toBeLessThan(320)
  })

  it('el composable concentra carga, acciones y formularios', () => {
    const codigo = leer('../src/composables/useFacturas.js')

    for (const nombre of [
      'async function load',
      'async function openDetail',
      'async function confirmarAceptar',
      'async function confirmarRechazo',
      'async function descargar',
      'async function save',
      'async function confirmDelete',
    ]) {
      expect(codigo).toContain(nombre)
    }
  })

  it('las reglas puras viven en utils', () => {
    expect(COLUMNAS.map((columna) => columna.key)).toContain('numero')
    expect(estadosPara(true)).not.toContain('emitida')
    expect(estadosPara(false)).toContain('emitida')
    expect(leer('../src/utils/facturas.js')).not.toContain('textoAlcancePara')
    expect(creadorDe({ creado_por_id: '7' })).toBe(7)
    expect(creadorDe({})).toBeNull()
    expect(mensajeCreacion({ numero: 'FE-0009' })).toContain('FE-0009')

    const modelo = aFormModel({
      cliente_id: 3,
      bodega: { id: 1 },
      forma_pago: 'crédito',
      detalle: [{ tipo_id: 5, descripcion: 'Arroz' }],
    })
    expect(modelo.forma_pago).toBe('credito')
    expect(modelo.detalle[0].tipo_id).toBe(5)
    expect(modelo.detalle[0].unidad_medida).toBe('')
  })

  it('los modales y el filtro tienen contrato propio y el mapa está documentado', () => {
    const firma = leer('../src/components/facturas/FacturaFirmaModal.vue')
    const rechazo = leer('../src/components/facturas/FacturaRechazoModal.vue')
    const detalle = leer('../src/components/facturas/FacturaDetailModal.vue')
    const filtro = leer('../src/components/facturas/FacturaFiltros.vue')

    for (const dato of ['firma-modal', 'firma-error', 'firma-confirm']) {
      expect(firma).toContain(`data-test="${dato}"`)
    }
    for (const dato of ['rechazo-modal', 'motivo', 'rechazo-error', 'rechazo-confirm']) {
      expect(rechazo).toContain(`data-test="${dato}"`)
    }
    for (const dato of ['detail-modal', 'detail-close']) {
      expect(detalle).toContain(`data-test="${dato}"`)
    }
    expect(filtro).toContain('data-test="estado-filter"')
    expect(firma).toContain('useModalA11y')
    expect(rechazo).toContain('useModalA11y')
    expect(detalle).toContain('useModalA11y')

    const mapa = leer('../src/ARQUITECTURA.md')
    expect(mapa).toContain('views/')
    expect(mapa).toContain('components/<modulo>/')
    expect(mapa).toContain('composables/')
  })

  it('los modales conectados siguen abriendo, validando y cerrando', async () => {
    let wrapper = await mountView()

    await wrapper.findAll('tbody tr')[0].find('[data-test="ver"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-test="detail-modal"]').exists()).toBe(true)
    await wrapper.find('[data-test="detail-close"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-test="detail-modal"]').exists()).toBe(false)

    // Aceptar y rechazar facturas ajenas está prohibido para el admin.
    wrapper = await mountView('cliente')
    await wrapper.findAll('tbody tr')[1].find('[data-test="aceptar"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-test="firma-modal"]').exists()).toBe(true)
    wrapper.findComponent(SignaturePad).vm.$emit('update:modelValue', FIRMA)
    await flushPromises()
    await wrapper.find('[data-test="firma-confirm"]').trigger('click')
    await flushPromises()
    expect(api.aceptar).toHaveBeenCalledWith(2, FIRMA)
    expect(wrapper.find('[data-test="firma-modal"]').exists()).toBe(false)

    await wrapper.findAll('tbody tr')[2].find('[data-test="rechazar"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-test="rechazo-modal"]').exists()).toBe(true)
    await wrapper.find('[data-test="motivo"]').setValue('Cantidad incorrecta')
    await wrapper.find('[data-test="rechazo-confirm"]').trigger('click')
    await flushPromises()
    expect(api.rechazar).toHaveBeenCalledWith(3, 'Cantidad incorrecta')
    expect(wrapper.find('[data-test="rechazo-modal"]').exists()).toBe(false)
  })
})
