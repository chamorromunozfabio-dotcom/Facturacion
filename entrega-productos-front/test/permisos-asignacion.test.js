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
import { CATALOGO_PERMISOS } from '../src/config/permissions'
import PermisosView from '../src/views/PermisosView.vue'
import { useAuthStore } from '../src/stores/auth'

/** El backend publica el catálogo fijo con estos ids. */
const catalogoBackend = () =>
  CATALOGO_PERMISOS.map((permiso, index) => ({
    id: index + 1,
    nombre: permiso.nombre,
    descripcion: permiso.etiqueta,
    estado: true,
  }))

const nombrePorId = (id) => CATALOGO_PERMISOS[Number(id) - 1]?.nombre

const USUARIOS = [
  { id: 1, nombre: 'Ana' },
  { id: 2, nombre: 'Luis' },
  { id: 5, nombre: 'Juan' },
]

async function consultar(wrapper, id) {
  const usuario = USUARIOS.find((item) => item.id === id)
  await wrapper.find('[data-test="user-search"]').setValue(usuario.nombre)
  await flushPromises()
  await wrapper.find(`[data-test="usuario-${id}"]`).trigger('click')
  await flushPromises()
}

describe('Test 36 — Permisos por usuario (contrato publicado por el backend)', () => {
  let permisosPorUsuario

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
    useAuthStore().saveSession('token-123', { id: 1, nombre: 'Ana', rol: 'admin' })

    permisosPorUsuario = new Map([
      [1, [{ id: 1, nombre: 'facturas_view' }]],
      [2, []],
      [5, []],
    ])
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
      data: permisosPorUsuario.get(Number(id)) ?? [],
    }))
    usuarios.addPermiso.mockImplementation(async (id, permisoId) => {
      const lista = permisosPorUsuario.get(Number(id)) ?? []
      const nombre = nombrePorId(permisoId)
      if (!lista.some((permiso) => permiso.id === Number(permisoId))) {
        lista.push({ id: Number(permisoId), nombre })
      }
      permisosPorUsuario.set(Number(id), lista)
      return { id: Number(id), permisos: lista }
    })
    usuarios.removePermiso.mockImplementation(async (id, permisoId) => {
      const lista = (permisosPorUsuario.get(Number(id)) ?? []).filter(
        (permiso) => permiso.id !== Number(permisoId),
      )
      permisosPorUsuario.set(Number(id), lista)
      return { id: Number(id), permisos: lista }
    })
    permisos.list.mockResolvedValue({
      data: catalogoBackend(),
      total: CATALOGO_PERMISOS.length,
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
    await consultar(wrapper, 1)

    expect(usuarios.list).toHaveBeenCalledWith({ page: 1, limit: 100 })
    expect(usuarios.listPermisos).toHaveBeenCalledWith(1)
    expect(wrapper.find('[data-test="assignment-affected"]').text()).toContain('Ana')
    expect(wrapper.find('[data-test="permisos-actuales"]').text()).toContain('Facturación — Ver')
    expect(wrapper.find('[data-test="check-facturas:view"]').element.checked).toBe(true)
  })

  it('al elegir otro usuario carga SUS permisos, no los del anterior', async () => {
    const wrapper = mount(PermisosView)
    await flushPromises()

    await consultar(wrapper, 5)

    expect(usuarios.listPermisos).toHaveBeenCalledWith(5)
    expect(wrapper.find('[data-test="assignment-affected"]').text()).toContain('Juan')
    expect(wrapper.find('[data-test="check-facturas:view"]').element.checked).toBe(false)
    expect(wrapper.find('[data-test="permisos-actuales"]').text()).toContain(
      'todavía no tiene permisos',
    )
  })

  it('dar un permiso usa POST /usuarios/{id}/permisos/{permiso_id}', async () => {
    const wrapper = mount(PermisosView)
    await flushPromises()
    await consultar(wrapper, 1)

    await wrapper.find('[data-test="check-facturas:create"]').setValue(true)
    await flushPromises()
    await wrapper.find('[data-test="confirmar-permisos"]').trigger('click')
    await flushPromises()

    expect(usuarios.addPermiso).toHaveBeenCalledWith(1, 2)
    expect(usuarios.removePermiso).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('1 cambio guardado en "Ana".')
    expect(wrapper.find('[data-test="permisos-actuales"]').text()).toContain('Facturación — Crear')
  })

  it('quitar un permiso usa DELETE /usuarios/{id}/permisos/{permiso_id}', async () => {
    const wrapper = mount(PermisosView)
    await flushPromises()
    await consultar(wrapper, 1)

    await wrapper.find('[data-test="check-facturas:view"]').setValue(false)
    await flushPromises()
    await wrapper.find('[data-test="confirmar-permisos"]').trigger('click')
    await flushPromises()

    expect(usuarios.removePermiso).toHaveBeenCalledWith(1, 1)
    expect(usuarios.addPermiso).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('1 cambio guardado en "Ana".')
  })

  it('destildar un check saca solo ese permiso del usuario', async () => {
    const wrapper = mount(PermisosView)
    await flushPromises()
    await consultar(wrapper, 1)

    await wrapper.find('[data-test="check-facturas:view"]').setValue(false)
    await flushPromises()
    await wrapper.find('[data-test="confirmar-permisos"]').trigger('click')
    await flushPromises()

    expect(usuarios.removePermiso).toHaveBeenCalledWith(1, 1)
    expect(wrapper.find('[data-test="permisos-actuales"]').text()).toContain(
      'todavía no tiene permisos',
    )
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

  it('Permisos sigue oculto para quien no tiene el permiso de ver', async () => {
    expect(visibleMenuFor('admin').map((item) => item.label)).toContain('Permisos')
    expect(visibleMenuFor('bodeguero').map((item) => item.label)).not.toContain('Permisos')
    expect(router.getRoutes().find((route) => route.name === 'permisos')?.meta.permission).toBe(
      'permisos:view',
    )

    await router.push({ name: 'login', query: { reset: String(Math.random()) } })
    useAuthStore().saveSession('token-123', { nombre: 'Luis', rol: 'bodeguero' })
    await router.push('/permisos')

    expect(router.currentRoute.value.name).toBe('inicio')
  })
})
