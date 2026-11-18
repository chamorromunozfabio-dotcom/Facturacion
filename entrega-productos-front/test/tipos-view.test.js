import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const api = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('../src/api/tipos', () => ({ default: api }))

import TiposView from '../src/views/TiposView.vue'

describe('Test 13 — TiposView (CRUD con componentes)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.list.mockResolvedValue({
      data: [{ id: 1, nombre: 'Alimentos' }],
      total: 1,
      page: 1,
      limit: 10,
    })
    api.create.mockResolvedValue({ id: 2, nombre: 'Nuevo tipo' })
    api.remove.mockResolvedValue({ detail: 'Eliminado' })
  })

  it('carga y muestra el listado', async () => {
    const wrapper = mount(TiposView)
    await flushPromises()

    expect(wrapper.text()).toContain('Alimentos')
    expect(api.list).toHaveBeenCalledWith({ q: '', page: 1, limit: 10 })
  })

  it('abre el modal al hacer clic en Nuevo', async () => {
    const wrapper = mount(TiposView)
    await flushPromises()

    await wrapper.find('[data-test="create"]').trigger('click')

    expect(wrapper.find('[data-test="modal"]').exists()).toBe(true)
    expect(wrapper.find('h2').text()).toBe('Nuevo tipo')
  })

  it('crea un registro desde el formulario', async () => {
    const wrapper = mount(TiposView)
    await flushPromises()

    await wrapper.find('[data-test="create"]').trigger('click')
    await wrapper.find('[data-test="field-nombre"]').setValue('Nuevo tipo')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(api.create).toHaveBeenCalledWith({ nombre: 'Nuevo tipo' })
    expect(wrapper.text()).toContain('Tipo creado.')
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
