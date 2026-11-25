import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const api = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))

const empresas = vi.hoisted(() => ({
  listActivas: vi.fn(),
}))

vi.mock('../src/modules/catalogos/api/bodegas', () => ({ default: api }))
vi.mock('../src/modules/empresas/api/empresas', () => ({ default: empresas }))

import BodegasView from '../src/modules/catalogos/views/BodegasView.vue'
import { useAuthStore } from '../src/modules/auth/store/auth'

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
    empresas.listActivas.mockResolvedValue({
      data: [{ id: 1, razon_social: 'Distribuidora Andina S.A.S.' }],
    })
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

  const completa = {
    nombre: 'Bodega Norte',
    codigo: 'BN-01',
    direccion: 'Av. Sur 45',
    ciudad: 'Cali',
    departamento: 'Valle',
    telefono: '3001234567',
    correo: 'norte@entrega.com',
    empresa_id: 1,
    recibe_nombre: 'Carlos Pérez',
    recibe_documento: '1020304051',
    recibe_cargo: 'Jefe de bodega',
    recibe_telefono: '3109876544',
  }

  async function llenarTodo(wrapper, valores = completa) {
    await wrapper.find('[data-test="create"]').trigger('click')
    for (const [key, value] of Object.entries(valores)) {
      await wrapper.find(`[data-test="field-${key}"]`).setValue(value)
    }
  }

  it('crea una bodega con dirección', async () => {
    const wrapper = mount(BodegasView)
    await flushPromises()
    await llenarTodo(wrapper)

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(api.create).toHaveBeenCalledWith(completa)
    expect(wrapper.text()).toContain('Bodega creada.')
  })

  it('no permite crear sin dirección', async () => {
    const wrapper = mount(BodegasView)
    await flushPromises()
    const incompleta = { ...completa }
    delete incompleta.direccion
    await llenarTodo(wrapper, incompleta)

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[data-test="error-direccion"]').text()).toBe('Escribe dirección.')
    expect(api.create).not.toHaveBeenCalled()
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

  it('recarga los bodegueros al cambiar la empresa dentro del formulario', async () => {
    const usuarios = await import('../src/modules/catalogos/api/usuarios')
    const spyUsuarios = vi.spyOn(usuarios.default, 'list').mockResolvedValue({
      data: [{ id: 10, nombre: 'Pedro Bodeguero' }],
    })
    empresas.listActivas.mockResolvedValue({
      data: [
        { id: 1, razon_social: 'Distribuidora Andina S.A.S.' },
        { id: 2, razon_social: 'Comercializadora Caribe' },
      ],
    })

    const wrapper = mount(BodegasView)
    await flushPromises()

    await wrapper.find('[data-test="create"]').trigger('click')
    await flushPromises()

    await wrapper.find('[data-test="field-empresa_id"]').setValue('2')
    await flushPromises()

    expect(spyUsuarios).toHaveBeenLastCalledWith({
      rol: 'bodeguero',
      page: 1,
      limit: 100,
      empresa_id: '2',
    })
    spyUsuarios.mockRestore()
  })

  it('el rol empresa puede elegir bodeguero dueño sin mostrar selector de empresa', async () => {
    useAuthStore().saveSession('token-emp', {
      nombre: 'Distribuidora Andina',
      rol: 'empresa',
      empresa: { id: 1, razon_social: 'Distribuidora Andina S.A.S.', estado: 'activa' },
    })
    const usuarios = await import('../src/modules/catalogos/api/usuarios')
    const spyUsuarios = vi.spyOn(usuarios.default, 'list').mockResolvedValue({
      data: [{ id: 10, nombre: 'Pedro Bodeguero' }],
    })

    const wrapper = mount(BodegasView)
    await flushPromises()

    await wrapper.find('[data-test="create"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="field-empresa_id"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="field-bodeguero_id"]').exists()).toBe(true)
    expect(spyUsuarios).toHaveBeenCalledWith({ rol: 'bodeguero', page: 1, limit: 100 })
    spyUsuarios.mockRestore()
  })
})
