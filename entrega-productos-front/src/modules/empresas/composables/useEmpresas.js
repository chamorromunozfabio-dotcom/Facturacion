import { computed, onMounted, ref, watch } from 'vue'
import empresasApi from '../api/empresas'
import { getErrorMessage } from '../../../shared/api/axios'
import { registrar } from '../../auth/api/register'
import { erroresDelBackend } from '../../auth/utils/registro'

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

  const detalleOpen = ref(false)
  const detalleEmpresa = ref(null)

  const crearOpen = ref(false)
  const crearSaving = ref(false)
  const crearError = ref('')
  const crearFieldErrors = ref({})

  const confirmOpen = ref(false)
  const deleting = ref(null)
  const removing = ref(false)

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
      if (detalleEmpresa.value?.id === row.id) {
        detalleEmpresa.value = { ...detalleEmpresa.value, estado: nuevoEstado, ...extra, ...actualizada }
      }
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

  function abrirDetalle(row) {
    detalleEmpresa.value = row
    detalleOpen.value = true
  }

  function closeDetalle() {
    detalleOpen.value = false
  }

  function abrirCrear() {
    crearError.value = ''
    crearFieldErrors.value = {}
    crearOpen.value = true
  }

  function closeCrear() {
    crearOpen.value = false
  }

  function askDelete(row) {
    detalleOpen.value = false
    deleting.value = row
    confirmOpen.value = true
  }

  function cancelDelete() {
    confirmOpen.value = false
  }

  async function confirmDelete() {
    if (!deleting.value) return
    removing.value = true
    try {
      await empresasApi.remove(deleting.value.id)
      const nombre = deleting.value.razon_social
      rows.value = rows.value.filter((row) => row.id !== deleting.value.id)
      total.value = Math.max(0, total.value - 1)
      confirmOpen.value = false
      alert.value = { type: 'success', message: `"${nombre}" fue eliminada definitivamente.` }
    } catch (error) {
      confirmOpen.value = false
      alert.value = { type: 'error', message: getErrorMessage(error) }
    } finally {
      removing.value = false
    }
  }

  async function crearEmpresa(payload) {
    crearSaving.value = true
    crearError.value = ''
    crearFieldErrors.value = {}
    try {
      const data = await registrar(payload)
      if (data?.empresa?.id) {
        await empresasApi.cambiarEstado(data.empresa.id, { estado: 'activa' })
      }
      crearOpen.value = false
      await load()
      alert.value = {
        type: 'success',
        message: `"${payload.razon_social}" fue creada y activada.`,
      }
    } catch (error) {
      const porCampo = erroresDelBackend(error)
      if (Object.keys(porCampo).length) crearFieldErrors.value = porCampo
      else crearError.value = getErrorMessage(error)
    } finally {
      crearSaving.value = false
    }
  }

  function abrirRechazo(row) {
    detalleOpen.value = false
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
    detalleOpen,
    detalleEmpresa,
    crearOpen,
    crearSaving,
    crearError,
    crearFieldErrors,
    confirmOpen,
    deleting,
    removing,
    load,
    aprobar,
    suspender,
    reactivar,
    abrirDetalle,
    closeDetalle,
    abrirCrear,
    closeCrear,
    crearEmpresa,
    askDelete,
    cancelDelete,
    confirmDelete,
    abrirRechazo,
    closeRechazo,
    confirmarRechazo,
  }
}
