import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const api = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))

const empresas = vi.hoisted(() => ({
  listActivas: vi.fn(),
}))

vi.mock('../src/modules/catalogos/api/bodegas', () => ({ default: api }))
vi.mock('../src/modules/empresas/api/empresas', () => ({ default: empresas }))

import BodegasView from '../src/modules/catalogos/views/BodegasView.vue'
import { useAuthStore } from '../src/modules/auth/store/auth'

describe('Test 14 — BodegasView (CRUD con componentes)', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })
    vi.clearAllMocks()
    api.list.mockResolvedValue({
      data: [
        {
          id: 1,
          nombre: 'Bodega Central',
          direccion: 'Calle Principal 123',
          ciudad: 'Bogotá',
          telefono: '3001234567',
          recibe_nombre: 'María Rodríguez',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    })
    api.create.mockResolvedValue({ id: 2, nombre: 'Bodega Norte', direccion: null })
    api.remove.mockResolvedValue({ detail: 'Eliminado' })
    empresas.listActivas.mockResolvedValue({
      data: [{ id: 1, razon_social: 'Distribuidora Andina S.A.S.' }],
    })
  })

  it('carga y muestra nombre y ciudad', async () => {
    const wrapper = mount(BodegasView)
    await flushPromises()

    expect(wrapper.text()).toContain('Bodega Central')
    expect(wrapper.text()).toContain('Bogotá')
    expect(api.list).toHaveBeenCalledWith({ q: '', page: 1, limit: 10 })
  })

  it('abre el modal con los campos de bodega', async () => {
    const wrapper = mount(BodegasView)
    await flushPromises()

    await wrapper.find('[data-test="create"]').trigger('click')

    expect(wrapper.find('[data-test="field-nombre"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="field-direccion"]').exists()).toBe(true)
    expect(wrapper.find('h2').text()).toBe('Nueva bodega')
  })

  const completa = {
    nombre: 'Bodega Norte',
    codigo: 'BN-01',
    direccion: 'Av. Sur 45',
    ciudad: 'Cali',
    departamento: 'Valle',
    telefono: '3001234567',
    correo: 'norte@entrega.com',
    empresa_id: 1,
    recibe_nombre: 'Carlos Pérez',
    recibe_documento: '1020304051',
    recibe_cargo: 'Jefe de bodega',
    recibe_telefono: '3109876544',
  }

  async function llenarTodo(wrapper, valores = completa) {
    await wrapper.find('[data-test="create"]').trigger('click')
    for (const [key, value] of Object.entries(valores)) {
      await wrapper.find(`[data-test="field-${key}"]`).setValue(value)
    }
  }

  it('crea una bodega con dirección', async () => {
    const wrapper = mount(BodegasView)
    await flushPromises()
    await llenarTodo(wrapper)

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(api.create).toHaveBeenCalledWith(completa)
    expect(wrapper.text()).toContain('Bodega creada.')
  })

  it('no permite crear sin dirección', async () => {
    const wrapper = mount(BodegasView)
    await flushPromises()
    const incompleta = { ...completa }
    delete incompleta.direccion
    await llenarTodo(wrapper, incompleta)

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[data-test="error-direccion"]').text()).toBe('Escribe dirección.')
    expect(api.create).not.toHaveBeenCalled()
  })

  it('pide confirmación antes de eliminar', async () => {
    const wrapper = mount(BodegasView)
    await flushPromises()

    await wrapper.find('[data-test="delete"]').trigger('click')
    expect(wrapper.find('[data-test="confirm-delete"]').exists()).toBe(true)

    await wrapper.find('[data-test="confirm"]').trigger('click')
    await flushPromises()

    expect(api.remove).toHaveBeenCalledWith(1)
  })

  it('recarga los bodegueros al cambiar la empresa dentro del formulario', async () => {
    const usuarios = await import('../src/modules/catalogos/api/usuarios')
    const spyUsuarios = vi.spyOn(usuarios.default, 'list').mockResolvedValue({
      data: [{ id: 10, nombre: 'Pedro Bodeguero' }],
    })
    empresas.listActivas.mockResolvedValue({
      data: [
        { id: 1, razon_social: 'Distribuidora Andina S.A.S.' },
        { id: 2, razon_social: 'Comercializadora Caribe' },
      ],
    })

    const wrapper = mount(BodegasView)
    await flushPromises()

    await wrapper.find('[data-test="create"]').trigger('click')
    await flushPromises()

    await wrapper.find('[data-test="field-empresa_id"]').setValue('2')
    await flushPromises()

    expect(spyUsuarios).toHaveBeenLastCalledWith({
      rol: 'bodeguero',
      page: 1,
      limit: 100,
      empresa_id: '2',
    })
    spyUsuarios.mockRestore()
  })

  it('el rol empresa puede elegir bodeguero dueño sin mostrar selector de empresa', async () => {
    useAuthStore().saveSession('token-emp', {
      nombre: 'Distribuidora Andina',
      rol: 'empresa',
      empresa: { id: 1, razon_social: 'Distribuidora Andina S.A.S.', estado: 'activa' },
    })
    const usuarios = await import('../src/modules/catalogos/api/usuarios')
    const spyUsuarios = vi.spyOn(usuarios.default, 'list').mockResolvedValue({
      data: [{ id: 10, nombre: 'Pedro Bodeguero' }],
    })

    const wrapper = mount(BodegasView)
    await flushPromises()

    await wrapper.find('[data-test="create"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="field-empresa_id"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="field-bodeguero_id"]').exists()).toBe(true)
    expect(spyUsuarios).toHaveBeenCalledWith({ rol: 'bodeguero', page: 1, limit: 100 })
    spyUsuarios.mockRestore()
  })

  it('la empresa tiene el CRUD completo de sus bodegueros en la pestaña Mis bodegueros', async () => {
    useAuthStore().saveSession('token-emp', {
      nombre: 'Distribuidora Andina',
      rol: 'empresa',
      empresa: { id: 1, razon_social: 'Distribuidora Andina S.A.S.', estado: 'activa' },
    })
    const usuarios = await import('../src/modules/catalogos/api/usuarios')
    const spyList = vi.spyOn(usuarios.default, 'list').mockResolvedValue({
      data: [
        {
          id: 25,
          nombre: 'Pedro Bodeguero',
          correo: 'bodega2@andina.com',
          numero_documento: '10203040',
          telefono: '3009998877',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    })
    const spyCreate = vi
      .spyOn(usuarios.default, 'create')
      .mockResolvedValue({ id: 26, nombre: 'Laura Bodega', correo: 'laura@andina.com' })

    const wrapper = mount(BodegasView)
    await flushPromises()

    await wrapper.find('[data-test="tab-bodegueros"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Mis bodegueros')
    expect(wrapper.text()).toContain('Pedro Bodeguero')

    await wrapper.find('[data-test="create"]').trigger('click')
    await wrapper.find('[data-test="field-nombre"]').setValue('Laura Bodega')
    await wrapper.find('[data-test="field-correo"]').setValue('laura@andina.com')
    await wrapper.find('[data-test="field-contrasena"]').setValue('Bodega123*')
    await wrapper.find('[data-test="field-numero_documento"]').setValue('99887766')
    await wrapper.find('[data-test="field-telefono"]').setValue('3001112233')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(spyCreate).toHaveBeenCalledWith({
      nombre: 'Laura Bodega',
      correo: 'laura@andina.com',
      contrasena: 'Bodega123*',
      numero_documento: '99887766',
      telefono: '3001112233',
    })
    spyList.mockRestore()
    spyCreate.mockRestore()
  })

  it('al asignar bodeguero encargado oculta los campos redundantes y los envía al guardar', async () => {
    useAuthStore().saveSession('token-emp', {
      nombre: 'Distribuidora Andina',
      rol: 'empresa',
      empresa: { id: 1, razon_social: 'Distribuidora Andina S.A.S.', estado: 'activa' },
    })
    const usuarios = await import('../src/modules/catalogos/api/usuarios')
    const spyList = vi.spyOn(usuarios.default, 'list').mockResolvedValue({
      data: [
        {
          id: 10,
          nombre: 'Pedro Bodeguero',
          numero_documento: '10203040',
          telefono: '3009998877',
        },
      ],
    })

    const wrapper = mount(BodegasView)
    await flushPromises()

    await wrapper.find('[data-test="create"]').trigger('click')
    await flushPromises()

    await wrapper.find('[data-test="field-bodeguero_id"]').setValue('10')
    await flushPromises()

    expect(wrapper.find('[data-test="field-recibe_nombre"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="field-recibe_documento"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="field-recibe_cargo"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="field-recibe_telefono"]').exists()).toBe(false)

    await wrapper.find('[data-test="field-nombre"]').setValue('Bodega Sur')
    await wrapper.find('[data-test="field-codigo"]').setValue('BS-01')
    await wrapper.find('[data-test="field-direccion"]').setValue('Kr 25 # 10-20')
    await wrapper.find('[data-test="field-ciudad"]').setValue('Bogotá')
    await wrapper.find('[data-test="field-departamento"]').setValue('Cundinamarca')
    await wrapper.find('[data-test="field-telefono"]').setValue('3001234567')
    await wrapper.find('[data-test="field-correo"]').setValue('sur@andina.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(api.create).toHaveBeenCalledWith(
      expect.objectContaining({
        bodeguero_id: 10,
        recibe_nombre: 'Pedro Bodeguero',
        recibe_documento: '10203040',
        recibe_cargo: 'Bodeguero',
        recibe_telefono: '3009998877',
      }),
    )
    spyList.mockRestore()
  })
})
