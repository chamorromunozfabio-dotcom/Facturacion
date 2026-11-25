import { computed, onMounted, ref, watch } from 'vue'
import estadisticasApi from '../api/estadisticas'
import { getErrorMessage } from '../../../shared/api/axios'
import { useAuthStore } from '../../auth/store/auth'
import {
  esSerieBarras,
  esSerieLinea,
  normalizarResumen,
  rangoInvalido,
  rangoPorDefecto,
  rangoPreset,
} from '../utils/estadisticas'

const DESCRIPCIONES_ROL = {
  admin: 'Métricas globales de empresas, clientes y operación de la plataforma.',
  empresa: 'Rendimiento consolidado de tus bodegas, entregas y motivos de rechazo.',
  bodeguero: 'Control diario de despachos, firmas pendientes y actividad de tu bodega.',
  cliente: 'Historial personal de facturas recibidas, pendientes y rechazos.',
}

const CONTEXTO_ROL = {
  admin: { badge: 'Visión global SaaS', tendencia: 'Evolución global de entregas' },
  empresa: { badge: 'Gestión de empresa', tendencia: 'Tendencia de entregas vs. rechazos' },
  bodeguero: { badge: 'Operación de bodega', tendencia: 'Despachos diarios de tu bodega' },
  cliente: { badge: 'Mis compras y entregas', tendencia: 'Historial de tus entregas' },
}

// El backend no devuelve `estados` en `filtros_disponibles`: son fijos por rol.
const ESTADOS_POR_ROL = {
  admin: [
    { value: 'activa', label: 'Activas' },
    { value: 'pendiente', label: 'Pendientes' },
    { value: 'suspendida', label: 'Suspendidas' },
    { value: 'rechazada', label: 'Rechazadas' },
  ],
  empresa: [],
  bodeguero: [
    { value: 'pendientes', label: 'Pendientes' },
    { value: 'completadas', label: 'Completadas' },
    { value: 'rechazadas', label: 'Rechazadas' },
  ],
  cliente: [
    { value: 'pendientes', label: 'Pendientes' },
    { value: 'aceptadas', label: 'Aceptadas' },
    { value: 'rechazadas', label: 'Rechazadas' },
  ],
}

/**
 * Estado del panel: rango de fechas, filtros adaptativos por rol, carga y presentación.
 * Qué datos y opciones llegan lo decide el backend según el token en `GET /estadisticas/resumen`.
 */
export function useEstadisticas() {
  const auth = useAuthStore()

  const descripcion = computed(
    () => DESCRIPCIONES_ROL[auth.role] ?? DESCRIPCIONES_ROL.cliente,
  )
  const contextoRol = computed(
    () => CONTEXTO_ROL[auth.role] ?? CONTEXTO_ROL.cliente,
  )

  const inicial = rangoPorDefecto()
  const desde = ref(inicial.desde)
  const hasta = ref(inicial.hasta)
  const empresaId = ref('')
  const bodegaId = ref('')
  const bodegueroId = ref('')
  const tipoId = ref('')
  const estado = ref('')

  const resumen = ref(normalizarResumen(null))
  const loading = ref(false)
  const error = ref('')

  const invalido = computed(() => rangoInvalido(desde.value, hasta.value))
  const tarjetas = computed(() => resumen.value.tarjetas)
  const filtrosDisponibles = computed(() => {
    const base = resumen.value.filtros_disponibles
    const estados = base.estados.length ? base.estados : ESTADOS_POR_ROL[auth.role] ?? []
    return { ...base, estados }
  })
  const desglosePrincipal = computed(() => resumen.value.desglose_principal)
  const serieTemporal = computed(() => resumen.value.serie_temporal)
  const alertasDetalle = computed(() => resumen.value.alertas_detalle)
  const series = computed(() => resumen.value.series)
  const barras = computed(() => series.value.filter(esSerieBarras))
  const lineas = computed(() => series.value.filter(esSerieLinea))

  const hayFiltrosActivos = computed(() =>
    Boolean(empresaId.value || bodegaId.value || bodegueroId.value || tipoId.value || estado.value),
  )

  const sinDatos = computed(
    () =>
      !loading.value &&
      !error.value &&
      !tarjetas.value.length &&
      !desglosePrincipal.value?.filas?.length &&
      !serieTemporal.value.length &&
      !barras.value.length &&
      !lineas.value.length,
  )

  function construirParams() {
    const params = {}
    if (desde.value) params.fecha_inicio = desde.value
    if (hasta.value) params.fecha_fin = hasta.value
    if (empresaId.value) params.empresa_id = Number(empresaId.value)
    if (bodegaId.value) params.bodega_id = Number(bodegaId.value)
    if (bodegueroId.value) params.bodeguero_id = Number(bodegueroId.value)
    if (tipoId.value) params.tipo_id = Number(tipoId.value)
    if (estado.value) params.estado = estado.value
    return params
  }

  async function cargar() {
    if (invalido.value) return
    loading.value = true
    error.value = ''
    try {
      const data = await estadisticasApi.getResumen(construirParams())
      resumen.value = normalizarResumen(data)
    } catch (e) {
      error.value = getErrorMessage(e)
    } finally {
      loading.value = false
    }
  }

  function aplicarPreset(dias) {
    const rango = rangoPreset(dias)
    desde.value = rango.desde
    hasta.value = rango.hasta
  }

  function limpiarFiltros() {
    const rango = rangoPorDefecto()
    desde.value = rango.desde
    hasta.value = rango.hasta
    empresaId.value = ''
    bodegaId.value = ''
    bodegueroId.value = ''
    tipoId.value = ''
    estado.value = ''
  }

  onMounted(cargar)
  watch([desde, hasta, empresaId, bodegaId, bodegueroId, tipoId, estado], () => cargar())

  return {
    descripcion,
    contextoRol,
    desde,
    hasta,
    empresaId,
    bodegaId,
    bodegueroId,
    tipoId,
    estado,
    invalido,
    loading,
    error,
    resumen,
    tarjetas,
    filtrosDisponibles,
    desglosePrincipal,
    serieTemporal,
    alertasDetalle,
    series,
    barras,
    lineas,
    hayFiltrosActivos,
    sinDatos,
    cargar,
    aplicarPreset,
    limpiarFiltros,
  }
}
