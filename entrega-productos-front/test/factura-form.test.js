import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FacturaForm from '../src/modules/facturas/components/FacturaForm.vue'

const clientes = [{ id: 3, nombre: 'Juan Pérez' }]
const bodegas = [{ id: 1, nombre: 'Bodega Central' }]
const tipos = [
  { id: 5, nombre: 'Alimentos' },
  { id: 6, nombre: 'Bebidas' },
]

const mountForm = (props = {}) =>
  mount(FacturaForm, { props: { open: true, clientes, bodegas, tipos, ...props } })

async function llenarEncabezado(wrapper, formaPago = 'contado') {
  await wrapper.find('[data-test="field-cliente_id"]').trigger('focus')
  await wrapper.find('[data-test="cliente-opcion-0"]').trigger('mousedown')
  await wrapper.find('[data-test="field-bodega_id"]').setValue('1')
  await wrapper.find('[data-test="field-forma_pago"]').setValue(formaPago)
  await wrapper.find('[data-test="field-medio_pago"]').setValue('transferencia')
}

async function completarFecha(wrapper) {
  await wrapper.find('[data-test="field-fecha_vencimiento"]').setValue('2026-12-31')
}

async function llenarLinea(wrapper) {
  await wrapper.find('[data-test="linea-tipo_id-0"]').setValue('5')
  await wrapper.find('[data-test="linea-descripcion-0"]').setValue('Arroz 500 g')
  await wrapper.find('[data-test="linea-unidad_medida-0"]').setValue('UND')
  await wrapper.find('[data-test="linea-cantidad-0"]').setValue('10')
  await wrapper.find('[data-test="linea-precio_unitario-0"]').setValue('3500')
  await wrapper.find('[data-test="linea-descuento_porcentaje-0"]').setValue('0')
  await wrapper.find('[data-test="linea-iva_porcentaje-0"]').setValue('5')
}

describe('Test 23 — FacturaForm (líneas y validaciones)', () => {
  it('arranca con una línea y todos los datos vacíos, salvo observaciones', () => {
    const wrapper = mountForm()

    expect(wrapper.findAll('[data-test="linea"]')).toHaveLength(1)
    expect(wrapper.text()).toContain('Producto *')
    expect(wrapper.find('.linea__tipo input').attributes('placeholder')).toBe('Busca un producto…')
    expect(wrapper.find('[data-test="field-forma_pago"]').element.value).toBe('')
    expect(wrapper.find('[data-test="field-medio_pago"]').element.value).toBe('')
    expect(wrapper.find('[data-test="field-fecha_vencimiento"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="linea-cantidad-0"]').element.value).toBe('')
    expect(wrapper.find('[data-test="linea-precio_unitario-0"]').element.value).toBe('')
    expect(wrapper.find('[data-test="linea-descuento_porcentaje-0"]').element.value).toBe('')
    expect(wrapper.find('[data-test="linea-iva_porcentaje-0"]').element.value).toBe('')
    expect(wrapper.find('[data-test="field-observaciones"]').element.value).toBe('')
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

  it('oculta la fecha con contado y solo la pide con crédito', async () => {
    const wrapper = mountForm()
    expect(wrapper.find('[data-test="field-fecha_vencimiento"]').exists()).toBe(false)

    await llenarEncabezado(wrapper)
    expect(wrapper.find('[data-test="field-fecha_vencimiento"]').exists()).toBe(false)

    await wrapper.find('[data-test="field-forma_pago"]').setValue('credito')
    expect(wrapper.find('[data-test="field-fecha_vencimiento"]').exists()).toBe(true)

    await wrapper.find('form').trigger('submit')
    expect(wrapper.find('[data-test="error-fecha_vencimiento"]').text()).toBe(
      'Escribe la fecha límite.',
    )
    expect(wrapper.find('[data-test="form-error"]').exists()).toBe(false)
  })

  it('mantiene deshabilitado el guardar hasta completar los obligatorios', async () => {
    const wrapper = mountForm()

    expect(wrapper.find('[data-test="submit"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-test="form-hint"]').text()).toBe(
      'Completa los campos marcados para guardar.',
    )

    await llenarEncabezado(wrapper)
    await llenarLinea(wrapper)

    expect(wrapper.find('[data-test="submit"]').attributes('disabled')).toBeUndefined()
  })

  it('avisa debajo del campo apenas se deja vacío o mal escrito', async () => {
    const wrapper = mountForm()
    await llenarEncabezado(wrapper)

    await wrapper.find('[data-test="linea-cantidad-0"]').setValue('2')
    expect(wrapper.find('[data-test="error-linea-0-cantidad"]').exists()).toBe(false)

    await wrapper.find('[data-test="linea-cantidad-0"]').setValue('')
    expect(wrapper.find('[data-test="error-linea-0-cantidad"]').text()).toBe('Escribe la cantidad.')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('rechaza cantidad 0 con un mensaje que dice qué dato revisar', async () => {
    const wrapper = mountForm()
    await llenarEncabezado(wrapper)
    await wrapper.find('[data-test="linea-cantidad-0"]').setValue('0')

    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('[data-test="error-linea-0-cantidad"]').text()).toBe('Cantidad mayor que 0.')
  })

  it('solo deja escribir dígitos y un punto en cantidad, precio y descuento', async () => {
    const wrapper = mountForm()

    await wrapper.find('[data-test="linea-cantidad-0"]').setValue('10.555')
    await wrapper.find('[data-test="linea-precio_unitario-0"]').setValue('-5')
    await wrapper.find('[data-test="linea-descuento_porcentaje-0"]').setValue('1a0')

    expect(wrapper.find('[data-test="linea-cantidad-0"]').element.value).toBe('10.55')
    expect(wrapper.find('[data-test="linea-precio_unitario-0"]').element.value).toBe('5')
    expect(wrapper.find('[data-test="linea-descuento_porcentaje-0"]').element.value).toBe('10')

    // La letra se bloquea ANTES de aparecer; el punto y los dígitos pasan.
    const cantidad = wrapper.find('[data-test="linea-cantidad-0"]')
    const letra = new KeyboardEvent('keydown', { key: 'a', cancelable: true })
    cantidad.element.dispatchEvent(letra)
    expect(letra.defaultPrevented).toBe(true)

    const punto = new KeyboardEvent('keydown', { key: '.', cancelable: true })
    cantidad.element.dispatchEvent(punto)
    expect(punto.defaultPrevented).toBe(false)

    const digito = new KeyboardEvent('keydown', { key: '7', cancelable: true })
    cantidad.element.dispatchEvent(digito)
    expect(digito.defaultPrevented).toBe(false)
  })

  it('rechaza descuento fuera de rango e IVA no permitido', async () => {
    const wrapper = mountForm()
    await llenarEncabezado(wrapper)

    await wrapper.find('[data-test="linea-descuento_porcentaje-0"]').setValue('120')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.find('[data-test="error-linea-0-descuento_porcentaje"]').text()).toBe(
      'Descuento 0 a 100.',
    )

    await wrapper.find('[data-test="linea-descuento_porcentaje-0"]').setValue('10')
    await wrapper.find('[data-test="linea-iva_porcentaje-0"]').setValue('')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.find('[data-test="error-linea-0-iva_porcentaje"]').text()).toBe('Elige el IVA.')
  })

  it('emite el payload completo del contrato', async () => {
    const wrapper = mountForm()
    await llenarEncabezado(wrapper, 'credito')
    await completarFecha(wrapper)
    await llenarLinea(wrapper)
    await wrapper.find('[data-test="field-observaciones"]').setValue('  Entregar en portería  ')

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')[0][0]).toEqual({
      cliente_id: 3,
      bodega_id: 1,
      forma_pago: 'credito',
      medio_pago: 'transferencia',
      fecha_vencimiento: '2026-12-31',
      observaciones: 'Entregar en portería',
      detalle: [
        {
          tipo_id: 5,
          descripcion: 'Arroz 500 g',
          unidad_medida: 'UND',
          cantidad: 10,
          precio_unitario: 3500,
          descuento_porcentaje: 0,
          iva_porcentaje: 5,
        },
      ],
    })
  })

  it('envía fecha_vencimiento null cuando es contado', async () => {
    const wrapper = mountForm()
    await llenarEncabezado(wrapper)
    await llenarLinea(wrapper)

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')[0][0].fecha_vencimiento).toBeNull()
    expect(wrapper.find('[data-test="field-fecha_vencimiento"]').exists()).toBe(false)
  })

  it('no emite nada si falta el tipo de producto', async () => {
    const wrapper = mountForm()
    await llenarEncabezado(wrapper)
    await wrapper.find('[data-test="linea-descripcion-0"]').setValue('Producto genérico')
    await wrapper.find('[data-test="linea-unidad_medida-0"]').setValue('UND')
    await wrapper.find('[data-test="linea-cantidad-0"]').setValue('1')
    await wrapper.find('[data-test="linea-precio_unitario-0"]').setValue('100')
    await wrapper.find('[data-test="linea-descuento_porcentaje-0"]').setValue('0')
    await wrapper.find('[data-test="linea-iva_porcentaje-0"]').setValue('19')

    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('[data-test="error-linea-0-tipo"]').text()).toBe('Elige el producto.')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })
})
