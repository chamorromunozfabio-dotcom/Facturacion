/** Reglas puras del panel de estadísticas. Sin Vue, sin store y sin API. */

const formateador = new Intl.NumberFormat('es-AR')

function fechaISO(fecha) {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

/** Rango inicial: el mes corriente, en el formato que espera el backend. */
export function rangoPorDefecto(hoy = new Date()) {
  return {
    desde: fechaISO(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
    hasta: fechaISO(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)),
  }
}

export function formatearValor(valor, sufijo = '') {
  const numero = Number(valor)
  const texto = formateador.format(Number.isFinite(numero) ? numero : 0)
  return sufijo ? `${texto} ${sufijo}` : texto
}

/** Defensa ante respuestas incompletas: la vista siempre recibe arrays. */
export function normalizarResumen(data) {
  return {
    periodo: data?.periodo ?? {},
    generado_para: data?.generado_para ?? '',
    tarjetas: Array.isArray(data?.tarjetas) ? data.tarjetas : [],
    series: Array.isArray(data?.series) ? data.series : [],
  }
}

export function esSerieBarras(serie) {
  return serie?.tipo === 'barras' && Array.isArray(serie.datos) && serie.datos.length > 0
}

export function maximoDe(serie) {
  const valores = (serie?.datos ?? []).map((dato) => Number(dato?.valor) || 0)
  return Math.max(0, ...valores)
}

/** Las fechas son ISO (AAAA-MM-DD), así que se comparan como texto. */
export function rangoInvalido(desde, hasta) {
  if (!desde || !hasta) return true
  return String(desde) > String(hasta)
}
