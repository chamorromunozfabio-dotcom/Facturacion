import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const api = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))

const roles = vi.hoisted(() => ({ list: vi.fn() }))

vi.mock('../src/modules/catalogos/api/usuarios', () => ({ default: api }))
vi.mock('../src/modules/catalogos/api/roles', () => ({ default: roles }))

import UsuariosView from '../src/modules/catalogos/views/UsuariosView.vue'
import { useAuthStore } from '../src/modules/auth/store/auth'

const adminRow = { id: 1, nombre: 'Ana Pérez', correo: 'ana@entrega.com', rol: 'admin', rol_id: 1 }
const clientRow = {
  id: 3,
  nombre: 'Juan Pérez',
  correo: 'juan@cliente.com',
  rol: 'cliente',
  rol_id: 3,
  tipo_documento: 'CC',
  numero_documento: '1020304050',
  telefono: '3001234567',
  direccion: 'Calle 10 # 20-30',
}

describe('Test 19 — UsuariosView (roles y campos condicionales)', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
    api.list.mockResolvedValue({ data: [adminRow, clientRow], total: 2, page: 1, limit: 10 })
    roles.list.mockResolvedValue({
      data: [
        { id: 1, nombre: 'admin' },
        { id: 2, nombre: 'bodeguero' },
        { id: 3, nombre: 'cliente' },
      ],
      total: 3,
      page: 1,
      limit: 100,
    })
    api.create.mockResolvedValue({ id: 4, nombre: 'Nuevo' })
    api.update.mockResolvedValue({ id: 3, nombre: 'Juan Actualizado' })
  })

  it('el administrador ve el filtro y todos los usuarios', async () => {
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })

    const wrapper = mount(UsuariosView)
    await flushPromises()

    expect(wrapper.find('[data-test="role-filter"]').exists()).toBe(true)
    expect(api.list).toHaveBeenCalledWith({ q: '', page: 1, limit: 10 })
    expect(wrapper.text()).toContain('Juan Pérez')
  })

  it('el bodeguero solo pide clientes y no ve botones de cambio', async () => {
    useAuthStore().saveSession('token-123', { nombre: 'Luis', rol: 'bodeguero' })

    const wrapper = mount(UsuariosView)
    await flushPromises()

    expect(api.list).toHaveBeenCalledWith({ q: '', page: 1, limit: 10, rol: 'cliente' })
    expect(wrapper.find('[data-test="role-filter"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="create"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="edit"]').exists()).toBe(false)
    // El filtro sigue por cliente, pero ya no mostramos el cartel explicativo.
    expect(wrapper.text()).not.toContain('solo usuarios con rol cliente')
  })

  it('muestra los campos de cliente al elegir ese rol', async () => {
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })
    const wrapper = mount(UsuariosView)
    await flushPromises()

    await wrapper.find('[data-test="create"]').trigger('click')
    expect(wrapper.find('[data-test="field-numero_documento"]').exists()).toBe(false)

    await wrapper.find('[data-test="field-rol_id"]').setValue('3')

    expect(wrapper.find('[data-test="field-tipo_documento"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="field-numero_documento"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="field-telefono"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="field-direccion"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="field-ciudad"]').exists()).toBe(true)
    const tipos = wrapper
      .findAll('[data-test="field-tipo_documento"] option')
      .map((option) => option.text())
    expect(tipos).toEqual(['CC', 'NIT', 'CE', 'PA'])
  })

  it('crea un cliente sin exigir los datos opcionales', async () => {
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })
    const wrapper = mount(UsuariosView)
    await flushPromises()

    await wrapper.find('[data-test="create"]').trigger('click')
    await wrapper.find('[data-test="field-nombre"]').setValue('Pedro')
    await wrapper.find('[data-test="field-correo"]').setValue('pedro@cliente.com')
    await wrapper.find('[data-test="field-contrasena"]').setValue('Clave123*')
    await wrapper.find('[data-test="field-rol_id"]').setValue('3')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(api.create).toHaveBeenCalledWith({
      nombre: 'Pedro',
      correo: 'pedro@cliente.com',
      contrasena: 'Clave123*',
      rol_id: 3,
    })
  })

  it('crea un usuario admin enviando rol_id como número', async () => {
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })
    const wrapper = mount(UsuariosView)
    await flushPromises()

    await wrapper.find('[data-test="create"]').trigger('click')
    await wrapper.find('[data-test="field-nombre"]').setValue(' Laura ')
    await wrapper.find('[data-test="field-correo"]').setValue('laura@entrega.com')
    await wrapper.find('[data-test="field-contrasena"]').setValue('Clave123*')
    await wrapper.find('[data-test="field-rol_id"]').setValue('1')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(api.create).toHaveBeenCalledWith({
      nombre: 'Laura',
      correo: 'laura@entrega.com',
      contrasena: 'Clave123*',
      rol_id: 1,
    })
  })

  it('edita sin volver a pedir la contraseña', async () => {
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })
    const wrapper = mount(UsuariosView)
    await flushPromises()

    await wrapper.findAll('[data-test="edit"]')[1].trigger('click')
    await wrapper.find('[data-test="field-nombre"]').setValue('Juan Actualizado')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(api.update).toHaveBeenCalledWith(3, { nombre: 'Juan Actualizado' })
  })
})
