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
}))

vi.mock('../src/api/permisos', () => ({ default: permisos }))
vi.mock('../src/api/roles', () => ({ default: roles }))
vi.mock('../src/api/usuarios', () => ({ default: usuarios }))
// Forzamos modo real para comprobar la URL del endpoint de asignación.
vi.mock('../src/config/apiModes', () => ({
  resolveApiModes: () => ({ authMocks: false, catalogsMocks: false, facturasMocks: false }),
}))

import api from '../src/api/axios'
import { visibleMenuFor } from '../src/config/navigation'
import router from '../src/router'
import PermisosView from '../src/views/PermisosView.vue'
import { useAuthStore } from '../src/stores/auth'

describe('Test 36 — Permisos: dar y quitar accesos desde el rol', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })

    roles.list.mockResolvedValue({
      data: [
        { id: 1, nombre: 'admin', permisos: [{ id: 1, nombre: 'crear_factura' }] },
        { id: 2, nombre: 'bodeguero', permisos: [] },
        { id: 3, nombre: 'cliente', permisos: [] },
      ],
      total: 3,
      page: 1,
      limit: 100,
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
    usuarios.list.mockResolvedValue({
      data: [
        { id: 1, nombre: 'Ana', correo: 'admin@entrega.com', rol: 'admin', rol_id: 1 },
        { id: 2, nombre: 'Luis', correo: 'bodeguero@gmail.com', rol: 'bodeguero', rol_id: 2 },
        { id: 5, nombre: 'Juan', correo: 'cliente@gmail.com', rol: 'cliente', rol_id: 3 },
      ],
      total: 3,
      page: 1,
      limit: 100,
    })
    roles.setPermisos.mockResolvedValue({
      id: 1,
      nombre: 'admin',
      permisos: [
        { id: 1, nombre: 'crear_factura' },
        { id: 2, nombre: 'editar_factura' },
      ],
    })
  })

  it('carga roles, usuarios y permisos, y marca los del rol seleccionado', async () => {
    const wrapper = mount(PermisosView)
    await flushPromises()

    expect(roles.list).toHaveBeenCalledWith({ page: 1, limit: 100 })
    expect(usuarios.list).toHaveBeenCalledWith({ page: 1, limit: 100 })
    expect(wrapper.find('[data-test="permiso-option-1"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="permiso-check-1"]').element.checked).toBe(true)
    expect(wrapper.find('[data-test="permiso-check-2"]').element.checked).toBe(false)
    expect(wrapper.find('[data-test="affected-users"]').text()).toContain('Ana')
  })

  it('elegir un usuario cambia el rol y muestra a quién afecta el cambio', async () => {
    const wrapper = mount(PermisosView)
    await flushPromises()

    await wrapper.find('[data-test="assignment-user"]').setValue('2')
    await flushPromises()

    expect(wrapper.find('[data-test="assignment-role"]').element.value).toBe('2')
    expect(wrapper.find('[data-test="affected-users"]').text()).toContain('Luis')
    expect(wrapper.find('[data-test="permiso-check-1"]').element.checked).toBe(false)
  })

  it('marcar un permiso y guardar envía la lista completa al backend', async () => {
    const wrapper = mount(PermisosView)
    await flushPromises()

    await wrapper.find('[data-test="permiso-check-2"]').setValue(true)
    await wrapper.find('[data-test="save-permisos"]').trigger('click')
    await flushPromises()

    expect(roles.setPermisos).toHaveBeenCalledWith(1, [1, 2])
    expect(wrapper.text()).toContain('Permisos de "admin" actualizados.')
    expect(wrapper.find('[data-test="save-permisos"]').attributes('disabled')).toBeDefined()
  })

  it('desmarcar un permiso lo quita del rol (lista vacía incluida)', async () => {
    const wrapper = mount(PermisosView)
    await flushPromises()

    await wrapper.find('[data-test="permiso-check-1"]').setValue(false)
    await wrapper.find('[data-test="save-permisos"]').trigger('click')
    await flushPromises()

    expect(roles.setPermisos).toHaveBeenCalledWith(1, [])
  })

  it('el cliente de la API llama a PUT /roles/{id}/permisos con permisos_ids', async () => {
    const realRolesApi = await vi.importActual('../src/api/roles')
    const put = vi.spyOn(api, 'put').mockResolvedValue({
      data: { id: 3, nombre: 'cliente', permisos: [{ id: 2, nombre: 'editar_factura' }] },
    })

    const resultado = await realRolesApi.default.setPermisos(3, [2, 2])

    expect(put).toHaveBeenCalledWith('/roles/3/permisos', { permisos_ids: [2, 2] })
    expect(resultado.permisos[0].nombre).toBe('editar_factura')
    put.mockRestore()
  })

  it('Permisos sigue siendo un módulo exclusivo del admin', () => {
    expect(visibleMenuFor('admin').map((item) => item.label)).toContain('Permisos')
    expect(visibleMenuFor('bodeguero').map((item) => item.label)).not.toContain('Permisos')
    expect(router.getRoutes().find((route) => route.name === 'permisos')?.meta.roles).toEqual([
      'admin',
    ])
  })
})
