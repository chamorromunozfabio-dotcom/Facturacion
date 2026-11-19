import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const api = vi.hoisted(() => ({
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  entregar: vi.fn(),
  aceptar: vi.fn(),
  rechazar: vi.fn(),
  recibir: vi.fn(),
  descargarPdf: vi.fn(),
}))

vi.mock('../src/api/facturas', async () => {
  const actual = await vi.importActual('../src/api/facturas')
  return { ...actual, default: api }
})
vi.mock('../src/api/usuarios', () => ({ default: { list: vi.fn().mockResolvedValue({ data: [] }) } }))
vi.mock('../src/api/bodegas', () => ({ default: { list: vi.fn().mockResolvedValue({ data: [] }) } }))
vi.mock('../src/api/tipos', () => ({ default: { list: vi.fn().mockResolvedValue({ data: [] }) } }))
vi.mock('../src/api/axios', () => ({
  default: {},
  getErrorMessage: vi.fn((error) => error?.message || 'Error'),
  isDuplicateError: vi.fn(() => false),
}))

import FacturaForm from '../src/components/FacturaForm.vue'
import FacturaView from '../src/views/FacturaView.vue'
import { useAuthStore } from '../src/stores/auth'

const mountForm = () =>
  mount(FacturaForm, {
    props: {
      open: true,
      clientes: [{ id: 3, nombre: 'Juan Pérez' }],
      bodegas: [{ id: 1, nombre: 'Bodega Central' }],
      tipos: [{ id: 5, nombre: 'Alimentos' }],
    },
  })

async function completarFormulario(wrapper) {
  await wrapper.find('[data-test="field-cliente_id"]').setValue('3')
  await wrapper.find('[data-test="field-bodega_id"]').setValue('1')
  await wrapper.find('[data-test="field-forma_pago"]').setValue('credito')
  await wrapper.find('[data-test="field-medio_pago"]').setValue('efectivo')
  await wrapper.find('[data-test="field-fecha_vencimiento"]').setValue('2026-12-31')
  await wrapper.find('[data-test="linea-tipo_id-0"]').setValue('5')
  await wrapper.find('[data-test="linea-descripcion-0"]').setValue('Arroz 500 g')
  await wrapper.find('[data-test="linea-unidad_medida-0"]').setValue('UND')
  await wrapper.find('[data-test="linea-cantidad-0"]').setValue('10')
  await wrapper.find('[data-test="linea-precio_unitario-0"]').setValue('3500')
  await wrapper.find('[data-test="linea-descuento_porcentaje-0"]').setValue('0')
  await wrapper.find('[data-test="linea-iva_porcentaje-0"]').setValue('19')
}

describe('Test 37 — Facturas: mensajes descriptivos y alerta visible', () => {
  it('dice exactamente qué dato falta en la cabecera', async () => {
    const wrapper = mountForm()

    expect(wrapper.find('[data-test="field-fecha_vencimiento"]').exists()).toBe(false)

    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('[data-test="error-cliente_id"]').text()).toContain(
      'Falta seleccionar el cliente: elige quién recibe la factura.',
    )
    expect(wrapper.find('[data-test="error-bodega_id"]').text()).toContain(
      'Falta seleccionar la bodega: elige desde dónde se despacha.',
    )
    expect(wrapper.find('[data-test="error-forma_pago"]').text()).toContain(
      'Falta seleccionar la forma de pago: elige contado o crédito.',
    )
    expect(wrapper.find('[data-test="error-medio_pago"]').text()).toContain(
      'Falta seleccionar el medio de pago: elige efectivo, transferencia o tarjeta.',
    )
    expect(wrapper.find('[data-test="form-error"]').text()).toContain('Faltan 11 dato(s)')
  })

  it('nombra el dato y la línea en cada campo del producto', async () => {
    const wrapper = mountForm()

    await wrapper.find('form').trigger('submit')

    const mensajes = {
      tipo: 'Falta el tipo de producto en la línea 1: selecciona un tipo de la lista.',
      descripcion:
        'Falta la descripción del producto en la línea 1: escribe qué producto se está entregando.',
      unidad_medida:
        'Falta la unidad de medida en la línea 1: escribe UND, KG, CAJA u otra unidad.',
      cantidad:
        'Falta la cantidad en la línea 1: escribe cuántas unidades se entregan (mayor que 0).',
      precio_unitario:
        'Falta el precio unitario en la línea 1: escribe el precio de una unidad sin IVA (puede ser 0).',
      descuento_porcentaje:
        'Falta el descuento porcentual en la línea 1: escribe 0 si no hay descuento.',
      iva_porcentaje: 'Falta el IVA en la línea 1: selecciona 0, 5 o 19.',
    }

    for (const [campo, mensaje] of Object.entries(mensajes)) {
      const texto = wrapper.find(`[data-test="error-linea-0-${campo}"]`).text()
      expect(texto).toBe(mensaje)
      expect(texto).toContain('en la línea 1')
      expect(texto).not.toBe('Falta la línea 1')
    }
  })

  it('el mensaje cambia si el dato está escrito pero es inválido', async () => {
    const wrapper = mountForm()

    await wrapper.find('[data-test="linea-cantidad-0"]').setValue('0')
    await wrapper.find('[data-test="linea-precio_unitario-0"]').setValue('-5')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('[data-test="error-linea-0-cantidad"]').text()).toBe(
      'La cantidad de la línea 1 debe ser mayor que 0: revisa el valor escrito.',
    )
    expect(wrapper.find('[data-test="error-linea-0-precio_unitario"]').text()).toBe(
      'El precio unitario de la línea 1 no puede ser negativo: revisa el valor escrito.',
    )
  })

  it('permite guardar con observaciones vacía porque es el único dato opcional', async () => {
    const wrapper = mountForm()

    await completarFormulario(wrapper)
    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('[data-test="form-error"]').exists()).toBe(false)
    const payload = wrapper.emitted('submit')[0][0]
    expect(payload.observaciones).toBeNull()
    expect(payload.detalle[0].unidad_medida).toBe('UND')
  })

  it('muestra la alerta flotante por encima del modal', async () => {
    localStorage.clear()
    setActivePinia(createPinia())
    useAuthStore().saveSession('token-123', { nombre: 'Ana', rol: 'admin' })
    api.list.mockRejectedValue(new Error('Fallo de red'))

    const wrapper = mount(FacturaView)
    await flushPromises()

    const flotante = wrapper.find('[data-test="alert-flotante"]')
    expect(flotante.exists()).toBe(true)
    expect(flotante.find('[role="alert"]').text()).toContain('Fallo de red')

    const codigo = readFileSync(resolve(process.cwd(), 'src/views/FacturaView.vue'), 'utf8')
    expect(codigo).toContain('alert-flotante')
    expect(codigo).toContain('z-index: 100')
  })
})
