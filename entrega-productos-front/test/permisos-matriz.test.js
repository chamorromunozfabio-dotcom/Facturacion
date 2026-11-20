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

import {
  CATALOGO_PERMISOS,
  MODULOS_PERMISO,
  claveDelNombreBackend,
} from '../src/config/permissions'
import PermisosView from '../src/views/PermisosView.vue'
import { useAuthStore } from '../src/stores/auth'

const USUARIOS = [
  { id: 1, nombre: 'Ana', correo: 'ana@entrega.com', rol: 'admin', rol_id: 1 },
  { id: 5, nombre: 'Juan', correo: 'juan@cliente.com', rol: 'cliente', rol_id: 3 },
  { id: 6, nombre: 'María', correo: 'maria@cliente.com', rol: 'cliente', rol_id: 3 },
]

const catalogoBackend = () =>
  CATALOGO_PERMISOS.map((permiso, index) => ({ id: index + 1, nombre: permiso.nombre }))

describe('Test 40 — Permisos por usuario con buscador y tarjetas de funciones', () => {
  let permisosPorUsuario

  async function buscar(wrapper, texto) {
    await wrapper.find('[data-test="user-search"]').setValue(texto)
    await flushPromises()
  }

  async function consultar(wrapper, id) {
    const usuario = USUARIOS.find((item) => item.id === id)
    await buscar(wrapper, usuario.nombre)
    await wrapper.find(`[data-test="usuario-${id}"]`).trigger('click')
    await flushPromises()
  }

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
      data: USUARIOS,
      total: USUARIOS.length,
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

  it('no muestra la lista completa y filtra por nombre, correo o rol', async () => {
    const wrapper = mount(PermisosView)
    await flushPromises()

    expect(wrapper.find('[data-test="user-search"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="assignment-user"]').exists()).toBe(false)

    await buscar(wrapper, 'juan')
    expect(wrapper.findAll('[data-test^="usuario-"]')).toHaveLength(1)
    expect(wrapper.find('[data-test="usuario-5"]').exists()).toBe(true)

    await buscar(wrapper, 'cliente.com')
    expect(wrapper.findAll('[data-test^="usuario-"]')).toHaveLength(2)

    await buscar(wrapper, 'cliente')
    expect(wrapper.findAll('[data-test^="usuario-"]')).toHaveLength(2)

    await buscar(wrapper, 'zzz')
    expect(wrapper.find('[data-test="sin-resultados"]').exists()).toBe(true)
  })

  it('ignora los acentos al buscar', async () => {
    const wrapper = mount(PermisosView)
    await flushPromises()

    await buscar(wrapper, 'maria')
    expect(wrapper.find('[data-test="usuario-6"]').exists()).toBe(true)
  })

  it('los permisos aparecen recién después de consultar un usuario', async () => {
    const wrapper = mount(PermisosView)
    await flushPromises()

    expect(wrapper.find('[data-test="permisos-panel"]').exists()).toBe(false)
    await buscar(wrapper, 'Ana')
    expect(wrapper.find('[data-test="permisos-panel"]').exists()).toBe(false)

    await wrapper.find('[data-test="usuario-1"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="permisos-panel"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="assignment-affected"]').text()).toContain('Ana')
  })

  it('muestra una tarjeta por módulo con sus funciones y el total de checks', async () => {
    const wrapper = mount(PermisosView)
    await flushPromises()
    await consultar(wrapper, 1)

    const titulos = wrapper
      .findAll('[data-test^="columna-"]')
      .map((nodo) => nodo.find('h4').text())
    expect(titulos).toEqual(MODULOS_PERMISO.map((modulo) => modulo.etiqueta))
    expect(wrapper.findAll('[data-test^="modulo-"]')).toHaveLength(MODULOS_PERMISO.length)
    expect(
      wrapper.findAll('[data-test="matriz-permisos"] input[type="checkbox"]'),
    ).toHaveLength(CATALOGO_PERMISOS.length)
    expect(wrapper.findAll('[data-test="modulo-facturas"] input[type="checkbox"]')).toHaveLength(9)
    expect(wrapper.findAll('[data-test="modulo-usuarios"] input[type="checkbox"]')).toHaveLength(4)
    expect(wrapper.find('[data-test="check-facturas:pdf"]').attributes('aria-label')).toContain(
      'Descargar PDF',
    )
    expect(wrapper.find('[data-test="check-usuarios:entregar"]').exists()).toBe(false)
  })

  it('no hay opción para crear, nombrar, editar ni borrar permisos', async () => {
    const wrapper = mount(PermisosView)
    await flushPromises()

    expect(wrapper.find('[data-test="create"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="field-nombre"]').exists()).toBe(false)
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Nuevo permiso')
    expect(permisos.create).not.toHaveBeenCalled()
    expect(permisos.update).not.toHaveBeenCalled()
    expect(permisos.remove).not.toHaveBeenCalled()
  })

  it('el check aparece tildado solo si el usuario ya tiene el permiso', async () => {
    permisosPorUsuario.set(1, [{ id: 1, nombre: 'facturas_view' }])
    const wrapper = mount(PermisosView)
    await flushPromises()
    await consultar(wrapper, 1)

    const dado = wrapper.find('[data-test="check-facturas:view"]')
    expect(dado.element.checked).toBe(true)
    expect(dado.attributes('aria-label')).toContain('(ya lo tiene)')

    const noDado = wrapper.find('[data-test="check-bodegas:create"]')
    expect(noDado.element.checked).toBe(false)
    expect(noDado.attributes('aria-label')).not.toContain('(ya lo tiene)')
  })

  it('dar un permiso a un cliente no se lo da a los demás clientes', async () => {
    const wrapper = mount(PermisosView)
    await flushPromises()
    await consultar(wrapper, 5)

    await wrapper.find('[data-test="check-facturas:aceptar"]').setValue(true)
    await flushPromises()

    expect(usuarios.addPermiso).not.toHaveBeenCalled()
    expect(wrapper.find('[data-test="permisos-actuales"]').text()).toContain(
      'Facturación — Aceptar',
    )
    expect(wrapper.find('[data-test="confirmar-bar"]').text()).toContain('1 cambio listo')

    await wrapper.find('[data-test="confirmar-permisos"]').trigger('click')
    await flushPromises()

    expect(usuarios.addPermiso).toHaveBeenCalledWith(5, expect.any(Number))
    expect(wrapper.find('[data-test="permisos-actuales"]').text()).toContain(
      'Facturación — Aceptar',
    )

    await wrapper.find('[data-test="usuario-5"]').trigger('click')
    expect(wrapper.find('[data-test="usuario-5"]').attributes('aria-pressed')).toBe('true')
    await buscar(wrapper, 'María')
    await wrapper.find('[data-test="usuario-6"]').trigger('click')
    await flushPromises()

    expect(usuarios.listPermisos).toHaveBeenCalledWith(6)
    expect(wrapper.find('[data-test="permisos-actuales"]').text()).toContain(
      'todavía no tiene permisos',
    )
  })

  it('el rol es solo referencia: no se aplica su plantilla automáticamente', async () => {
    const wrapper = mount(PermisosView)
    await flushPromises()
    await consultar(wrapper, 5)

    expect(wrapper.find('[data-test="plantilla-rol"]').text()).toContain('permisos predefinidos')
    expect(wrapper.find('[data-test="permisos-actuales"]').text()).toContain(
      'todavía no tiene permisos',
    )
    expect(usuarios.addPermiso).not.toHaveBeenCalled()
  })

  it('la casilla Marcar todos prepara todos los cambios y luego los deshace', async () => {
    const wrapper = mount(PermisosView)
    await flushPromises()
    await consultar(wrapper, 5)
    const marcados = () =>
      wrapper
        .findAll('[data-test="matriz-permisos"] input[type="checkbox"]')
        .filter((check) => check.element.checked)

    expect(wrapper.find('[data-test="check-todos"]').element.checked).toBe(false)
    expect(marcados()).toHaveLength(0)

    await wrapper.find('[data-test="check-todos"]').setValue(true)
    await flushPromises()

    expect(wrapper.find('[data-test="check-todos"]').element.checked).toBe(true)
    expect(marcados()).toHaveLength(CATALOGO_PERMISOS.length)
    expect(wrapper.find('[data-test="confirmar-bar"]').text()).toContain(
      `${CATALOGO_PERMISOS.length} cambios listos`,
    )
    expect(usuarios.addPermiso).not.toHaveBeenCalled()

    await wrapper.find('[data-test="check-todos"]').setValue(false)
    await flushPromises()

    expect(wrapper.find('[data-test="check-todos"]').element.checked).toBe(false)
    expect(marcados()).toHaveLength(0)
    expect(wrapper.find('[data-test="confirmar-bar"]').exists()).toBe(false)
    expect(usuarios.addPermiso).not.toHaveBeenCalled()
  })

  it('Desmarcar todos quita los permisos guardados solo al confirmar', async () => {
    permisosPorUsuario.set(5, [
      { id: 1, nombre: 'facturas_view' },
      { id: 2, nombre: 'facturas_create' },
    ])
    const wrapper = mount(PermisosView)
    await flushPromises()
    await consultar(wrapper, 5)

    await wrapper.find('[data-test="desmarcar-todos"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="check-facturas:view"]').element.checked).toBe(false)
    expect(wrapper.find('[data-test="confirmar-bar"]').text()).toContain('2 cambios listos')
    expect(usuarios.removePermiso).not.toHaveBeenCalled()

    await wrapper.find('[data-test="confirmar-permisos"]').trigger('click')
    await flushPromises()

    expect(usuarios.removePermiso).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[data-test="permisos-actuales"]').text()).toContain(
      'todavía no tiene permisos',
    )
  })

  it('Por defecto del rol marca solo los permisos predefinidos', async () => {
    const wrapper = mount(PermisosView)
    await flushPromises()
    await consultar(wrapper, 5)

    await wrapper.find('[data-test="aplicar-rol"]').trigger('click')
    await flushPromises()

    // 4 permisos del cliente + estadisticas_view (el mock deriva el catálogo del código).
    expect(wrapper.find('[data-test="plantilla-rol"]').text()).toContain('5 permisos predefinidos')
    expect(wrapper.find('[data-test="check-facturas:view"]').element.checked).toBe(true)
    expect(wrapper.find('[data-test="check-facturas:aceptar"]').element.checked).toBe(true)
    expect(wrapper.find('[data-test="check-bodegas:view"]').element.checked).toBe(false)
    expect(wrapper.find('[data-test="confirmar-bar"]').text()).toContain('5 cambios listos')
    expect(usuarios.addPermiso).not.toHaveBeenCalled()

    await wrapper.find('[data-test="confirmar-permisos"]').trigger('click')
    await flushPromises()

    expect(usuarios.addPermiso).toHaveBeenCalledTimes(5)
    expect(wrapper.find('[data-test="confirmar-bar"]').exists()).toBe(false)
  })

  it('el mismo check prepara el alta y la baja, y cada Confirmar la aplica', async () => {
    permisosPorUsuario.set(1, [{ id: 1, nombre: 'facturas_view' }])
    const wrapper = mount(PermisosView)
    await flushPromises()
    await consultar(wrapper, 1)

    await wrapper.find('[data-test="check-facturas:create"]').setValue(true)
    await flushPromises()
    expect(usuarios.addPermiso).not.toHaveBeenCalled()
    expect(wrapper.find('[data-test="check-facturas:create"]').element.checked).toBe(true)

    await wrapper.find('[data-test="confirmar-permisos"]').trigger('click')
    await flushPromises()
    expect(usuarios.addPermiso).toHaveBeenCalledWith(1, 2)
    expect(wrapper.find('[data-test="confirmar-bar"]').exists()).toBe(false)

    await wrapper.find('[data-test="check-facturas:create"]').setValue(false)
    await flushPromises()
    expect(usuarios.removePermiso).not.toHaveBeenCalled()

    await wrapper.find('[data-test="confirmar-permisos"]').trigger('click')
    await flushPromises()
    expect(usuarios.removePermiso).toHaveBeenCalledWith(1, 2)
    expect(wrapper.find('[data-test="check-facturas:create"]').element.checked).toBe(false)
  })

  it('Confirmar aplica varios cambios a la vez y limpia la barra', async () => {
    const wrapper = mount(PermisosView)
    await flushPromises()
    await consultar(wrapper, 1)

    await wrapper.find('[data-test="check-facturas:create"]').setValue(true)
    await wrapper.find('[data-test="check-bodegas:create"]').setValue(true)
    await flushPromises()
    expect(wrapper.find('[data-test="confirmar-bar"]').text()).toContain('2 cambios listos')

    await wrapper.find('[data-test="confirmar-permisos"]').trigger('click')
    await flushPromises()

    expect(usuarios.addPermiso).toHaveBeenCalledTimes(2)
    expect(usuarios.removePermiso).not.toHaveBeenCalled()
    expect(wrapper.find('[data-test="confirmar-bar"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('2 cambios guardados en "Ana".')
  })

  it('Descartar devuelve los checks a su estado guardado sin llamar a la API', async () => {
    permisosPorUsuario.set(1, [{ id: 1, nombre: 'facturas_view' }])
    const wrapper = mount(PermisosView)
    await flushPromises()
    await consultar(wrapper, 1)

    await wrapper.find('[data-test="check-facturas:view"]').setValue(false)
    await wrapper.find('[data-test="check-facturas:create"]').setValue(true)
    await flushPromises()
    expect(wrapper.find('[data-test="confirmar-bar"]').exists()).toBe(true)

    await wrapper.find('[data-test="descartar-permisos"]').trigger('click')
    await flushPromises()

    expect(usuarios.addPermiso).not.toHaveBeenCalled()
    expect(usuarios.removePermiso).not.toHaveBeenCalled()
    expect(wrapper.find('[data-test="check-facturas:view"]').element.checked).toBe(true)
    expect(wrapper.find('[data-test="check-facturas:create"]').element.checked).toBe(false)
    expect(wrapper.find('[data-test="confirmar-bar"]').exists()).toBe(false)
  })

  it('marca como pendientes las funciones que faltan en la respuesta del backend', async () => {
    permisos.list.mockResolvedValue({
      data: [{ id: 6, nombre: 'usuarios_view' }],
      total: 1,
      page: 1,
      limit: 100,
    })
    const wrapper = mount(PermisosView)
    await flushPromises()
    await consultar(wrapper, 1)

    expect(wrapper.find('[data-test="permisos-pendientes"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="check-facturas:view"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-test="check-usuarios:view"]').attributes('disabled')).toBeUndefined()
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
    await consultar(wrapper, 1)

    expect(wrapper.find('[data-test="permisos-actuales"]').text()).toContain('Usuarios — Ver')
  })
})
