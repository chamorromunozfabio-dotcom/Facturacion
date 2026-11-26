import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const rolesApi = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  setPermisos: vi.fn(),
  cambiarEstado: vi.fn(),
}))

const permisosApi = vi.hoisted(() => ({
  list: vi.fn(),
}))

vi.mock('../src/modules/catalogos/api/roles', () => ({ default: rolesApi }))
vi.mock('../src/modules/permisos/api/permisos', () => ({ default: permisosApi }))

import RolesView from '../src/modules/catalogos/views/RolesView.vue'
import { useAuthStore } from '../src/modules/auth/store/auth'

describe('RolesView — permisos al crear/editar y protección de roles base', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    useAuthStore().saveSession('token-123', { nombre: 'Admin', rol: 'admin' })
    vi.clearAllMocks()

    rolesApi.list.mockResolvedValue({
      data: [
        {
          id: 1,
          nombre: 'admin',
          descripcion: 'Administrador',
          estado: true,
          permisos: [{ id: 1, nombre: 'facturas_view' }],
        },
        {
          id: 5,
          nombre: 'auditor',
          descripcion: 'Solo lectura',
          estado: true,
          permisos: [{ id: 1, nombre: 'facturas_view' }],
        },
      ],
      total: 2,
      page: 1,
      limit: 10,
    })
    permisosApi.list.mockResolvedValue({
      data: [
        { id: 1, nombre: 'facturas_view' },
        { id: 2, nombre: 'estadisticas_view' },
      ],
    })
    rolesApi.create.mockResolvedValue({
      id: 9,
      nombre: 'supervisor',
      descripcion: 'Supervisa',
      estado: true,
      permisos: [],
    })
    rolesApi.setPermisos.mockResolvedValue({
      id: 9,
      nombre: 'supervisor',
      permisos: [
        { id: 1, nombre: 'facturas_view' },
        { id: 2, nombre: 'estadisticas_view' },
      ],
    })
  })

  it('permite asignar permisos directamente al crear un rol nuevo', async () => {
    const wrapper = mount(RolesView)
    await flushPromises()

    await wrapper.find('[data-test="create"]').trigger('click')
    await flushPromises()

    await wrapper.find('[data-test="field-nombre"]').setValue('supervisor')
    await wrapper.find('[data-test="field-descripcion"]').setValue('Supervisa')
    await wrapper.find('[data-test="rol-perm-facturas_view"]').setValue(true)
    await wrapper.find('[data-test="rol-perm-estadisticas_view"]').setValue(true)

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(rolesApi.create).toHaveBeenCalledWith({
      nombre: 'supervisor',
      descripcion: 'Supervisa',
    })
    expect(rolesApi.setPermisos).toHaveBeenCalledWith(9, [1, 2])
    expect(wrapper.text()).toContain('2 permisos')
  })

  it('protege el nombre de los roles base al editar y permite ajustar permisos', async () => {
    rolesApi.setPermisos.mockResolvedValue({
      id: 1,
      nombre: 'admin',
      permisos: [
        { id: 1, nombre: 'facturas_view' },
        { id: 2, nombre: 'estadisticas_view' },
      ],
    })

    const wrapper = mount(RolesView)
    await flushPromises()

    await wrapper.find('[data-test="edit"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="field-nombre"]').attributes('disabled')).toBeDefined()
    await wrapper.find('[data-test="rol-perm-estadisticas_view"]').setValue(true)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(rolesApi.update).not.toHaveBeenCalled()
    expect(rolesApi.setPermisos).toHaveBeenCalledWith(1, [1, 2])
  })

  it('oculta activar/desactivar en roles base y lo permite en roles personalizados', async () => {
    rolesApi.cambiarEstado.mockResolvedValue({ id: 5, nombre: 'auditor', estado: false })

    const wrapper = mount(RolesView)
    await flushPromises()

    // Solo 'auditor' tiene botón toggle-estado ('admin' es rol base).
    const botones = wrapper.findAll('[data-test="toggle-estado"]')
    expect(botones).toHaveLength(1)
    expect(botones[0].text()).toContain('Desactivar')

    await botones[0].trigger('click')
    await flushPromises()

    expect(rolesApi.cambiarEstado).toHaveBeenCalledWith(5, false)
    expect(wrapper.text()).toContain('Inactivo')
  })
})
