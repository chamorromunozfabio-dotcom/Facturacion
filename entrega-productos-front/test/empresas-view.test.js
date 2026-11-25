import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const api = vi.hoisted(() => ({
  list: vi.fn(),
  cambiarEstado: vi.fn(),
}))

vi.mock('../src/modules/empresas/api/empresas', () => ({ default: api }))

import EmpresasView from '../src/modules/empresas/views/EmpresasView.vue'

const pendiente = {
  id: 2,
  razon_social: 'Comercializadora del Caribe S.A.S.',
  nit: '900987654-2',
  correo: 'contacto@caribe.com',
  estado: 'pendiente',
  motivo_rechazo: null,
  fecha_registro: '2026-11-20T14:30:00',
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

  it('lista las empresas con su estado y sin botón de crear', async () => {
    const wrapper = mount(EmpresasView)
    await flushPromises()

    expect(api.list).toHaveBeenCalledWith({ q: '', page: 1, limit: 10 })
    expect(wrapper.text()).toContain('Comercializadora del Caribe S.A.S.')
    expect(wrapper.text()).toContain('Distribuidora Andina S.A.S.')
    expect(wrapper.text()).toContain('Logística Nacional S.A.S.')
    expect(wrapper.findAll('.status-badge')).toHaveLength(3)
    expect(wrapper.find('[data-test="create"]').exists()).toBe(false)
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
})
