/** Reglas puras del panel de estadísticas. Sin Vue, sin store y sin API. */

const formateador = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 })

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

/** Calcula un rango rápido en días hacia atrás (0 = hoy, 6 = 7 días, 29 = 30 días). */
export function rangoPreset(dias, hoy = new Date()) {
  const fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  const inicio = new Date(fin)
  inicio.setDate(fin.getDate() - Math.max(0, Number(dias) || 0))
  return {
    desde: fechaISO(inicio),
    hasta: fechaISO(fin),
  }
}

export function formatearValor(valor, sufijo = '', formato = '') {
  const numero = Number(valor)
  const texto = formateador.format(Number.isFinite(numero) ? numero : 0)
  if (formato === 'porcentaje') return `${texto}%`
  if (formato === 'moneda') return `${texto} $`
  return sufijo ? `${texto} ${sufijo}` : texto
}

function normalizarKpis(data) {
  const fuente = Array.isArray(data?.kpis)
    ? data.kpis
    : Array.isArray(data?.tarjetas)
      ? data.tarjetas
      : []

  return fuente.map((item) => ({
    clave: item.clave,
    etiqueta: item.titulo ?? item.etiqueta ?? '',
    titulo: item.titulo ?? item.etiqueta ?? '',
    valor: item.valor ?? 0,
    sufijo: item.sufijo ?? '',
    formato: item.formato ?? 'numero',
    alerta: Boolean(item.alerta),
  }))
}

function normalizarFiltros(filtros) {
  return {
    empresas: Array.isArray(filtros?.empresas) ? filtros.empresas : [],
    bodegas: Array.isArray(filtros?.bodegas) ? filtros.bodegas : [],
    bodegueros: Array.isArray(filtros?.bodegueros) ? filtros.bodegueros : [],
    tipos: Array.isArray(filtros?.tipos) ? filtros.tipos : [],
    estados: Array.isArray(filtros?.estados) ? filtros.estados : [],
  }
}

/** Defensa ante respuestas incompletas: la vista siempre recibe estructuras seguras. */
export function normalizarResumen(data) {
  const tarjetas = normalizarKpis(data)
  const desglose =
    data?.desglose_principal && Array.isArray(data.desglose_principal.filas)
      ? {
          titulo: data.desglose_principal.titulo ?? '',
          columnas: Array.isArray(data.desglose_principal.columnas)
            ? data.desglose_principal.columnas
            : [],
          filas: data.desglose_principal.filas,
        }
      : null

  return {
    periodo: data?.periodo ?? {},
    generado_para: data?.generado_para ?? '',
    tarjetas,
    kpis: tarjetas,
    filtros_disponibles: normalizarFiltros(data?.filtros_disponibles),
    desglose_principal: desglose,
    serie_temporal: Array.isArray(data?.serie_temporal) ? data.serie_temporal : [],
    alertas_detalle: Array.isArray(data?.alertas_detalle) ? data.alertas_detalle : [],
    series: Array.isArray(data?.series) ? data.series : [],
  }
}

export function esSerieBarras(serie) {
  return serie?.tipo === 'barras' && Array.isArray(serie.datos) && serie.datos.length > 0
}

/** La serie temporal del backend (`por_fecha`) llega con `tipo: 'linea'`. */
export function esSerieLinea(serie) {
  return serie?.tipo === 'linea' && Array.isArray(serie.datos) && serie.datos.length > 0
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
