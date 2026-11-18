import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const roles = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))

const permisos = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('../src/api/roles', () => ({ default: roles }))
vi.mock('../src/api/permisos', () => ({ default: permisos }))

import { resolveApiModes } from '../src/config/apiModes'
import RolesView from '../src/views/RolesView.vue'
import PermisosView from '../src/views/PermisosView.vue'
import { useAuthStore } from '../src/stores/auth'

describe('Test 32 — Módulos conectados a la API real', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })

    roles.list.mockResolvedValue({
      data: [{ id: 1, nombre: 'admin', descripcion: 'Acceso total', estado: true }],
      total: 1,
      page: 1,
      limit: 10,
    })
    permisos.list.mockResolvedValue({
      data: [{ id: 1, nombre: 'crear_factura', descripcion: 'Crea facturas', estado: true }],
      total: 1,
      page: 1,
      limit: 10,
    })
  })

  it('el modo híbrido deja Facturas con mocks y catálogos con API real', () => {
    expect(resolveApiModes({ VITE_USE_MOCKS: 'false', VITE_FACTURAS_MOCKS: 'true' })).toEqual({
      authMocks: false,
      catalogsMocks: false,
      facturasMocks: true,
    })
    expect(resolveApiModes({ VITE_USE_MOCKS: 'true' }).facturasMocks).toBe(true)
    expect(
      resolveApiModes({ VITE_USE_MOCKS: 'false', VITE_FACTURAS_MOCKS: 'false' }).facturasMocks,
    ).toBe(false)
  })

  it('Roles lista y crea usando su API', async () => {
    roles.create.mockResolvedValue({
      id: 2,
      nombre: 'supervisor',
      descripcion: 'Supervisa',
      estado: true,
    })

    const wrapper = mount(RolesView)
    await flushPromises()

    expect(roles.list).toHaveBeenCalledWith({ q: '', page: 1, limit: 10 })
    expect(wrapper.text()).toContain('admin')

    await wrapper.find('[data-test="create"]').trigger('click')
    await wrapper.find('[data-test="field-nombre"]').setValue('supervisor')
    await wrapper.find('[data-test="field-descripcion"]').setValue('Supervisa')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(roles.create).toHaveBeenCalledWith({ nombre: 'supervisor', descripcion: 'Supervisa' })
    expect(wrapper.text()).toContain('Rol creado.')
  })

  it('Permisos lista y crea usando su API', async () => {
    permisos.create.mockResolvedValue({
      id: 2,
      nombre: 'editar_factura',
      descripcion: 'Edita facturas',
      estado: true,
    })

    const wrapper = mount(PermisosView)
    await flushPromises()

    expect(permisos.list).toHaveBeenCalledWith({ q: '', page: 1, limit: 10 })
    expect(wrapper.text()).toContain('crear_factura')

    await wrapper.find('[data-test="create"]').trigger('click')
    await wrapper.find('[data-test="field-nombre"]').setValue('editar_factura')
    await wrapper.find('[data-test="field-descripcion"]').setValue('Edita facturas')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(permisos.create).toHaveBeenCalledWith({
      nombre: 'editar_factura',
      descripcion: 'Edita facturas',
    })
    expect(wrapper.text()).toContain('Permiso creado.')
  })
})
