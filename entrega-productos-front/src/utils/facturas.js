/** Helpers puros del módulo de facturas. No usan Vue ni llaman a la API. */

export const ESTADOS = ['emitida', 'entregada', 'firmada', 'rechazada', 'recibida']

export const COLUMNAS = [
  { key: 'numero', label: 'Número' },
  { key: 'cliente_nombre', label: 'Cliente' },
  { key: 'estado', label: 'Estado' },
  { key: 'fecha_emision', label: 'Emisión' },
  { key: 'total', label: 'Total' },
]

export function estadosPara(esCliente) {
  return esCliente ? ESTADOS.filter((estado) => estado !== 'emitida') : ESTADOS
}

export function textoAlcancePara(role) {
  if (role === 'admin') return 'Ves todas las facturas.'
  if (role === 'bodeguero') return 'Solo ves las facturas que creaste.'
  return 'Solo ves tus facturas.'
}

/** El backend filtra por token; esto solo evita mostrar filas ajenas si vienen en la respuesta. */
export function creadorDe(fila) {
  const valor = fila?.creado_por_id ?? fila?.creada_por_id
  const numero = Number(valor)
  return Number.isFinite(numero) && numero > 0 ? numero : null
}

export function normalizarFormaPago(valor) {
  return valor === 'crédito' ? 'credito' : valor ?? ''
}

/** Traduce la respuesta del backend al modelo que espera FacturaForm. */
export function aFormModel(factura) {
  return {
    cliente_id: factura.cliente_id,
    bodega_id: factura.bodega?.id ?? '',
    forma_pago: normalizarFormaPago(factura.forma_pago),
    medio_pago: factura.medio_pago ?? '',
    fecha_vencimiento: factura.fecha_vencimiento?.slice(0, 10) ?? '',
    observaciones: factura.observaciones ?? '',
    detalle: (factura.detalle ?? []).map((linea) => ({
      tipo_id: linea.tipo_id ?? '',
      descripcion: linea.descripcion,
      unidad_medida: linea.unidad_medida ?? '',
      cantidad: linea.cantidad,
      precio_unitario: linea.precio_unitario,
      descuento_porcentaje: linea.descuento_porcentaje,
      iva_porcentaje: linea.iva_porcentaje,
    })),
  }
}

export function mensajeCreacion(creada) {
  return creada.numero
    ? `Factura creada. La ${creada.numero} ya está en la lista.`
    : 'Factura creada. Ya está en la lista.'
}
