import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const permisos = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))

const roles = vi.hoisted(() => ({ list: vi.fn() }))

const usuarios = vi.hoisted(() => ({
  list: vi.fn(),
  listPermisos: vi.fn(),
  addPermiso: vi.fn(),
  removePermiso: vi.fn(),
}))

vi.mock('../src/api/permisos', () => ({ default: permisos }))
vi.mock('../src/api/roles', () => ({ default: roles }))
vi.mock('../src/api/usuarios', () => ({ default: usuarios }))

import { CATALOGO_PERMISOS, claveDelNombreBackend } from '../src/config/permissions'
import PermisosView from '../src/views/PermisosView.vue'
import { useAuthStore } from '../src/stores/auth'

const catalogoBackend = () =>
  CATALOGO_PERMISOS.map((permiso, index) => ({ id: index + 1, nombre: permiso.nombre }))

describe('Test 40 — Permisos funcionales por usuario desde un desplegable fijo', () => {
  let permisosPorUsuario

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
    useAuthStore().saveSession('token-123', { id: 1, nombre: 'Ana', rol: 'admin' })

    permisosPorUsuario = new Map([
      [1, []],
      [5, []],
      [6, []],
    ])
    usuarios.list.mockResolvedValue({
      data: [
        { id: 1, nombre: 'Ana', correo: 'ana@entrega.com', rol: 'admin', rol_id: 1 },
        { id: 5, nombre: 'Juan', correo: 'juan@cliente.com', rol: 'cliente', rol_id: 3 },
        { id: 6, nombre: 'María', correo: 'maria@cliente.com', rol: 'cliente', rol_id: 3 },
      ],
      total: 3,
      page: 1,
      limit: 100,
    })
    usuarios.listPermisos.mockImplementation(async (id) => ({
      data: permisosPorUsuario.get(Number(id)) ?? [],
    }))
    usuarios.addPermiso.mockImplementation(async (id, permisoId) => {
      const nombre = CATALOGO_PERMISOS[Number(permisoId) - 1]?.nombre
      const lista = permisosPorUsuario.get(Number(id)) ?? []
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
        { id: 1, nombre: 'admin' },
        { id: 3, nombre: 'cliente' },
      ],
      total: 2,
      page: 1,
      limit: 100,
    })
  })

  it('ofrece el catálogo fijo agrupado por módulo y acción en el desplegable', async () => {
    const wrapper = mount(PermisosView)
    await flushPromises()

    const select = wrapper.find('[data-test="permiso-select"]')
    expect(select.exists()).toBe(true)

    const grupos = select.findAll('optgroup').map((grupo) => grupo.attributes('label'))
    expect(grupos).toEqual([
      'Facturación',
      'Bodegas',
      'Usuarios',
      'Tipos (productos)',
      'Roles',
      'Permisos',
    ])

    const opciones = select.findAll('option')
    expect(opciones).toHaveLength(CATALOGO_PERMISOS.length + 1)
    expect(select.find('[data-test="opcion-facturas:pdf"]').text()).toContain('Descargar PDF')
    expect(select.find('[data-test="opcion-usuarios:delete"]').text()).toContain('Eliminar')
  })

  it('no hay opción para crear, nombrar, editar ni borrar permisos', async () => {
    const wrapper = mount(PermisosView)
    await flushPromises()

    expect(wrapper.find('[data-test="create"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="field-nombre"]').exists()).toBe(false)
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Nuevo permiso')
    expect(wrapper.text()).not.toContain('Catálogo de permisos')
    expect(permisos.create).not.toHaveBeenCalled()
    expect(permisos.update).not.toHaveBeenCalled()
    expect(permisos.remove).not.toHaveBeenCalled()
  })

  it('el botón dice Dar permiso o Quitar permiso según lo que ya tiene el usuario', async () => {
    permisosPorUsuario.set(1, [{ id: 1, nombre: 'facturas_view' }])
    const wrapper = mount(PermisosView)
    await flushPromises()

    await wrapper.find('[data-test="permiso-select"]').setValue('facturas:view')
    expect(wrapper.find('[data-test="toggle-permiso"]').text()).toContain('Quitar permiso')

    await wrapper.find('[data-test="permiso-select"]').setValue('bodegas:create')
    expect(wrapper.find('[data-test="toggle-permiso"]').text()).toContain('Dar permiso')
  })

  it('dar un permiso a un cliente no se lo da a los demás clientes', async () => {
    const wrapper = mount(PermisosView)
    await flushPromises()

    await wrapper.find('[data-test="assignment-user"]').setValue('5')
    await flushPromises()
    await wrapper.find('[data-test="permiso-select"]').setValue('facturas:aceptar')
    await wrapper.find('[data-test="toggle-permiso"]').trigger('click')
    await flushPromises()

    expect(usuarios.addPermiso).toHaveBeenCalledWith(5, expect.any(Number))
    expect(wrapper.find('[data-test="permisos-actuales"]').text()).toContain(
      'Facturación — Aceptar',
    )

    await wrapper.find('[data-test="assignment-user"]').setValue('6')
    await flushPromises()

    expect(usuarios.listPermisos).toHaveBeenCalledWith(6)
    expect(wrapper.find('[data-test="permisos-actuales"]').text()).toContain(
      'todavía no tiene permisos',
    )
  })

  it('el rol es solo referencia: no se aplica su plantilla automáticamente', async () => {
    const wrapper = mount(PermisosView)
    await flushPromises()

    await wrapper.find('[data-test="assignment-user"]').setValue('5')
    await flushPromises()

    expect(wrapper.find('[data-test="plantilla-rol"]').text()).toContain('permisos predefinidos')
    expect(wrapper.find('[data-test="permisos-actuales"]').text()).toContain(
      'todavía no tiene permisos',
    )
    expect(usuarios.addPermiso).not.toHaveBeenCalled()
  })

  it('muestra como pendientes las funciones que el backend todavía no publicó', async () => {
    permisos.list.mockResolvedValue({
      data: [{ id: 6, nombre: 'usuarios_view' }],
      total: 1,
      page: 1,
      limit: 100,
    })
    const wrapper = mount(PermisosView)
    await flushPromises()

    expect(wrapper.find('[data-test="permisos-pendientes"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="opcion-facturas:view"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-test="opcion-usuarios:view"]').attributes('disabled')).toBeUndefined()
  })

  it('usa el nombre nuevo "usuarios_view" y ya no reconoce el alias "ususarios"', async () => {
    expect(claveDelNombreBackend('usuarios_view')).toBe('usuarios:view')
    expect(claveDelNombreBackend('ususarios')).toBeNull()

    permisos.list.mockResolvedValue({
      data: [{ id: 6, nombre: 'usuarios_view' }],
      total: 1,
      page: 1,
      limit: 100,
    })
    permisosPorUsuario.set(1, [{ id: 6, nombre: 'usuarios_view' }])
    const wrapper = mount(PermisosView)
    await flushPromises()

    expect(wrapper.find('[data-test="permisos-actuales"]').text()).toContain('Usuarios — Ver')
  })
})
