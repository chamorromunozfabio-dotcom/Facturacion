import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const api = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))
const bodegasApi = vi.hoisted(() => ({ list: vi.fn() }))

vi.mock('../src/api/tipos', () => ({ default: api }))
vi.mock('../src/api/bodegas', () => ({ default: bodegasApi }))

import TiposView from '../src/views/TiposView.vue'
import { useAuthStore } from '../src/stores/auth'

describe('Test 13 — TiposView (CRUD por bodega con componentes)', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })
    vi.clearAllMocks()
    bodegasApi.list.mockResolvedValue({
      data: [
        { id: 1, nombre: 'Bodega Central' },
        { id: 2, nombre: 'Bodega Norte' },
      ],
      total: 2,
      page: 1,
      limit: 100,
    })
    api.list.mockResolvedValue({
      data: [{ id: 1, nombre: 'Alimentos', bodega_id: 1, bodega_nombre: 'Bodega Central' }],
      total: 1,
      page: 1,
      limit: 10,
    })
    api.create.mockResolvedValue({ id: 2, nombre: 'Nuevo tipo', bodega_id: 1 })
    api.remove.mockResolvedValue({ detail: 'Eliminado' })
  })

  it('carga y muestra el listado (el admin arranca en Todas las bodegas)', async () => {
    const wrapper = mount(TiposView)
    await flushPromises()

    expect(wrapper.text()).toContain('Alimentos')
    expect(api.list).toHaveBeenCalledWith({ q: '', page: 1, limit: 10 })
    expect(wrapper.find('[data-test="bodega-filter"]').exists()).toBe(true)
  })

  it('abre el modal al hacer clic en Nuevo', async () => {
    const wrapper = mount(TiposView)
    await flushPromises()

    await wrapper.find('[data-test="create"]').trigger('click')

    expect(wrapper.find('[data-test="modal"]').exists()).toBe(true)
    expect(wrapper.find('h2').text()).toBe('Nuevo tipo')
    expect(wrapper.find('[data-test="field-bodega_id"]').exists()).toBe(true)
  })

  it('crea un tipo asociado a la bodega elegida', async () => {
    const wrapper = mount(TiposView)
    await flushPromises()

    await wrapper.find('[data-test="create"]').trigger('click')
    await wrapper.find('[data-test="field-nombre"]').setValue('Nuevo tipo')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(api.create).toHaveBeenCalledWith({ nombre: 'Nuevo tipo', bodega_id: 1 })
    expect(wrapper.text()).toContain('Tipo creado.')
  })

  it('permite al admin crear un tipo general sin bodega', async () => {
    const wrapper = mount(TiposView)
    await flushPromises()

    await wrapper.find('[data-test="create"]').trigger('click')
    await wrapper.find('[data-test="field-nombre"]').setValue('Tipo general')
    await wrapper.find('[data-test="field-bodega_id"]').setValue('')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(api.create).toHaveBeenCalledWith({ nombre: 'Tipo general' })
  })

  it('recarga el listado al cambiar de bodega', async () => {
    const wrapper = mount(TiposView)
    await flushPromises()
    api.list.mockClear()

    await wrapper.find('[data-test="bodega-filter"]').setValue('2')
    await flushPromises()

    expect(api.list).toHaveBeenCalledWith({ q: '', page: 1, limit: 10, bodega_id: 2 })
  })

  it('pide confirmación antes de eliminar', async () => {
    const wrapper = mount(TiposView)
    await flushPromises()

    await wrapper.find('[data-test="delete"]').trigger('click')
    expect(wrapper.find('[data-test="confirm-delete"]').exists()).toBe(true)

    await wrapper.find('[data-test="confirm"]').trigger('click')
    await flushPromises()

    expect(api.remove).toHaveBeenCalledWith(1)
  })
})
