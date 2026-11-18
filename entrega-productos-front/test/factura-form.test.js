import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FacturaForm from '../src/components/FacturaForm.vue'

const clientes = [{ id: 3, nombre: 'Juan Pérez' }]
const bodegas = [{ id: 1, nombre: 'Bodega Central' }]
const tipos = [
  { id: 5, nombre: 'Alimentos' },
  { id: 6, nombre: 'Bebidas' },
]

const mountForm = (props = {}) =>
  mount(FacturaForm, { props: { open: true, clientes, bodegas, tipos, ...props } })

async function llenarEncabezado(wrapper) {
  await wrapper.find('[data-test="field-cliente_id"]').setValue('3')
  await wrapper.find('[data-test="field-bodega_id"]').setValue('1')
}

describe('Test 23 — FacturaForm (líneas y validaciones)', () => {
  it('arranca con una línea y valores iniciales del contrato', () => {
    const wrapper = mountForm()

    expect(wrapper.findAll('[data-test="linea"]')).toHaveLength(1)
    expect(wrapper.find('[data-test="linea-cantidad-0"]').element.value).toBe('1')
    expect(wrapper.find('[data-test="linea-precio_unitario-0"]').element.value).toBe('0')
    expect(wrapper.find('[data-test="linea-descuento_porcentaje-0"]').element.value).toBe('0')
    expect(wrapper.find('[data-test="linea-iva_porcentaje-0"]').element.value).toBe('19')
    expect(wrapper.find('[data-test="remove-linea"]').attributes('disabled')).toBeDefined()
  })

  it('agrega y quita líneas', async () => {
    const wrapper = mountForm()

    await wrapper.find('[data-test="add-linea"]').trigger('click')
    expect(wrapper.findAll('[data-test="linea"]')).toHaveLength(2)

    await wrapper.findAll('[data-test="remove-linea"]')[0].trigger('click')
    expect(wrapper.findAll('[data-test="linea"]')).toHaveLength(1)
  })

  it('al elegir un tipo precarga la descripción y se puede editar', async () => {
    const wrapper = mountForm()

    await wrapper.find('[data-test="linea-tipo_id-0"]').setValue('5')
    expect(wrapper.find('[data-test="linea-descripcion-0"]').element.value).toBe('Alimentos')

    await wrapper.find('[data-test="linea-descripcion-0"]').setValue('Arroz 500 g')
    expect(wrapper.find('[data-test="linea-descripcion-0"]').element.value).toBe('Arroz 500 g')
  })

  it('pide fecha de vencimiento cuando es crédito', async () => {
    const wrapper = mountForm()
    expect(wrapper.find('[data-test="field-fecha_vencimiento"]').exists()).toBe(false)

    await llenarEncabezado(wrapper)
    await wrapper.find('[data-test="field-forma_pago"]').setValue('credito')

    expect(wrapper.find('[data-test="field-fecha_vencimiento"]').exists()).toBe(true)
    await wrapper.find('form').trigger('submit')
    expect(wrapper.find('[data-test="form-error"]').text()).toBe(
      'La fecha de vencimiento es obligatoria con crédito.',
    )
  })

  it('rechaza cantidad 0', async () => {
    const wrapper = mountForm()
    await llenarEncabezado(wrapper)
    await wrapper.find('[data-test="linea-cantidad-0"]').setValue('0')

    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('[data-test="form-error"]').text()).toBe(
      'La línea 1 debe tener cantidad mayor a 0.',
    )
  })

  it('rechaza descuento fuera de rango e IVA no permitido', async () => {
    const wrapper = mountForm()
    await llenarEncabezado(wrapper)

    await wrapper.find('[data-test="linea-descuento_porcentaje-0"]').setValue('120')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.find('[data-test="form-error"]').text()).toContain('entre 0 y 100')

    await wrapper.find('[data-test="linea-descuento_porcentaje-0"]').setValue('10')
    await wrapper.find('[data-test="linea-iva_porcentaje-0"]').setValue('7')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.find('[data-test="form-error"]').text()).toContain('0, 5 o 19')
  })

  it('emite el payload exacto del contrato', async () => {
    const wrapper = mountForm()
    await llenarEncabezado(wrapper)
    await wrapper.find('[data-test="linea-tipo_id-0"]').setValue('5')
    await wrapper.find('[data-test="linea-descripcion-0"]').setValue('Arroz 500 g')
    await wrapper.find('[data-test="linea-cantidad-0"]').setValue('10')
    await wrapper.find('[data-test="linea-precio_unitario-0"]').setValue('3500')
    await wrapper.find('[data-test="linea-iva_porcentaje-0"]').setValue('5')
    await wrapper.find('[data-test="field-observaciones"]').setValue('  Entregar en portería  ')

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')[0][0]).toEqual({
      cliente_id: 3,
      bodega_id: 1,
      forma_pago: 'contado',
      medio_pago: 'transferencia',
      fecha_vencimiento: null,
      observaciones: 'Entregar en portería',
      detalle: [
        {
          tipo_id: 5,
          descripcion: 'Arroz 500 g',
          cantidad: 10,
          precio_unitario: 3500,
          descuento_porcentaje: 0,
          iva_porcentaje: 5,
        },
      ],
    })
  })

  it('envía tipo_id null cuando no se elige tipo', async () => {
    const wrapper = mountForm()
    await llenarEncabezado(wrapper)
    await wrapper.find('[data-test="linea-descripcion-0"]').setValue('Producto genérico')

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')[0][0].detalle[0].tipo_id).toBeNull()
  })
})
