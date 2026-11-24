import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const roles = vi.hoisted(() => ({ list: vi.fn() }))
const usuarios = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('../src/modules/catalogos/api/roles', () => ({ default: roles }))
vi.mock('../src/modules/catalogos/api/usuarios', () => ({ default: usuarios }))

import UsuariosView from '../src/modules/catalogos/views/UsuariosView.vue'
import { useAuthStore } from '../src/modules/auth/store/auth'

const ROLES_INICIALES = [
  { id: 1, nombre: 'admin', estado: true },
  { id: 2, nombre: 'bodeguero', estado: true },
  { id: 3, nombre: 'cliente', estado: true },
]

describe('Test 42 — Roles nuevos del backend disponibles para asignar a usuarios', () => {
  let rolesEnBackend

  async function abrirNuevoUsuario(wrapper) {
    await wrapper.find('[data-test="create"]').trigger('click')
    await flushPromises()
  }

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })

    rolesEnBackend = [...ROLES_INICIALES]
    roles.list.mockImplementation(async () => ({
      data: [...rolesEnBackend],
      total: rolesEnBackend.length,
      page: 1,
      limit: 100,
    }))
    usuarios.list.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 })
    usuarios.create.mockResolvedValue({ id: 9, nombre: 'Supervisor' })
    usuarios.update.mockResolvedValue({ id: 9, nombre: 'Supervisor' })
  })

  it('trae los roles del backend en vez de usar una lista fija', async () => {
    rolesEnBackend.push({ id: 8, nombre: 'supervisor', estado: true })
    const wrapper = mount(UsuariosView)
    await flushPromises()

    expect(roles.list).toHaveBeenCalledWith({ page: 1, limit: 100 })
    await abrirNuevoUsuario(wrapper)
    const opciones = wrapper.findAll('[data-test="field-rol_id"] option').map((op) => ({
      value: op.attributes('value'),
      texto: op.text(),
    }))
    expect(opciones).toContainEqual({ value: '8', texto: 'supervisor' })
  })

  it('el filtro por rol también incluye los roles nuevos', async () => {
    rolesEnBackend.push({ id: 8, nombre: 'supervisor', estado: true })
    const wrapper = mount(UsuariosView)
    await flushPromises()

    expect(wrapper.find('[data-test="role-filter-option-8"]').exists()).toBe(true)
    await wrapper.find('[data-test="role-filter"]').setValue('supervisor')
    await new Promise((resolve) => setTimeout(resolve, 320))
    await flushPromises()

    expect(usuarios.list).toHaveBeenCalledWith({
      q: '',
      page: 1,
      limit: 10,
      rol: 'supervisor',
    })
  })

  it('crea un usuario con el id del rol nuevo que vino del backend', async () => {
    rolesEnBackend.push({ id: 8, nombre: 'supervisor', estado: true })
    const wrapper = mount(UsuariosView)
    await flushPromises()
    await abrirNuevoUsuario(wrapper)

    await wrapper.find('[data-test="field-nombre"]').setValue('Supervisor')
    await wrapper.find('[data-test="field-correo"]').setValue('supervisor@entrega.com')
    await wrapper.find('[data-test="field-contrasena"]').setValue('Clave123*')
    await wrapper.find('[data-test="field-rol_id"]').setValue('8')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(usuarios.create).toHaveBeenCalledWith({
      nombre: 'Supervisor',
      correo: 'supervisor@entrega.com',
      contrasena: 'Clave123*',
      rol_id: 8,
    })
    expect(wrapper.text()).toContain('Usuario creado.')
  })

  it('actualiza el selector si el rol se creó después de abrir la pantalla', async () => {
    const wrapper = mount(UsuariosView)
    await flushPromises()
    await abrirNuevoUsuario(wrapper)
    expect(wrapper.findAll('[data-test="field-rol_id"] option').map((op) => op.text())).not.toContain(
      'auditor',
    )

    // Simulamos que el admin creó el rol en otra pestaña y vuelve a abrir el formulario.
    rolesEnBackend.push({ id: 8, nombre: 'auditor', estado: true })
    await wrapper.find('[data-test="cancel"]').trigger('click')
    await abrirNuevoUsuario(wrapper)

    expect(wrapper.findAll('[data-test="field-rol_id"] option').map((op) => op.text())).toContain(
      'auditor',
    )
  })

  it('edita un usuario que solo trae el nombre del rol nuevo', async () => {
    rolesEnBackend.push({ id: 8, nombre: 'supervisor', estado: true })
    usuarios.list.mockResolvedValue({
      data: [
        {
          id: 4,
          nombre: 'Sonia',
          correo: 'sonia@entrega.com',
          rol: 'supervisor',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    })
    const wrapper = mount(UsuariosView)
    await flushPromises()

    await wrapper.find('[data-test="edit"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-test="field-rol_id"]').element.value).toBe('8')
  })

  it('si el backend no responde, siguen disponibles los tres roles clásicos', async () => {
    roles.list.mockRejectedValue(new Error('sin conexión'))
    const wrapper = mount(UsuariosView)
    await flushPromises()
    await abrirNuevoUsuario(wrapper)

    expect(
      wrapper.findAll('[data-test="field-rol_id"] option').map((op) => op.text()),
    ).toEqual(['admin', 'bodeguero', 'cliente'])
  })
})
