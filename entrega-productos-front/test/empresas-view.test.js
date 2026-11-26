import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const api = vi.hoisted(() => ({
  list: vi.fn(),
  cambiarEstado: vi.fn(),
  remove: vi.fn(),
}))

const registerApi = vi.hoisted(() => ({
  registrar: vi.fn(),
}))

vi.mock('../src/modules/empresas/api/empresas', () => ({ default: api }))
vi.mock('../src/modules/auth/api/register', () => registerApi)

import EmpresasView from '../src/modules/empresas/views/EmpresasView.vue'

const pendiente = {
  id: 2,
  razon_social: 'Comercializadora del Caribe S.A.S.',
  nit: '900987654-2',
  correo: 'contacto@caribe.com',
  telefono: '3009998877',
  direccion: 'Calle 84 # 45-20',
  representante: 'Carlos Mendoza',
  estado: 'pendiente',
  motivo_rechazo: null,
  fecha_registro: '2026-11-20T14:30:00',
  total_bodegueros: 0,
  total_bodegas: 0,
  total_facturas: 0,
}
const activa = {
  id: 1,
  razon_social: 'Distribuidora Andina S.A.S.',
  nit: '900123456-1',
  correo: 'empresa@entrega.com',
  estado: 'activa',
  motivo_rechazo: null,
  fecha_registro: '2026-11-10T09:00:00',
}
const suspendida = {
  id: 4,
  razon_social: 'Logística Nacional S.A.S.',
  nit: '900444555-6',
  correo: 'operaciones@logisticanacional.com',
  estado: 'suspendida',
  motivo_rechazo: null,
  fecha_registro: '2026-10-05T08:00:00',
}

function esperarDebounce() {
  return new Promise((resolve) => setTimeout(resolve, 350))
}

describe('Test 70 — Módulo Empresas (solo admin)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.list.mockResolvedValue({
      data: [pendiente, activa, suspendida],
      total: 3,
      page: 1,
      limit: 10,
    })
    api.cambiarEstado.mockImplementation((id, payload) => ({
      ...(id === pendiente.id ? pendiente : id === activa.id ? activa : suspendida),
      ...payload,
    }))
  })

  it('lista las empresas con su estado y botón de nueva empresa', async () => {
    const wrapper = mount(EmpresasView)
    await flushPromises()

    expect(api.list).toHaveBeenCalledWith({ q: '', page: 1, limit: 10 })
    expect(wrapper.text()).toContain('Comercializadora del Caribe S.A.S.')
    expect(wrapper.text()).toContain('Distribuidora Andina S.A.S.')
    expect(wrapper.text()).toContain('Logística Nacional S.A.S.')
    expect(wrapper.findAll('.status-badge')).toHaveLength(3)
    expect(wrapper.find('[data-test="create"]').text()).toContain('Nueva empresa')
  })

  it('filtra por estado desde las pestañas', async () => {
    const wrapper = mount(EmpresasView)
    await flushPromises()

    await wrapper.find('[data-test="estado-pendiente"]').trigger('click')
    await esperarDebounce()
    await flushPromises()

    expect(api.list).toHaveBeenLastCalledWith({
      q: '',
      page: 1,
      limit: 10,
      estado: 'pendiente',
    })
  })

  it('busca con debounce de 300 ms', async () => {
    const wrapper = mount(EmpresasView)
    await flushPromises()

    await wrapper.find('[data-test="search"]').setValue('andina')
    expect(api.list).toHaveBeenCalledTimes(1)

    await esperarDebounce()
    await flushPromises()

    expect(api.list).toHaveBeenLastCalledWith({ q: 'andina', page: 1, limit: 10 })
  })

  it('aprueba una empresa pendiente', async () => {
    const wrapper = mount(EmpresasView)
    await flushPromises()

    await wrapper.find('[data-test="aprobar"]').trigger('click')
    await flushPromises()

    expect(api.cambiarEstado).toHaveBeenCalledWith(2, { estado: 'activa' })
    expect(wrapper.text()).toContain('fue aprobada y ya puede ingresar')
    expect(wrapper.find('[data-test="suspender"]').exists()).toBe(true)
  })

  it('exige un motivo de mínimo 10 caracteres para rechazar', async () => {
    const wrapper = mount(EmpresasView)
    await flushPromises()

    await wrapper.find('[data-test="rechazar"]').trigger('click')

    const modal = wrapper.find('[data-test="empresa-rechazo-modal"]')
    expect(modal.exists()).toBe(true)
    expect(wrapper.find('[data-test="motivo-rechazo"]').attributes('maxlength')).toBe('255')

    const confirmar = wrapper.find('[data-test="rechazo-confirm"]')
    expect(confirmar.attributes('disabled')).toBeDefined()

    await wrapper.find('[data-test="motivo-rechazo"]').setValue('corto')
    expect(confirmar.attributes('disabled')).toBeDefined()

    await wrapper.find('[data-test="motivo-rechazo"]').setValue('a'.repeat(256))
    expect(confirmar.attributes('disabled')).toBeDefined()

    await wrapper.find('[data-test="motivo-rechazo"]').setValue('El NIT no coincide.')
    expect(confirmar.attributes('disabled')).toBeUndefined()

    await confirmar.trigger('click')
    await flushPromises()

    expect(api.cambiarEstado).toHaveBeenCalledWith(2, {
      estado: 'rechazada',
      motivo_rechazo: 'El NIT no coincide.',
    })
    expect(wrapper.text()).toContain('fue rechazada')
  })

  it('suspende una empresa activa y reactiva una suspendida', async () => {
    const wrapper = mount(EmpresasView)
    await flushPromises()

    await wrapper.find('[data-test="suspender"]').trigger('click')
    await flushPromises()

    expect(api.cambiarEstado).toHaveBeenCalledWith(1, { estado: 'suspendida' })
    expect(wrapper.text()).toContain('quedó suspendida')

    // La fila 4 ya estaba suspendida; después de suspender la 1 hay dos botones.
    const reactivar = wrapper.findAll('[data-test="reactivar"]')
    await reactivar[reactivar.length - 1].trigger('click')
    await flushPromises()

    expect(api.cambiarEstado).toHaveBeenCalledWith(4, { estado: 'activa' })
    expect(wrapper.text()).toContain('fue reactivada')
  })

  it('muestra la ficha completa de la empresa antes de aprobarla', async () => {
    const wrapper = mount(EmpresasView)
    await flushPromises()

    await wrapper.find('[data-test="ver-detalle"]').trigger('click')

    const detalle = wrapper.find('[data-test="empresa-detalle-modal"]')
    expect(detalle.exists()).toBe(true)
    expect(detalle.text()).toContain('Carlos Mendoza')
    expect(detalle.text()).toContain('3009998877')
    expect(detalle.text()).toContain('Calle 84 # 45-20')
    expect(detalle.text()).toContain('900987654-2')

    await detalle.find('[data-test="detalle-aprobar"]').trigger('click')
    await flushPromises()

    expect(api.cambiarEstado).toHaveBeenCalledWith(2, { estado: 'activa' })
  })

  it('el admin puede crear y activar una nueva empresa desde Empresas', async () => {
    registerApi.registrar.mockResolvedValueOnce({
      empresa: { id: 10, razon_social: 'Andina Nueva S.A.S.', estado: 'pendiente' },
    })

    const wrapper = mount(EmpresasView)
    await flushPromises()

    await wrapper.find('[data-test="create"]').trigger('click')
    const modal = wrapper.find('[data-test="empresa-crear-modal"]')
    expect(modal.exists()).toBe(true)

    await modal.find('[data-test="empresa-field-razon_social"]').setValue('Andina Nueva S.A.S.')
    await modal.find('[data-test="empresa-field-nit"]').setValue('900555666-1')
    await modal.find('[data-test="empresa-field-telefono"]').setValue('3001112233')
    await modal.find('[data-test="empresa-field-direccion"]').setValue('Calle 50 # 10-20')
    await modal.find('[data-test="empresa-field-representante"]').setValue('Laura Ríos')
    await modal.find('[data-test="empresa-field-correo"]').setValue('laura@andinanueva.com')
    await modal.find('[data-test="empresa-field-contrasena"]').setValue('Empresa123*')
    await modal.find('[data-test="empresa-field-confirmar"]').setValue('Empresa123*')

    await modal.find('form').trigger('submit')
    await flushPromises()

    expect(registerApi.registrar).toHaveBeenCalledWith({
      tipo: 'empresa',
      razon_social: 'Andina Nueva S.A.S.',
      nit: '900555666-1',
      telefono: '3001112233',
      direccion: 'Calle 50 # 10-20',
      representante: 'Laura Ríos',
      correo: 'laura@andinanueva.com',
      contrasena: 'Empresa123*',
    })
    expect(api.cambiarEstado).toHaveBeenCalledWith(10, { estado: 'activa' })
    expect(wrapper.text()).toContain('fue creada y activada')
  })

  it('permite eliminar una empresa sin facturas mostrando bodegueros y bodegas a borrar', async () => {
    api.list.mockResolvedValueOnce({
      data: [
        { ...pendiente, total_bodegueros: 2, total_bodegas: 1, total_facturas: 0 },
        { ...activa, total_bodegueros: 1, total_bodegas: 1, total_facturas: 4 },
      ],
      total: 2,
      page: 1,
      limit: 10,
    })
    api.remove.mockResolvedValueOnce({})

    const wrapper = mount(EmpresasView)
    await flushPromises()

    // Solo la empresa sin facturas muestra el botón Eliminar.
    expect(wrapper.findAll('[data-test="eliminar-empresa"]')).toHaveLength(1)

    await wrapper.find('[data-test="eliminar-empresa"]').trigger('click')
    const confirm = wrapper.find('[data-test="confirm-delete"]')
    expect(confirm.exists()).toBe(true)
    expect(confirm.text()).toContain('2 bodegueros y 1 bodegas')

    await wrapper.find('[data-test="confirm"]').trigger('click')
    await flushPromises()

    expect(api.remove).toHaveBeenCalledWith(2)
    expect(wrapper.text()).toContain('fue eliminada definitivamente')
  })
})
