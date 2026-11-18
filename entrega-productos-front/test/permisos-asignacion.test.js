import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const permisos = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))

const roles = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  setPermisos: vi.fn(),
}))

const usuarios = vi.hoisted(() => ({
  list: vi.fn(),
  listPermisos: vi.fn(),
  setPermisos: vi.fn(),
  addPermiso: vi.fn(),
  removePermiso: vi.fn(),
}))

vi.mock('../src/api/permisos', () => ({ default: permisos }))
vi.mock('../src/api/roles', () => ({ default: roles }))
vi.mock('../src/api/usuarios', () => ({ default: usuarios }))
// Forzamos modo real para comprobar las URL de los endpoints de permisos.
vi.mock('../src/config/apiModes', () => ({
  resolveApiModes: () => ({ authMocks: false, catalogsMocks: false, facturasMocks: false }),
}))

import api from '../src/api/axios'
import { visibleMenuFor } from '../src/config/navigation'
import router from '../src/router'
import PermisosView from '../src/views/PermisosView.vue'
import { useAuthStore } from '../src/stores/auth'

describe('Test 36 — Permisos por usuario (contrato publicado por el backend)', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
    useAuthStore().saveSession('token-123', { id: 1, nombre: 'Ana', rol: 'admin' })

    usuarios.list.mockResolvedValue({
      data: [
        { id: 1, nombre: 'Ana', correo: 'admin@entrega.com', rol: 'admin', rol_id: 1, permisos: [] },
        { id: 2, nombre: 'Luis', correo: 'bodeguero@gmail.com', rol: 'bodeguero', rol_id: 2, permisos: [] },
        { id: 5, nombre: 'Juan', correo: 'cliente@gmail.com', rol: 'cliente', rol_id: 3, permisos: [] },
      ],
      total: 3,
      page: 1,
      limit: 100,
    })
    usuarios.listPermisos.mockImplementation(async (id) => ({
      data: Number(id) === 1 ? [{ id: 1, nombre: 'crear_factura' }] : [],
    }))
    usuarios.setPermisos.mockResolvedValue({
      id: 1,
      nombre: 'Ana',
      permisos: [
        { id: 1, nombre: 'crear_factura' },
        { id: 2, nombre: 'editar_factura' },
      ],
    })
    permisos.list.mockResolvedValue({
      data: [
        { id: 1, nombre: 'crear_factura', descripcion: 'Crea facturas', estado: true },
        { id: 2, nombre: 'editar_factura', descripcion: 'Edita facturas', estado: true },
      ],
      total: 2,
      page: 1,
      limit: 100,
    })
    roles.list.mockResolvedValue({
      data: [
        { id: 1, nombre: 'admin', permisos: [] },
        { id: 2, nombre: 'bodeguero', permisos: [] },
        { id: 3, nombre: 'cliente', permisos: [] },
      ],
      total: 3,
      page: 1,
      limit: 100,
    })
  })

  it('carga usuarios y muestra los permisos del usuario seleccionado', async () => {
    const wrapper = mount(PermisosView)
    await flushPromises()

    expect(usuarios.list).toHaveBeenCalledWith({ page: 1, limit: 100 })
    expect(usuarios.listPermisos).toHaveBeenCalledWith(1)
    expect(wrapper.find('[data-test="permiso-check-1"]').element.checked).toBe(true)
    expect(wrapper.find('[data-test="permiso-check-2"]').element.checked).toBe(false)
    expect(wrapper.find('[data-test="assignment-affected"]').text()).toContain('Ana')
  })

  it('al elegir otro usuario carga SUS permisos, no los del anterior', async () => {
    const wrapper = mount(PermisosView)
    await flushPromises()

    await wrapper.find('[data-test="assignment-user"]').setValue('5')
    await flushPromises()

    expect(usuarios.listPermisos).toHaveBeenCalledWith(5)
    expect(wrapper.find('[data-test="assignment-affected"]').text()).toContain('Juan')
    expect(wrapper.find('[data-test="permiso-check-1"]').element.checked).toBe(false)
  })

  it('marcar un permiso y guardar usa PUT /usuarios/{id}/permisos con la lista completa', async () => {
    const wrapper = mount(PermisosView)
    await flushPromises()

    await wrapper.find('[data-test="permiso-check-2"]').setValue(true)
    await wrapper.find('[data-test="save-permisos"]').trigger('click')
    await flushPromises()

    expect(usuarios.setPermisos).toHaveBeenCalledWith(1, [1, 2])
    expect(wrapper.text()).toContain('Permisos de "Ana" actualizados.')
    expect(wrapper.find('[data-test="save-permisos"]').attributes('disabled')).toBeDefined()
  })

  it('desmarcar todos envía permisos_ids vacío para quitar los accesos', async () => {
    const wrapper = mount(PermisosView)
    await flushPromises()

    await wrapper.find('[data-test="permiso-check-1"]').setValue(false)
    await wrapper.find('[data-test="save-permisos"]').trigger('click')
    await flushPromises()

    expect(usuarios.setPermisos).toHaveBeenCalledWith(1, [])
  })

  it('el cliente de la API usa los endpoints reales de permisos por usuario', async () => {
    const realUsuariosApi = await vi.importActual('../src/api/usuarios')
    const realRolesApi = await vi.importActual('../src/api/roles')
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [{ id: 2, nombre: 'editar_factura' }] } })
    const put = vi.spyOn(api, 'put').mockResolvedValue({ data: { id: 1, permisos: [] } })
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { id: 1, permisos: [] } })
    const del = vi.spyOn(api, 'delete').mockResolvedValue({ status: 204, data: '' })

    await realUsuariosApi.default.listPermisos(1)
    await realUsuariosApi.default.setPermisos(1, [2, 2])
    await realUsuariosApi.default.addPermiso(1, 2)
    await realUsuariosApi.default.removePermiso(1, 2)

    expect(get).toHaveBeenCalledWith('/usuarios/1/permisos')
    expect(put).toHaveBeenCalledWith('/usuarios/1/permisos', { permisos_ids: [2, 2] })
    expect(post).toHaveBeenCalledWith('/usuarios/1/permisos/2')
    expect(del).toHaveBeenCalledWith('/usuarios/1/permisos/2')

    // El endpoint de rol sigue existiendo como plantilla (no lo rompemos).
    await realRolesApi.default.setPermisos(1, [2])
    expect(put).toHaveBeenCalledWith('/roles/1/permisos', { permisos_ids: [2] })

    get.mockRestore()
    put.mockRestore()
    post.mockRestore()
    del.mockRestore()
  })

  it('la sesión conserva los permisos que manda el backend', () => {
    const auth = useAuthStore()
    auth.saveSession('token-456', {
      id: 1,
      nombre: 'Ana',
      rol: 'admin',
      permisos: [{ id: 2, nombre: 'editar_factura' }],
    })

    expect(auth.permisos).toEqual([{ id: 2, nombre: 'editar_factura' }])
    expect(JSON.parse(localStorage.getItem('user')).permisos).toHaveLength(1)
  })

  it('Permisos sigue siendo un módulo exclusivo del admin', () => {
    expect(visibleMenuFor('admin').map((item) => item.label)).toContain('Permisos')
    expect(visibleMenuFor('bodeguero').map((item) => item.label)).not.toContain('Permisos')
    expect(router.getRoutes().find((route) => route.name === 'permisos')?.meta.roles).toEqual([
      'admin',
    ])
  })
})
