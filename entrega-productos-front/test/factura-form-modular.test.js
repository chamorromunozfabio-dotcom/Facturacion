import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'

import FacturaForm from '../src/modules/facturas/components/FacturaForm.vue'
import FacturaEncabezado from '../src/modules/facturas/components/FacturaEncabezado.vue'
import FacturaLineas from '../src/modules/facturas/components/FacturaLineas.vue'
import {
  campoLineaValido,
  emptyLinea,
  esFechaValida,
  mensajeServidor,
  sanitizarDecimal,
  validarFormulario,
} from '../src/modules/facturas/utils/facturaCampos'

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8')

describe('Test 52 — FacturaForm modular: encabezado, líneas y validación', () => {
  it('el formulario delega y deja de contener la validación completa', () => {
    const vista = leer('../src/modules/facturas/components/FacturaForm.vue')

    expect(vista).toContain('useFacturaForm')
    expect(vista).toContain('FacturaEncabezado')
    expect(vista).toContain('FacturaLineas')
    expect(vista).toContain('ModalBase')
    expect(vista).toContain('test-id="factura-form"')
    expect(vista).not.toContain('<Transition')
    expect(vista).not.toContain('function validar()')
    expect(vista).toContain('@media (max-width: 700px)')
    expect(vista.split('\n').length).toBeLessThan(260)
  })

  it('el composable concentra el estado, las líneas y el envío', () => {
    const codigo = leer('../src/modules/facturas/composables/useFacturaForm.js')

    for (const nombre of ['tiposDisponibles', 'addLinea', 'removeLinea', 'validar', 'handleSubmit']) {
      expect(codigo).toContain(nombre)
    }
  })

  it('las reglas puras de validación viven en utils', () => {
    expect(esFechaValida('2026-12-31')).toBe(true)
    expect(esFechaValida('2026-02-29')).toBe(false)
    expect(campoLineaValido('tipo', { tipo_id: '5' })).toBe(true)
    expect(campoLineaValido('tipo', { tipo_id: '' })).toBe(false)
    expect(mensajeServidor('detalle[0].tipo_id')).toBe('Elige el producto.')

    // Solo números: el descuento también se limita a 2 decimales.
    expect(campoLineaValido('descuento_porcentaje', { descuento_porcentaje: '10.55' })).toBe(true)
    expect(campoLineaValido('descuento_porcentaje', { descuento_porcentaje: '10.555' })).toBe(false)
    expect(campoLineaValido('iva_porcentaje', { iva_porcentaje: '19' })).toBe(true)
    expect(campoLineaValido('iva_porcentaje', { iva_porcentaje: '0,5' })).toBe(false)
    expect(campoLineaValido('cantidad', { cantidad: '1.5' })).toBe(true)
    expect(campoLineaValido('cantidad', { cantidad: '1.555' })).toBe(false)

    // El filtro de escritura descarta lo que no va en un campo numérico.
    expect(sanitizarDecimal('12.345')).toBe('12.34')
    expect(sanitizarDecimal('-5')).toBe('5')
    expect(sanitizarDecimal('1a0')).toBe('10')
    expect(sanitizarDecimal('10.5.5')).toBe('10.55')
    expect(sanitizarDecimal('abc')).toBe('')

    const errores = validarFormulario(
      {
        cliente_id: '',
        bodega_id: '',
        forma_pago: '',
        medio_pago: '',
        fecha_vencimiento: '',
        observaciones: '',
        detalle: [emptyLinea()],
      },
      false,
    )

    expect(errores.cliente_id).toBe('Elige el cliente.')
    expect(errores['linea_0_tipo']).toBe('Elige el producto.')
    expect(errores['linea_0_cantidad']).toBe('Escribe la cantidad.')

    const conDescuentoLargo = validarFormulario(
      {
        cliente_id: '3',
        bodega_id: '1',
        forma_pago: 'contado',
        medio_pago: 'efectivo',
        fecha_vencimiento: '',
        observaciones: '',
        detalle: [
          {
            ...emptyLinea(),
            tipo_id: '5',
            descripcion: 'Arroz',
            unidad_medida: 'kg',
            cantidad: '1',
            precio_unitario: '1000',
            descuento_porcentaje: '10.555',
            iva_porcentaje: '19',
          },
        ],
      },
      false,
    )

    expect(conDescuentoLargo['linea_0_descuento_porcentaje']).toBe('Hasta 2 decimales.')
    expect(conDescuentoLargo['linea_0_cantidad']).toBeUndefined()
  })

  it('el encabezado edita el modelo y avisa de cada campo tocado', async () => {
    const form = {
      cliente_id: '',
      bodega_id: '',
      forma_pago: '',
      medio_pago: '',
      fecha_vencimiento: '',
      observaciones: '',
    }
    const wrapper = mount(FacturaEncabezado, {
      props: {
        form,
        errores: {},
        clientes: [{ id: 3, nombre: 'Juan Pérez' }],
        bodegas: [{ id: 1, nombre: 'Bodega Central' }],
        esCredito: false,
      },
    })

    expect(wrapper.find('[data-test="field-cliente_id"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="field-fecha_vencimiento"]').exists()).toBe(false)

    await wrapper.find('[data-test="field-cliente_id"]').setValue('3')

    expect(form.cliente_id).toBe(3)
    expect(wrapper.emitted('marcar')).toContainEqual(['cliente_id'])
  })

  it('las líneas emiten agregar, quitar y marcar sin perder el modelo', async () => {
    const lineas = [emptyLinea(), emptyLinea()]
    const wrapper = mount(FacturaLineas, {
      props: {
        lineas,
        errores: {},
        tiposDisponibles: [{ id: 5, nombre: 'Alimentos' }],
        tieneTipo: true,
        bodegaId: 1,
        ivas: [0, 5, 19],
      },
    })

    expect(wrapper.text()).toContain('Producto *')
    expect(wrapper.find('.linea__tipo input').attributes('placeholder')).toBe('Busca un producto…')
    expect(wrapper.findAll('[data-test="linea"]')).toHaveLength(2)

    await wrapper.find('[data-test="add-linea"]').trigger('click')
    await wrapper.find('[data-test="remove-linea"]').trigger('click')
    await wrapper.find('[data-test="linea-cantidad-0"]').setValue('2')

    expect(wrapper.emitted('add')).toHaveLength(1)
    expect(wrapper.emitted('remove')[0][0]).toBe(0)
    expect(lineas[0].cantidad).toBe('2')
    expect(wrapper.emitted('marcar')).toContainEqual(['linea_0_cantidad'])
  })

  it('FacturaForm sigue mostrando el diálogo accesible', () => {
    const wrapper = mount(FacturaForm, {
      props: {
        open: true,
        clientes: [{ id: 3, nombre: 'Juan Pérez' }],
        bodegas: [{ id: 1, nombre: 'Bodega Central' }],
        tipos: [{ id: 5, nombre: 'Alimentos' }],
      },
    })

    expect(wrapper.find('[data-test="factura-form"]').exists()).toBe(true)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="close-x"]').exists()).toBe(true)
  })
})
