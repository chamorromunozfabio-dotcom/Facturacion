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
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

import FormModal from '../src/shared/ui/FormModal.vue'
import ConfirmDelete from '../src/shared/ui/ConfirmDelete.vue'
import FacturaForm from '../src/modules/facturas/components/FacturaForm.vue'
import FacturaView from '../src/modules/facturas/views/FacturaView.vue'
import TiposView from '../src/modules/catalogos/views/TiposView.vue'
import { useAuthStore } from '../src/modules/auth/store/auth'

const nombresTransicion = (wrapper) =>
  wrapper.findAllComponents({ name: 'Transition' }).map((transition) => transition.props('name'))

describe('Test 28 — Transiciones en modales y alertas', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })
  })

  it('los modales reutilizables usan la transición modal', () => {
    const formModal = mount(FormModal, { props: { open: true, title: 'Nuevo tipo' } })
    const confirm = mount(ConfirmDelete, { props: { open: true } })
    const facturaForm = mount(FacturaForm, {
      props: { open: true, clientes: [], bodegas: [], tipos: [] },
    })

    for (const wrapper of [formModal, confirm, facturaForm]) {
      expect(nombresTransicion(wrapper)).toContain('modal')
    }

    expect(formModal.find('[data-test="modal"]').exists()).toBe(true)
    expect(confirm.find('[data-test="confirm-delete"]').exists()).toBe(true)
    expect(facturaForm.find('[data-test="factura-form"]').exists()).toBe(true)
  })

  it('FacturaView envuelve la alerta y sus tres modales propios', async () => {
    facturas.list.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 })

    const wrapper = mount(FacturaView)
    await flushPromises()

    const nombres = nombresTransicion(wrapper)
    expect(nombres).toContain('alert')
    expect(nombres.filter((nombre) => nombre === 'modal').length).toBeGreaterThanOrEqual(5)
  })

  it('TiposView muestra la alerta de error dentro de una transición', async () => {
    tipos.list.mockRejectedValue(new Error('Fallo de red'))

    const wrapper = mount(TiposView)
    await flushPromises()

    expect(nombresTransicion(wrapper)).toContain('alert')
    expect(wrapper.find('[role="alert"]').text()).toContain('Fallo de red')
  })
})
