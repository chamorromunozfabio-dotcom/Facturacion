import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const api = vi.hoisted(() => ({
  list: vi.fn(),
  get: vi.fn(),
  buscarClientes: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  entregar: vi.fn(),
  aceptar: vi.fn(),
  rechazar: vi.fn(),
  recibir: vi.fn(),
  descargarPdf: vi.fn(),
}))

vi.mock('../src/modules/facturas/api/facturas', () => ({ default: api }))
vi.mock('../src/modules/catalogos/api/bodegas', () => ({ default: { list: vi.fn().mockResolvedValue({ data: [] }) } }))
vi.mock('../src/modules/catalogos/api/tipos', () => ({ default: { list: vi.fn().mockResolvedValue({ data: [] }) } }))
vi.mock('../src/modules/empresas/api/empresas', () => ({
  default: { listActivas: vi.fn().mockResolvedValue({ data: [] }) },
}))

import FacturaView from '../src/modules/facturas/views/FacturaView.vue'
import FacturaDetail from '../src/modules/facturas/components/FacturaDetail.vue'
import StatusBadge from '../src/shared/ui/StatusBadge.vue'
import { useAuthStore } from '../src/modules/auth/store/auth'

const filas = [
  { id: 1, numero: 'FE-0001', empresa_nombre: 'Andina S.A.S.', cliente_nombre: 'Juan Pérez', estado: 'emitida', total: 10000 },
  { id: 2, numero: 'FE-0002', empresa_nombre: 'Andina S.A.S.', cliente_nombre: 'Juan Pérez', estado: 'entregada', total: 20000 },
  { id: 3, numero: 'FE-0003', empresa_nombre: 'Andina S.A.S.', cliente_nombre: 'Juan Pérez', estado: 'firmada', total: 30000 },
  { id: 4, numero: 'FE-0004', empresa_nombre: 'Andina S.A.S.', cliente_nombre: 'Juan Pérez', estado: 'rechazada', total: 40000 },
  { id: 5, numero: 'FE-0005', empresa_nombre: 'Andina S.A.S.', cliente_nombre: 'Juan Pérez', estado: 'recibida', total: 50000 },
]

describe('Test 71 — Facturas: inmutabilidad por estado y rechazo con motivo', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
    api.list.mockResolvedValue({ data: filas, total: filas.length, page: 1, limit: 10 })
    api.rechazar.mockResolvedValue({ id: 2, estado: 'rechazada' })
  })

  it('solo permite editar y eliminar cuando la factura está en estado emitida', async () => {
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })
    const wrapper = mount(FacturaView)
    await flushPromises()

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(5)

    // emitida sí tiene editar y eliminar
    expect(rows[0].find('[data-test="edit"]').exists()).toBe(true)
    expect(rows[0].find('[data-test="delete"]').exists()).toBe(true)

    // entregada, firmada, rechazada y recibida no muestran editar ni eliminar
    for (const index of [1, 2, 3, 4]) {
      expect(rows[index].find('[data-test="edit"]').exists()).toBe(false)
      expect(rows[index].find('[data-test="delete"]').exists()).toBe(false)
    }
  })

  it('el rechazo exige motivo de al menos 10 caracteres y lo envía recortado', async () => {
    useAuthStore().saveSession('token-123', { nombre: 'Juan', rol: 'cliente' })
    const wrapper = mount(FacturaView)
    await flushPromises()

    await wrapper.findAll('tbody tr')[1].find('[data-test="rechazar"]').trigger('click')
    expect(wrapper.find('[data-test="rechazo-modal"]').exists()).toBe(true)

    // Vacío o menor a 10 caracteres mantiene el botón deshabilitado
    expect(wrapper.find('[data-test="rechazo-confirm"]').attributes('disabled')).toBeDefined()
    await wrapper.find('[data-test="motivo"]').setValue('Incompleta') // 10 chars exactos? 'Incompleta' tiene 10
    await wrapper.find('[data-test="motivo"]').setValue('Muy corta') // 9 chars
    expect(wrapper.find('[data-test="rechazo-confirm"]').attributes('disabled')).toBeDefined()

    await wrapper.find('[data-test="motivo"]').setValue('  Producto llegó averiado  ')
    expect(wrapper.find('[data-test="rechazo-confirm"]').attributes('disabled')).toBeUndefined()

    await wrapper.find('[data-test="rechazo-confirm"]').trigger('click')
    await flushPromises()

    expect(api.rechazar).toHaveBeenCalledWith(2, 'Producto llegó averiado')
    expect(wrapper.find('[data-test="rechazo-modal"]').exists()).toBe(false)
  })

  it('muestra el badge rechazada, motivo_rechazo y empresa_nombre en el detalle', () => {
    const badge = mount(StatusBadge, { props: { estado: 'rechazada' } })
    expect(badge.classes()).toContain('status-badge--rechazada')
    expect(badge.text()).toBe('rechazada')

    const detail = mount(FacturaDetail, {
      props: {
        mostrarEmpresa: true,
        factura: {
          id: 4,
          numero: 'FE-0004',
          empresa_nombre: 'Distribuidora Andina S.A.S.',
          estado: 'rechazada',
          fecha_emision: '2026-11-18T10:30:00',
          forma_pago: 'contado',
          medio_pago: 'efectivo',
          moneda: 'COP',
          trazabilidad: {
            creada_por: 'Luis Gómez',
            motivo_rechazo: 'Faltaron dos cajas en la entrega',
          },
        },
      },
    })

    expect(detail.find('[data-test="detail-empresa"]').text()).toContain('Distribuidora Andina S.A.S.')
    expect(detail.find('[data-test="motivo-rechazo"]').text()).toContain('Faltaron dos cajas en la entrega')
  })
})
