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
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

import DataTable from '../src/shared/ui/DataTable.vue'
import MainLayout from '../src/modules/layout/layouts/MainLayout.vue'
import FacturaView from '../src/modules/facturas/views/FacturaView.vue'
import { useAuthStore } from '../src/modules/auth/store/auth'

const RouterLinkStub = {
  props: ['to'],
  setup(props, { slots }) {
    return () => h('a', { href: props.to }, slots.default?.())
  },
}

const RouterViewStub = {
  setup(_, { slots }) {
    return () => h('div', slots.default?.({ Component: h('p', 'Contenido de prueba') }))
  },
}

const layoutOptions = {
  components: { RouterLink: RouterLinkStub, RouterView: RouterViewStub },
}

const filas = [
  { id: 1, numero: 'FE-0001', estado: 'emitida', cliente_nombre: 'Juan Pérez', total: 100 },
  { id: 2, numero: 'FE-0002', estado: 'entregada', cliente_nombre: 'Juan Pérez', total: 200 },
]

const login = (role) => useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: role })

const mountFacturas = async (role) => {
  login(role)
  const wrapper = mount(FacturaView)
  await flushPromises()
  return wrapper
}

describe('Test 26 — Iconos en acciones y color por rol', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
    api.list.mockResolvedValue({ data: filas, total: filas.length, page: 1, limit: 10 })
  })

  it('DataTable muestra iconos SVG y sigue emitiendo los mismos eventos', async () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: [{ key: 'nombre', label: 'Nombre' }],
        rows: [{ id: 1, nombre: 'Alimentos' }],
        total: 1,
      },
    })

    for (const test of ['create', 'edit', 'delete', 'prev', 'next']) {
      expect(wrapper.find(`[data-test="${test}"] svg`).exists()).toBe(true)
    }

    await wrapper.find('[data-test="create"]').trigger('click')
    await wrapper.find('[data-test="edit"]').trigger('click')
    await wrapper.find('[data-test="delete"]').trigger('click')

    expect(wrapper.emitted('create')).toHaveLength(1)
    expect(wrapper.emitted('edit')[0][0]).toMatchObject({ id: 1 })
    expect(wrapper.emitted('delete')[0][0]).toMatchObject({ id: 1 })
  })

  it('el layout marca el rol para aplicar su color de acento', () => {
    for (const role of ['admin', 'bodeguero', 'cliente']) {
      login(role)
      const wrapper = mount(MainLayout, { global: layoutOptions })

      expect(wrapper.find('.layout').attributes('data-role')).toBe(role)
    }
  })

  it('las acciones de factura llevan iconos según el permiso del rol', async () => {
    const admin = await mountFacturas('admin')
    const emitida = admin.findAll('tbody tr')[0]

    for (const test of ['ver', 'edit', 'delete', 'entregar', 'pdf']) {
      expect(emitida.find(`[data-test="${test}"] svg`).exists()).toBe(true)
    }

    const cliente = await mountFacturas('cliente')
    const entregada = cliente.findAll('tbody tr')[1]

    expect(entregada.find('[data-test="aceptar"] svg').exists()).toBe(true)
    expect(entregada.find('[data-test="rechazar"] svg').exists()).toBe(true)
    expect(entregada.find('[data-test="entregar"]').exists()).toBe(false)
  })
})
