import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { h } from 'vue'

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

vi.mock('../src/modules/facturas/api/facturas', async () => {
  const actual = await vi.importActual('../src/modules/facturas/api/facturas')
  return { ...actual, default: api }
})
vi.mock('../src/modules/catalogos/api/usuarios', () => ({ default: { list: vi.fn().mockResolvedValue({ data: [] }) } }))
vi.mock('../src/modules/catalogos/api/bodegas', () => ({ default: { list: vi.fn().mockResolvedValue({ data: [] }) } }))
vi.mock('../src/modules/catalogos/api/tipos', () => ({ default: { list: vi.fn().mockResolvedValue({ data: [] }) } }))
vi.mock('../src/shared/api/axios', () => ({
  default: {},
  getErrorMessage: vi.fn((error) => error?.message || 'Error'),
  isDuplicateError: vi.fn(() => false),
}))

import StatusBadge from '../src/shared/ui/StatusBadge.vue'
import DataTable from '../src/shared/ui/DataTable.vue'
import FacturaDetail from '../src/modules/facturas/components/FacturaDetail.vue'
import FacturaView from '../src/modules/facturas/views/FacturaView.vue'
import { useAuthStore } from '../src/modules/auth/store/auth'

const ESTADOS = ['emitida', 'entregada', 'firmada', 'rechazada', 'recibida']

describe('Test 27 — Badge de estado con color', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('StatusBadge pinta los cinco estados del contrato', () => {
    for (const estado of ESTADOS) {
      const wrapper = mount(StatusBadge, {
        props: { estado },
        attrs: { 'data-test': `status-${estado}` },
      })
      const badge = wrapper.find(`[data-test="status-${estado}"]`)

      expect(badge.classes()).toContain('status-badge')
      expect(badge.classes()).toContain(`status-badge--${estado}`)
      expect(badge.text()).toBe(estado)
    }
  })

  it('DataTable permite personalizar una celda con el slot cell-estado', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: [{ key: 'estado', label: 'Estado' }],
        rows: [{ id: 1, estado: 'entregada' }],
        total: 1,
      },
      slots: {
        'cell-estado': ({ value }) => h(StatusBadge, { estado: value, 'data-test': `status-${value}` }),
      },
    })

    expect(wrapper.find('[data-test="status-entregada"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('entregada')
  })

  it('el listado de facturas usa el badge en cada fila', async () => {
    api.list.mockResolvedValue({
      data: ESTADOS.map((estado, index) => ({ id: index + 1, estado, numero: `FE-${index + 1}` })),
      total: ESTADOS.length,
      page: 1,
      limit: 10,
    })
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })

    const wrapper = mount(FacturaView)
    await flushPromises()

    for (const estado of ESTADOS) {
      const badge = wrapper.find(`tbody .status-badge--${estado}`)
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe(estado)
    }
  })

  it('el detalle mantiene su data-test y usa el mismo badge', () => {
    const factura = {
      numero: 'FE-0001',
      estado: 'rechazada',
      fecha_emision: '2026-11-18',
      emisor: {},
      adquiriente: {},
      bodega: {},
      totales: {},
      detalle: [],
      trazabilidad: {},
      validacion_electronica: {},
      software: {},
    }

    const wrapper = mount(FacturaDetail, { props: { factura } })
    const badge = wrapper.find('[data-test="detail-estado"]')

    expect(badge.classes()).toContain('status-badge--rechazada')
    expect(badge.text()).toBe('rechazada')
  })
})
