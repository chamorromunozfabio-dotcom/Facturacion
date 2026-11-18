import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const api = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('../src/api/bodegas', () => ({ default: api }))

import BodegasView from '../src/views/BodegasView.vue'
import { useAuthStore } from '../src/stores/auth'

describe('Test 14 — BodegasView (CRUD con componentes)', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })
    vi.clearAllMocks()
    api.list.mockResolvedValue({
      data: [
        {
          id: 1,
          nombre: 'Bodega Central',
          direccion: 'Calle Principal 123',
          ciudad: 'Bogotá',
          telefono: '3001234567',
          recibe_nombre: 'María Rodríguez',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    })
    api.create.mockResolvedValue({ id: 2, nombre: 'Bodega Norte', direccion: null })
    api.remove.mockResolvedValue({ detail: 'Eliminado' })
  })

  it('carga y muestra nombre y ciudad', async () => {
    const wrapper = mount(BodegasView)
    await flushPromises()

    expect(wrapper.text()).toContain('Bodega Central')
    expect(wrapper.text()).toContain('Bogotá')
    expect(api.list).toHaveBeenCalledWith({ q: '', page: 1, limit: 10 })
  })

  it('abre el modal con los campos de bodega', async () => {
    const wrapper = mount(BodegasView)
    await flushPromises()

    await wrapper.find('[data-test="create"]').trigger('click')

    expect(wrapper.find('[data-test="field-nombre"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="field-direccion"]').exists()).toBe(true)
    expect(wrapper.find('h2').text()).toBe('Nueva bodega')
  })

  it('crea una bodega con dirección opcional', async () => {
    const wrapper = mount(BodegasView)
    await flushPromises()

    await wrapper.find('[data-test="create"]').trigger('click')
    await wrapper.find('[data-test="field-nombre"]').setValue('Bodega Norte')
    await wrapper.find('[data-test="field-direccion"]').setValue('Av. Sur 45')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(api.create).toHaveBeenCalledWith({
      nombre: 'Bodega Norte',
      direccion: 'Av. Sur 45',
    })
    expect(wrapper.text()).toContain('Bodega creada.')
  })

  it('permite crear sin dirección', async () => {
    const wrapper = mount(BodegasView)
    await flushPromises()

    await wrapper.find('[data-test="create"]').trigger('click')
    await wrapper.find('[data-test="field-nombre"]').setValue('Bodega Norte')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(api.create).toHaveBeenCalledWith({ nombre: 'Bodega Norte' })
  })

  it('pide confirmación antes de eliminar', async () => {
    const wrapper = mount(BodegasView)
    await flushPromises()

    await wrapper.find('[data-test="delete"]').trigger('click')
    expect(wrapper.find('[data-test="confirm-delete"]').exists()).toBe(true)

    await wrapper.find('[data-test="confirm"]').trigger('click')
    await flushPromises()

    expect(api.remove).toHaveBeenCalledWith(1)
  })
})
