import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FacturaDetail from '../src/modules/facturas/components/FacturaDetail.vue'

const base = {
  id: 1,
  numero: 'FE-0001',
  estado: 'firmada',
  fecha_emision: '2026-11-18T10:30:00',
  fecha_vencimiento: null,
  forma_pago: 'contado',
  medio_pago: 'transferencia',
  moneda: 'COP',
  emisor: { razon_social: 'Entrega S.A.S.', nit: '900123456-1', direccion: 'Calle 1', telefono: '3000000000', correo: 'fact@entrega.com' },
  adquiriente: { id: 3, nombre: 'Juan Pérez', tipo_documento: 'CC', numero_documento: '1020304050', direccion: 'Calle 10', telefono: '3001234567', correo: 'juan@cliente.com' },
  bodega: { id: 1, nombre: 'Bodega Central', recibe_nombre: 'María Rodríguez' },
  detalle: [
    { linea: 1, descripcion: 'Arroz 500 g', cantidad: 10, precio_unitario: 3500, descuento_porcentaje: 0, iva_porcentaje: 5, total_linea: 36750 },
  ],
  totales: { subtotal: 35000, total_descuento: 0, base_gravable: 35000, total_iva: 1750, total: 36750 },
  observaciones: 'Entregar en portería',
  validacion_electronica: { cufe: '', qr: '', fecha_validacion: '' },
  software: { nombre: 'Entrega de Productos', version: '1.0.0', fabricante: '' },
  trazabilidad: {
    creada_por: 'Ana Pérez',
    fecha_entrega: '2026-11-18T11:00:00',
    fecha_respuesta: null,
    motivo_rechazo: null,
    firma: 'data:image/png;base64,YWJj',
    fecha_recepcion: null,
  },
}

describe('Test 22 — FacturaDetail (detalle completo)', () => {
  it('muestra número, estado, cliente, bodega y líneas', () => {
    const wrapper = mount(FacturaDetail, { props: { factura: base } })

    expect(wrapper.find('[data-test="detail-numero"]').text()).toBe('FE-0001')
    expect(wrapper.find('[data-test="detail-estado"]').text()).toBe('firmada')
    expect(wrapper.find('[data-test="detail-cliente"]').text()).toBe('Juan Pérez')
    expect(wrapper.text()).toContain('Bodega Central')
    expect(wrapper.findAll('[data-test="detail-linea"]')).toHaveLength(1)
    expect(wrapper.text()).toContain('Arroz 500 g')
  })

  it('muestra los totales y las observaciones', () => {
    const wrapper = mount(FacturaDetail, { props: { factura: base } })

    expect(wrapper.text()).toContain('Entregar en portería')
    expect(wrapper.text()).toContain('Total:')
    expect(wrapper.text()).toContain('IVA:')
  })

  it('muestra la firma guardada en trazabilidad', () => {
    const wrapper = mount(FacturaDetail, { props: { factura: base } })

    expect(wrapper.find('[data-test="detail-firma"]').attributes('src')).toBe(
      'data:image/png;base64,YWJj',
    )
  })

  it('muestra el motivo cuando la factura fue rechazada', () => {
    const rechazada = {
      ...base,
      estado: 'rechazada',
      trazabilidad: { ...base.trazabilidad, firma: null, motivo_rechazo: 'Cantidad incorrecta' },
    }
    const wrapper = mount(FacturaDetail, { props: { factura: rechazada } })

    expect(wrapper.find('[data-test="motivo-rechazo"]').text()).toContain('Cantidad incorrecta')
    expect(wrapper.find('[data-test="detail-firma"]').exists()).toBe(false)
  })

  it('oculta la validación electrónica cuando está vacía', () => {
    const wrapper = mount(FacturaDetail, { props: { factura: base } })

    expect(wrapper.text()).not.toContain('CUFE:')
  })
})
