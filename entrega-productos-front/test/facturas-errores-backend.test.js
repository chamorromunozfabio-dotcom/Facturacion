import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const api = vi.hoisted(() => ({
  list: vi.fn(),
  listClientes: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('../src/api/facturas', async () => {
  const actual = await vi.importActual('../src/api/facturas')
  return { ...actual, default: api }
})
vi.mock('../src/api/usuarios', () => ({ default: { list: vi.fn().mockResolvedValue({ data: [] }) } }))
vi.mock('../src/api/bodegas', () => ({
  default: { list: vi.fn().mockResolvedValue({ data: [{ id: 1, nombre: 'Bodega Central' }] }) },
}))
vi.mock('../src/api/tipos', () => ({
  default: { list: vi.fn().mockResolvedValue({ data: [{ id: 5, nombre: 'Alimentos' }] }) },
}))

import { getFieldErrors } from '../src/api/axios'
import FacturaForm from '../src/components/FacturaForm.vue'
import FacturaView from '../src/views/FacturaView.vue'
import { useAuthStore } from '../src/stores/auth'

const error422 = {
  response: {
    status: 422,
    data: {
      detail: 'cliente_id: es obligatorio; detalle[0].descripcion: es obligatorio',
      errores: {
        cliente_id: 'es obligatorio',
        'detalle[0].descripcion': 'es obligatorio',
        'detalle[0].cantidad': 'debe ser mayor que 0',
        general: 'El cuerpo de la petición no es un JSON válido',
      },
    },
  },
}

const mountForm = (serverErrors = {}) =>
  mount(FacturaForm, {
    props: {
      open: true,
      clientes: [{ id: 3, nombre: 'Juan Pérez' }],
      bodegas: [{ id: 1, nombre: 'Bodega Central' }],
      tipos: [{ id: 5, nombre: 'Alimentos' }],
      serverErrors,
    },
  })

async function completarFormulario(wrapper) {
  await wrapper.find('[data-test="field-cliente_id"]').setValue('3')
  await wrapper.find('[data-test="field-bodega_id"]').setValue('1')
  await wrapper.find('[data-test="field-forma_pago"]').setValue('credito')
  await wrapper.find('[data-test="field-medio_pago"]').setValue('transferencia')
  await wrapper.find('[data-test="field-fecha_vencimiento"]').setValue('2026-12-31')
  await wrapper.find('[data-test="linea-tipo_id-0"]').setValue('5')
  await wrapper.find('[data-test="linea-descripcion-0"]').setValue('Arroz 500 g')
  await wrapper.find('[data-test="linea-unidad_medida-0"]').setValue('UND')
  await wrapper.find('[data-test="linea-cantidad-0"]').setValue('10')
  await wrapper.find('[data-test="linea-precio_unitario-0"]').setValue('3500')
  await wrapper.find('[data-test="linea-descuento_porcentaje-0"]').setValue('0')
  await wrapper.find('[data-test="linea-iva_porcentaje-0"]').setValue('19')
}

describe('Test 38 — Errores 422 del backend en el formulario', () => {
  it('lee el objeto errores sin romper el detail de texto', () => {
    expect(getFieldErrors(error422)).toEqual({
      cliente_id: 'es obligatorio',
      'detalle[0].descripcion': 'es obligatorio',
      'detalle[0].cantidad': 'debe ser mayor que 0',
      general: 'El cuerpo de la petición no es un JSON válido',
    })
    expect(getFieldErrors(new Error('Fallo de red'))).toEqual({})
  })

  it('convierte las claves del backend en mensajes amigables junto al campo', () => {
    const wrapper = mountForm(error422.response.data.errores)

    expect(wrapper.find('[data-test="error-cliente_id"]').text()).toBe(
      'Revisa el cliente: es obligatorio.',
    )
    expect(wrapper.find('[data-test="error-linea-0-descripcion"]').text()).toBe(
      'Revisa la descripción del producto de la línea 1: es obligatorio.',
    )
    expect(wrapper.find('[data-test="error-linea-0-cantidad"]').text()).toBe(
      'Revisa la cantidad de la línea 1: debe ser mayor que 0.',
    )
    expect(wrapper.find('[data-test="form-error"]').text()).toContain(
      'Revisa el cuerpo de la factura: El cuerpo de la petición no es un JSON válido.',
    )
  })

  it('mantiene el modal abierto y pinta los errores si el backend rechaza el guardado', async () => {
    localStorage.clear()
    setActivePinia(createPinia())
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })
    api.list.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 })
    api.listClientes.mockResolvedValue({ data: [{ id: 3, nombre: 'Juan Pérez' }] })
    api.create.mockRejectedValue(error422)

    const wrapper = mount(FacturaView)
    await flushPromises()

    await wrapper.find('[data-test="create"]').trigger('click')
    await flushPromises()
    await completarFormulario(wrapper)
    await wrapper.find('[data-test="factura-form"] form').trigger('submit')
    await flushPromises()

    expect(api.create).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[data-test="factura-form"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="error-cliente_id"]').text()).toBe(
      'Revisa el cliente: es obligatorio.',
    )
    expect(wrapper.find('[data-test="alert-flotante"] [role="alert"]').text()).toContain(
      'cliente_id: es obligatorio',
    )
  })
})
