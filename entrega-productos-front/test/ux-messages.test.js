import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))
const api = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push }),
}))
vi.mock('../src/modules/catalogos/api/tipos', () => ({ default: api }))

import DataTable from '../src/shared/ui/DataTable.vue'
import LoginView from '../src/modules/auth/views/LoginView.vue'
import TiposView from '../src/modules/catalogos/views/TiposView.vue'
import { useAuthStore } from '../src/modules/auth/store/auth'

describe('Test 31 — Mensajes claros para el usuario', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    push.mockClear()
    vi.clearAllMocks()
    api.list.mockResolvedValue({
      data: [{ id: 1, nombre: 'Alimentos' }],
      total: 1,
      page: 1,
      limit: 10,
    })
  })

  it('el botón de ingreso queda deshabilitado y dice qué falta', async () => {
    const wrapper = mount(LoginView)
    const boton = wrapper.find('button[type="submit"]')

    expect(boton.element.disabled).toBe(true)
    expect(boton.attributes('title')).toBe('Completa correo y contraseña para continuar.')
    expect(wrapper.text()).toContain('Completa correo y contraseña para continuar.')

    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('#error-correo').text()).toBe('El correo es obligatorio.')
    expect(wrapper.find('#error-contrasena').text()).toBe('La contraseña es obligatoria.')
    expect(useAuthStore().isAuthenticated).toBe(false)
    expect(push).not.toHaveBeenCalled()
  })

  it('indica cuál campo está mal y no habilita el ingreso', async () => {
    const wrapper = mount(LoginView)

    await wrapper.find('input[type="email"]').setValue('correo-mal')
    await wrapper.find('input[type="password"]').setValue('1234')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('#error-correo').text()).toContain('correo válido')
    expect(wrapper.find('#error-contrasena').text()).toContain('al menos 8 caracteres')
    expect(wrapper.find('input[type="email"]').attributes('aria-invalid')).toBe('true')
    expect(wrapper.find('input[type="password"]').attributes('aria-invalid')).toBe('true')
    expect(wrapper.find('button[type="submit"]').element.disabled).toBe(true)
  })

  it('los atajos demo llenan los campos y habilitan el botón', async () => {
    const wrapper = mount(LoginView)

    await wrapper.findAll('.demo-accounts__btn')[0].trigger('click')

    expect(wrapper.find('input[type="email"]').element.value).toBe('admin@entrega.com')
    expect(wrapper.find('button[type="submit"]').element.disabled).toBe(false)
    expect(wrapper.find('button[type="submit"]').attributes('title')).toBeUndefined()
    expect(wrapper.find('.field-error').exists()).toBe(false)
  })

  it('la tabla permite un texto de creación concreto y avisa cuando está vacía', () => {
    const props = { columns: [{ key: 'nombre', label: 'Nombre' }], rows: [] }
    const generica = mount(DataTable, { props })
    const concreta = mount(DataTable, { props: { ...props, createLabel: 'Nueva bodega' } })

    expect(generica.find('[data-test="create"]').text()).toBe('Nuevo')
    expect(concreta.find('[data-test="create"]').text()).toBe('Nueva bodega')
    expect(concreta.text()).toContain('Sin resultados')
  })

  it('Tipos usa títulos, botones y avisos concretos', async () => {
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })

    const wrapper = mount(TiposView)
    await flushPromises()

    expect(wrapper.find('h1').text()).toBe('Tipos de producto')
    expect(wrapper.find('.badge').text()).toBe('Catálogo')
    expect(wrapper.find('[data-test="create"]').text()).toBe('Nuevo producto')

    await wrapper.find('[data-test="delete"]').trigger('click')

    expect(wrapper.find('[data-test="confirm-delete"]').text()).toContain(
      'no se puede deshacer',
    )

    await wrapper.find('[data-test="cancel"]').trigger('click')
    await wrapper.find('[data-test="create"]').trigger('click')

    expect(wrapper.find('[data-test="submit"]').text()).toBe('Crear producto')
  })
})
