import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'

import FacturaForm from '../src/components/FacturaForm.vue'
import FacturaEncabezado from '../src/components/facturas/FacturaEncabezado.vue'
import FacturaLineas from '../src/components/facturas/FacturaLineas.vue'
import {
  campoLineaValido,
  emptyLinea,
  esFechaValida,
  mensajeServidor,
  validarFormulario,
} from '../src/utils/facturaCampos'

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8')

describe('Test 52 — FacturaForm modular: encabezado, líneas y validación', () => {
  it('el formulario delega y deja de contener la validación completa', () => {
    const vista = leer('../src/components/facturas/FacturaForm.vue')

    expect(vista).toContain('useFacturaForm')
    expect(vista).toContain('FacturaEncabezado')
    expect(vista).toContain('FacturaLineas')
    expect(vista).not.toContain('function validar()')
    expect(vista).toContain('@media (max-width: 700px)')
    expect(vista.split('\n').length).toBeLessThan(260)
  })

  it('el composable concentra el estado, las líneas y el envío', () => {
    const codigo = leer('../src/composables/useFacturaForm.js')

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
    expect(lineas[0].cantidad).toBe(2)
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
