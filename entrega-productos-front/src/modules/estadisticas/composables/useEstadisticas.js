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
} from '../utils/estadisticas'

/**
 * Estado del panel: rango de fechas, carga y presentación.
 * Qué datos llegan lo decide el backend según el token; acá solo se pintan.
 */
export function useEstadisticas() {
  const auth = useAuthStore()

  const descripcion = computed(() => {
    if (auth.role === 'admin') {
      return 'Analiza las cifras globales de todos los usuarios y el rendimiento general.'
    }
    if (auth.role === 'empresa') {
      return 'Resumen consolidado de tus bodegas, tu equipo y tus entregas.'
    }
    if (auth.role === 'bodeguero') {
      return 'Consulta las cifras de las facturas que creaste y de tus bodegas.'
    }
    return 'Consulta las cifras y la evolución de tus facturas.'
  })

  const inicial = rangoPorDefecto()
  const desde = ref(inicial.desde)
  const hasta = ref(inicial.hasta)
  const resumen = ref(normalizarResumen(null))
  const loading = ref(false)
  const error = ref('')

  const invalido = computed(() => rangoInvalido(desde.value, hasta.value))
  const tarjetas = computed(() => resumen.value.tarjetas)
  const series = computed(() => resumen.value.series)
  const barras = computed(() => series.value.filter(esSerieBarras))
  const lineas = computed(() => series.value.filter(esSerieLinea))
  const sinDatos = computed(
    () =>
      !loading.value &&
      !error.value &&
      !tarjetas.value.length &&
      !barras.value.length &&
      !lineas.value.length,
  )

  async function cargar() {
    if (invalido.value) return
    loading.value = true
    error.value = ''
    try {
      const data = await estadisticasApi.getResumen({ desde: desde.value, hasta: hasta.value })
      resumen.value = normalizarResumen(data)
    } catch (e) {
      error.value = getErrorMessage(e)
    } finally {
      loading.value = false
    }
  }

  onMounted(cargar)
  watch([desde, hasta], () => cargar())

  return {
    descripcion,
    desde,
    hasta,
    invalido,
    loading,
    error,
    resumen,
    tarjetas,
    series,
    barras,
    lineas,
    sinDatos,
    cargar,
  }
}
