import { computed, onMounted, ref, watch } from 'vue'
import empresasApi from '../api/empresas'
import { getErrorMessage } from '../../../shared/api/axios'

const ESTADOS = [
  { value: '', label: 'Todas' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'activa', label: 'Activas' },
  { value: 'rechazada', label: 'Rechazadas' },
  { value: 'suspendida', label: 'Suspendidas' },
]

/**
 * Estado del listado de empresas. La aprobación, el rechazo y la suspensión
 * cambian el estado en el backend; acá solo se refleja la respuesta.
 */
export function useEmpresas() {
  const rows = ref([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(10)
  const q = ref('')
  const estado = ref('')
  const loading = ref(false)
  const alert = ref(null)

  const rechazoOpen = ref(false)
  const rechazoEmpresa = ref(null)
  const motivoRechazo = ref('')
  const rechazoError = ref('')
  const rechazoSaving = ref(false)

  let searchTimer

  const estadoOptions = ESTADOS

  const rechazoValido = computed(() => {
    const len = motivoRechazo.value.trim().length
    return len >= 10 && len <= 255
  })

  watch([q, estado], () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      if (page.value !== 1) page.value = 1
      else load()
    }, 300)
  })

  watch(page, () => load())

  async function load() {
    loading.value = true
    try {
      const params = { q: q.value, page: page.value, limit: limit.value }
      if (estado.value) params.estado = estado.value
      const result = await empresasApi.list(params)
      rows.value = result.data ?? []
      total.value = result.total ?? 0
    } catch (error) {
      alert.value = { type: 'error', message: getErrorMessage(error) }
    } finally {
      loading.value = false
    }
  }

  function patchEmpresa(id, patch) {
    rows.value = rows.value.map((row) => (row.id === id ? { ...row, ...patch } : row))
  }

  async function cambiarEstado(row, nuevoEstado, mensaje, extra = {}) {
    try {
      const actualizada = await empresasApi.cambiarEstado(row.id, {
        estado: nuevoEstado,
        ...extra,
      })
      patchEmpresa(row.id, { estado: nuevoEstado, ...extra, ...actualizada })
      alert.value = { type: 'success', message: mensaje }
      return true
    } catch (error) {
      alert.value = { type: 'error', message: getErrorMessage(error) }
      return false
    }
  }

  function aprobar(row) {
    return cambiarEstado(row, 'activa', `"${row.razon_social}" fue aprobada y ya puede ingresar.`)
  }

  function suspender(row) {
    return cambiarEstado(
      row,
      'suspendida',
      `"${row.razon_social}" quedó suspendida. Sus usuarios no podrán ingresar.`,
    )
  }

  function reactivar(row) {
    return cambiarEstado(row, 'activa', `"${row.razon_social}" fue reactivada.`)
  }

  function abrirRechazo(row) {
    rechazoEmpresa.value = row
    motivoRechazo.value = ''
    rechazoError.value = ''
    rechazoOpen.value = true
  }

  function closeRechazo() {
    rechazoOpen.value = false
  }

  async function confirmarRechazo() {
    const motivo = motivoRechazo.value.trim()
    if (motivo.length < 10) {
      rechazoError.value = 'Escribe un motivo de al menos 10 caracteres.'
    } else if (motivo.length > 255) {
      rechazoError.value = 'El motivo no puede superar los 255 caracteres.'
    } else {
      rechazoError.value = ''
    }
    if (rechazoError.value) return

    rechazoSaving.value = true
    const ok = await cambiarEstado(
      rechazoEmpresa.value,
      'rechazada',
      `"${rechazoEmpresa.value.razon_social}" fue rechazada.`,
      { motivo_rechazo: motivo },
    )
    rechazoSaving.value = false
    if (ok) closeRechazo()
  }

  onMounted(load)

  return {
    rows,
    total,
    page,
    limit,
    q,
    estado,
    estadoOptions,
    loading,
    alert,
    rechazoOpen,
    rechazoEmpresa,
    motivoRechazo,
    rechazoError,
    rechazoSaving,
    rechazoValido,
    load,
    aprobar,
    suspender,
    reactivar,
    abrirRechazo,
    closeRechazo,
    confirmarRechazo,
  }
}
