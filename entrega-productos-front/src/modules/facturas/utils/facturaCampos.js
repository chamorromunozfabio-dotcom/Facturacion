/** Reglas y mensajes del formulario de factura. Son funciones puras, sin Vue. */

export const IVAS = [0, 5, 19]

export const formaPagoOptions = [
  { value: 'contado', label: 'Contado' },
  { value: 'credito', label: 'Crédito' },
]

export const medioPagoOptions = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
]

export const MENSAJES = {
  cliente_id: 'Elige el cliente.',
  bodega_id: 'Elige la bodega.',
  forma_pago: 'Elige la forma de pago.',
  medio_pago: 'Elige el medio de pago.',
  fecha_vencimiento: 'Escribe la fecha límite.',
  fecha_invalida: 'Fecha no válida.',
  detalle: 'Agrega un producto.',
  observaciones: 'Máximo 1000 caracteres.',
}

export const MENSAJES_LINEA = {
  tipo: 'Elige el producto.',
  descripcion: 'Escribe la descripción.',
  descripcion_larga: 'Máximo 255 caracteres.',
  unidad_medida: 'Escribe la unidad.',
  unidad_larga: 'Máximo 20 caracteres.',
  cantidad: 'Escribe la cantidad.',
  cantidad_valor: 'Cantidad mayor que 0.',
  cantidad_decimales: 'Hasta 2 decimales.',
  precio_unitario: 'Escribe el precio.',
  precio_valor: 'Precio mayor o igual que 0.',
  precio_decimales: 'Hasta 2 decimales.',
  descuento_porcentaje: 'Escribe el descuento.',
  descuento_valor: 'Descuento 0 a 100.',
  descuento_decimales: 'Hasta 2 decimales.',
  iva_porcentaje: 'Elige el IVA.',
  iva_valor: 'IVA 0, 5 o 19.',
}

export const CLAVES_LINEA = {
  tipo_id: 'tipo',
  descripcion: 'descripcion',
  unidad_medida: 'unidad_medida',
  cantidad: 'cantidad',
  precio_unitario: 'precio_unitario',
  descuento_porcentaje: 'descuento_porcentaje',
  iva_porcentaje: 'iva_porcentaje',
}

const MENSAJES_SERVIDOR = {
  cliente_id: MENSAJES.cliente_id,
  bodega_id: MENSAJES.bodega_id,
  forma_pago: MENSAJES.forma_pago,
  medio_pago: MENSAJES.medio_pago,
  fecha_vencimiento: MENSAJES.fecha_vencimiento,
  detalle: MENSAJES.detalle,
  observaciones: MENSAJES.observaciones,
  general: 'Revisa la factura.',
}

const MENSAJES_SERVIDOR_LINEA = {
  tipo: MENSAJES_LINEA.tipo,
  descripcion: MENSAJES_LINEA.descripcion,
  unidad_medida: MENSAJES_LINEA.unidad_medida,
  cantidad: MENSAJES_LINEA.cantidad,
  precio_unitario: MENSAJES_LINEA.precio_unitario,
  descuento_porcentaje: MENSAJES_LINEA.descuento_porcentaje,
  iva_porcentaje: MENSAJES_LINEA.iva_porcentaje,
}

export const emptyLinea = () => ({
  tipo_id: '',
  descripcion: '',
  unidad_medida: '',
  cantidad: '',
  precio_unitario: '',
  descuento_porcentaje: '',
  iva_porcentaje: '',
})

export const defaults = () => ({
  cliente_id: '',
  bodega_id: '',
  forma_pago: '',
  medio_pago: '',
  fecha_vencimiento: '',
  observaciones: '',
  detalle: [emptyLinea()],
})

export function esEnteroPositivo(valor) {
  if (String(valor ?? '').trim() === '') return false
  const numero = Number(valor)
  return Number.isInteger(numero) && numero > 0
}

export function esNumero(valor) {
  const texto = String(valor ?? '').trim()
  return texto !== '' && Number.isFinite(Number(texto))
}

export function masDeDosDecimales(valor) {
  return /\.(\d{3,})$/.test(String(valor).trim())
}

export function esFechaValida(valor) {
  const texto = String(valor ?? '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false
  const [anio, mes, dia] = texto.split('-').map(Number)
  const fecha = new Date(anio, mes - 1, dia)
  return (
    fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia
  )
}

export function campoLineaValido(campo, linea) {
  switch (campo) {
    case 'tipo':
      return esEnteroPositivo(linea.tipo_id)
    case 'descripcion': {
      const texto = String(linea.descripcion ?? '').trim()
      return texto.length > 0 && texto.length <= 255
    }
    case 'unidad_medida': {
      const texto = String(linea.unidad_medida ?? '').trim()
      return texto.length > 0 && texto.length <= 20
    }
    case 'cantidad':
      return (
        esNumero(linea.cantidad) &&
        Number(linea.cantidad) > 0 &&
        !masDeDosDecimales(linea.cantidad)
      )
    case 'precio_unitario':
      return (
        esNumero(linea.precio_unitario) &&
        Number(linea.precio_unitario) >= 0 &&
        !masDeDosDecimales(linea.precio_unitario)
      )
    case 'descuento_porcentaje':
      return (
        esNumero(linea.descuento_porcentaje) &&
        Number(linea.descuento_porcentaje) >= 0 &&
        Number(linea.descuento_porcentaje) <= 100 &&
        !masDeDosDecimales(linea.descuento_porcentaje)
      )
    case 'iva_porcentaje':
      return (
        String(linea.iva_porcentaje ?? '').trim() !== '' &&
        IVAS.includes(Number(linea.iva_porcentaje))
      )
    default:
      return true
  }
}

export function campoCabeceraValido(clave, form, esCredito) {
  switch (clave) {
    case 'cliente_id':
      return esEnteroPositivo(form.cliente_id)
    case 'bodega_id':
      return esEnteroPositivo(form.bodega_id)
    case 'forma_pago':
      return !!form.forma_pago
    case 'medio_pago':
      return !!form.medio_pago
    case 'fecha_vencimiento':
      return !esCredito || esFechaValida(form.fecha_vencimiento)
    case 'observaciones':
      return String(form.observaciones ?? '').length <= 1000
    default:
      return true
  }
}

export function clavesDelFormulario(form) {
  const claves = [
    'cliente_id',
    'bodega_id',
    'forma_pago',
    'medio_pago',
    'fecha_vencimiento',
    'observaciones',
  ]
  form.detalle.forEach((_, index) => {
    for (const campo of [
      'tipo',
      'descripcion',
      'unidad_medida',
      'cantidad',
      'precio_unitario',
      'descuento_porcentaje',
      'iva_porcentaje',
    ]) {
      claves.push(`linea_${index}_${campo}`)
    }
  })
  return claves
}

/** Devuelve solo los errores del formulario, sin efectos secundarios. */
export function validarFormulario(form, esCredito) {
  const nuevos = {}

  if (!esEnteroPositivo(form.cliente_id)) nuevos.cliente_id = MENSAJES.cliente_id
  if (!esEnteroPositivo(form.bodega_id)) nuevos.bodega_id = MENSAJES.bodega_id
  if (!form.forma_pago) nuevos.forma_pago = MENSAJES.forma_pago
  if (!form.medio_pago) nuevos.medio_pago = MENSAJES.medio_pago

  if (esCredito) {
    if (!String(form.fecha_vencimiento ?? '').trim()) {
      nuevos.fecha_vencimiento = MENSAJES.fecha_vencimiento
    } else if (!esFechaValida(form.fecha_vencimiento)) {
      nuevos.fecha_vencimiento = MENSAJES.fecha_invalida
    }
  }

  if (String(form.observaciones ?? '').length > 1000) {
    nuevos.observaciones = MENSAJES.observaciones
  }
  if (!form.detalle.length) nuevos.detalle = MENSAJES.detalle

  form.detalle.forEach((linea, index) => {
    const clave = `linea_${index}_`

    if (!esEnteroPositivo(linea.tipo_id)) nuevos[clave + 'tipo'] = MENSAJES_LINEA.tipo

    const descripcion = String(linea.descripcion ?? '').trim()
    if (!descripcion) nuevos[clave + 'descripcion'] = MENSAJES_LINEA.descripcion
    else if (descripcion.length > 255) {
      nuevos[clave + 'descripcion'] = MENSAJES_LINEA.descripcion_larga
    }

    const unidad = String(linea.unidad_medida ?? '').trim()
    if (!unidad) nuevos[clave + 'unidad_medida'] = MENSAJES_LINEA.unidad_medida
    else if (unidad.length > 20) {
      nuevos[clave + 'unidad_medida'] = MENSAJES_LINEA.unidad_larga
    }

    const cantidad = String(linea.cantidad ?? '').trim()
    if (!cantidad) nuevos[clave + 'cantidad'] = MENSAJES_LINEA.cantidad
    else if (!esNumero(cantidad) || Number(cantidad) <= 0) {
      nuevos[clave + 'cantidad'] = MENSAJES_LINEA.cantidad_valor
    } else if (masDeDosDecimales(cantidad)) {
      nuevos[clave + 'cantidad'] = MENSAJES_LINEA.cantidad_decimales
    }

    const precio = String(linea.precio_unitario ?? '').trim()
    if (!precio) nuevos[clave + 'precio_unitario'] = MENSAJES_LINEA.precio_unitario
    else if (!esNumero(precio) || Number(precio) < 0) {
      nuevos[clave + 'precio_unitario'] = MENSAJES_LINEA.precio_valor
    } else if (masDeDosDecimales(precio)) {
      nuevos[clave + 'precio_unitario'] = MENSAJES_LINEA.precio_decimales
    }

    const descuento = String(linea.descuento_porcentaje ?? '').trim()
    if (!descuento) {
      nuevos[clave + 'descuento_porcentaje'] = MENSAJES_LINEA.descuento_porcentaje
    } else if (!esNumero(descuento) || Number(descuento) < 0 || Number(descuento) > 100) {
      nuevos[clave + 'descuento_porcentaje'] = MENSAJES_LINEA.descuento_valor
    } else if (masDeDosDecimales(descuento)) {
      nuevos[clave + 'descuento_porcentaje'] = MENSAJES_LINEA.descuento_decimales
    }

    const iva = String(linea.iva_porcentaje ?? '').trim()
    if (!iva) nuevos[clave + 'iva_porcentaje'] = MENSAJES_LINEA.iva_porcentaje
    else if (!IVAS.includes(Number(iva))) {
      nuevos[clave + 'iva_porcentaje'] = MENSAJES_LINEA.iva_valor
    }
  })

  return nuevos
}

export function mensajeServidor(clave) {
  const coincidencia = clave.match(/^detalle\[(\d+)\]\.(.+)$/)
  if (coincidencia) {
    const campo = CLAVES_LINEA[coincidencia[2]] || coincidencia[2]
    return MENSAJES_SERVIDOR_LINEA[campo] || 'Revisa el producto.'
  }
  return MENSAJES_SERVIDOR[clave] || 'Revisa este dato.'
}

/** Traduce `detalle[0].tipo_id` a `linea_0_tipo` para pintar el error. */
export function aplicarErroresServidor(errores, nuevos = {}) {
  const convertidos = {}
  for (const clave of Object.keys(nuevos)) {
    const detalle = clave.match(/^detalle\[(\d+)\]\.(.+)$/)
    const interna = detalle
      ? `linea_${detalle[1]}_${CLAVES_LINEA[detalle[2]] || detalle[2]}`
      : clave
    convertidos[interna] = mensajeServidor(clave)
  }
  Object.assign(errores, convertidos)
}
