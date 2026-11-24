import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const api = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('../src/modules/catalogos/api/tipos', () => ({ default: api }))

import DataTable from '../src/shared/ui/DataTable.vue'
import TiposView from '../src/modules/catalogos/views/TiposView.vue'
import { useAuthStore } from '../src/modules/auth/store/auth'

const columns = [{ key: 'nombre', label: 'Nombre' }]
const rows = [{ id: 1, nombre: 'Alimentos' }]

describe('Test 17 — Botones según permiso', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
    api.list.mockResolvedValue({ data: rows, total: 1, page: 1, limit: 10 })
  })

  it('DataTable oculta Crear/Editar/Eliminar sin permiso', () => {
    const wrapper = mount(DataTable, {
      props: { columns, rows, canCreate: false, canEdit: false, canDelete: false },
    })

    expect(wrapper.find('[data-test="create"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="edit"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="delete"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Alimentos')
  })

  it('DataTable muestra los botones por defecto', () => {
    const wrapper = mount(DataTable, { props: { columns, rows } })

    expect(wrapper.find('[data-test="create"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="edit"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="delete"]').exists()).toBe(true)
  })

  it('el bodeguero gestiona sus productos en Tipos', async () => {
    useAuthStore().saveSession('token-123', { nombre: 'Luis', rol: 'bodeguero' })

    const wrapper = mount(TiposView)
    await flushPromises()

    expect(wrapper.text()).toContain('Alimentos')
    expect(wrapper.find('[data-test="create"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="edit"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="delete"]').exists()).toBe(true)
  })

  it('el admin sí ve los botones en Tipos', async () => {
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })

    const wrapper = mount(TiposView)
    await flushPromises()

    expect(wrapper.find('[data-test="create"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="edit"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="delete"]').exists()).toBe(true)
  })
})
