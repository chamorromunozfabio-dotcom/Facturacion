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

import { hasPermission, plantillaDelRol, tienePermiso } from '../src/shared/config/permissions'
import { visibleMenuFor } from '../src/shared/config/navigation'
import { useAuthStore } from '../src/modules/auth/store/auth'
import UsuariosView from '../src/modules/catalogos/views/UsuariosView.vue'

const ROLES_BACKEND = [
  { id: 1, nombre: 'admin', estado: true },
  { id: 2, nombre: 'bodeguero', estado: true },
  { id: 3, nombre: 'cliente', estado: true },
  { id: 4, nombre: 'empresa', estado: true },
]

const bodegueroRow = {
  id: 7,
  nombre: 'Luis Gómez',
  correo: 'luis@entrega.com',
  rol: 'bodeguero',
  rol_id: 2,
  empresa_id: 1,
  empresa_nombre: 'Distribuidora Andina S.A.S.',
}

describe('Test 68 — Rol empresa: permisos, navegación y usuarios', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
    api.list.mockResolvedValue({ data: [bodegueroRow], total: 1, page: 1, limit: 10 })
    api.create.mockResolvedValue({ ...bodegueroRow, id: 8, nombre: 'Nuevo bodeguero' })
    roles.list.mockResolvedValue({
      data: ROLES_BACKEND,
      total: ROLES_BACKEND.length,
      page: 1,
      limit: 100,
    })
  })

  it('la matriz del rol empresa gestiona su equipo pero no acepta facturas', () => {
    expect(hasPermission('empresa', 'usuarios', 'create')).toBe(true)
    expect(hasPermission('empresa', 'bodegas', 'delete')).toBe(true)
    expect(hasPermission('empresa', 'facturas', 'entregar')).toBe(true)
    expect(hasPermission('empresa', 'facturas', 'aceptar')).toBe(false)
    expect(hasPermission('empresa', 'facturas', 'rechazar')).toBe(false)
    expect(hasPermission('empresa', 'empresas', 'view')).toBe(false)
    expect(hasPermission('empresa', 'roles', 'view')).toBe(false)
  })

  it('los permisos reales del backend no pueden abrir Empresas ni aceptar facturas', () => {
    const permisos = [
      { nombre: 'empresas_view' },
      { nombre: 'facturas_aceptar' },
      { nombre: 'facturas_rechazar' },
      { nombre: 'usuarios_view' },
    ]

    expect(tienePermiso(permisos, 'empresa', 'empresas', 'view')).toBe(false)
    expect(tienePermiso(permisos, 'empresa', 'facturas', 'aceptar')).toBe(false)
    expect(tienePermiso(permisos, 'empresa', 'facturas', 'rechazar')).toBe(false)
    expect(tienePermiso(permisos, 'empresa', 'usuarios', 'view')).toBe(true)
    expect(tienePermiso(permisos, 'admin', 'empresas', 'view')).toBe(true)
    expect(tienePermiso(permisos, 'cliente', 'empresas', 'view')).toBe(false)
  })

  it('la plantilla del rol no incluye acciones exclusivas de admin o cliente', () => {
    const plantilla = plantillaDelRol('empresa')

    expect(plantilla).toContain('usuarios:view')
    expect(plantilla).toContain('facturas:pdf')
    expect(plantilla).not.toContain('facturas:aceptar')
    expect(plantilla).not.toContain('facturas:rechazar')
    expect(plantilla).not.toContain('empresas:view')
    expect(plantilla).not.toContain('roles:view')
  })

  it('el menú de empresa no muestra Empresas, Permisos ni Roles', () => {
    const labels = visibleMenuFor('empresa', []).map((item) => item.label)

    expect(labels).toEqual(['Inicio', 'Tipos', 'Bodegas', 'Usuarios', 'Facturas', 'Estadísticas'])
    expect(visibleMenuFor('admin', []).map((item) => item.label)).toContain('Empresas')
    expect(
      visibleMenuFor('empresa', [{ nombre: 'empresas_view' }]).map((item) => item.label),
    ).not.toContain('Empresas')
  })

  it('empresa solo lista sus bodegueros y no muestra el filtro de rol', async () => {
    useAuthStore().saveSession('token-123', {
      nombre: 'Distribuidora Andina',
      rol: 'empresa',
      empresa_id: 1,
    })

    const wrapper = mount(UsuariosView)
    await flushPromises()

    expect(api.list).toHaveBeenCalledWith({ q: '', page: 1, limit: 10, rol: 'bodeguero' })
    expect(wrapper.find('[data-test="role-filter"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="create"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Luis Gómez')
  })

  it('el alta de empresa fija el rol bodeguero y no muestra el selector', async () => {
    useAuthStore().saveSession('token-123', {
      nombre: 'Distribuidora Andina',
      rol: 'empresa',
      empresa_id: 1,
    })

    const wrapper = mount(UsuariosView)
    await flushPromises()

    await wrapper.find('[data-test="create"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="field-rol_id"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="field-tipo_documento"]').exists()).toBe(false)

    await wrapper.find('[data-test="field-nombre"]').setValue('Nuevo bodeguero')
    await wrapper.find('[data-test="field-correo"]').setValue('nuevo@entrega.com')
    await wrapper.find('[data-test="field-contrasena"]').setValue('Bodega123*')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(api.create).toHaveBeenCalledWith({
      nombre: 'Nuevo bodeguero',
      correo: 'nuevo@entrega.com',
      contrasena: 'Bodega123*',
      rol_id: 2,
    })
  })

  it('el admin conserva el selector de rol con la opción empresa', async () => {
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })

    const wrapper = mount(UsuariosView)
    await flushPromises()
    await wrapper.find('[data-test="create"]').trigger('click')
    await flushPromises()

    const opciones = wrapper
      .findAll('[data-test="field-rol_id"] option')
      .map((option) => option.text())

    expect(opciones).toEqual(['admin', 'bodeguero', 'cliente', 'empresa'])
  })
})
