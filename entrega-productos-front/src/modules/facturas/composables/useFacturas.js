import { computed, onMounted, ref, watch } from 'vue'
import facturasApi, { validateFirma } from '../api/facturas'
import bodegasApi from '../../catalogos/api/bodegas'
import tiposApi from '../../catalogos/api/tipos'
import { getErrorMessage, getFieldErrors } from '../../../shared/api/axios'
import { tienePermiso } from '../../../shared/config/permissions'
import { useAuthStore } from '../../auth/store/auth'
import { empresaParams, useEmpresaFiltro } from '../../empresas/composables/useEmpresaFiltro'
import {
  COLUMNAS,
  aFormModel,
  creadorDe,
  estadosPara,
  mensajeCreacion,
} from '../utils/facturas'
import { esPlataformaNativa } from '../utils/pdfNativo'

/**
 * Estado y acciones de la pantalla de facturas. La vista solo dibuja y conecta
 * el listado con los formularios y modales.
 */
export function useFacturas() {
  const auth = useAuthStore()
  const { esAdmin, empresaId, empresaOpciones } = useEmpresaFiltro()

  const canCreate = computed(() => tienePermiso(auth.permisos, auth.role, 'facturas', 'create'))
  const canEdit = computed(() => tienePermiso(auth.permisos, auth.role, 'facturas', 'edit'))
  const canDelete = computed(() => tienePermiso(auth.permisos, auth.role, 'facturas', 'delete'))
  const canEntregar = computed(() => tienePermiso(auth.permisos, auth.role, 'facturas', 'entregar'))
  const canRecibir = computed(() => tienePermiso(auth.permisos, auth.role, 'facturas', 'recibir'))
  const canAceptar = computed(() => tienePermiso(auth.permisos, auth.role, 'facturas', 'aceptar'))
  const canRechazar = computed(() => tienePermiso(auth.permisos, auth.role, 'facturas', 'rechazar'))
  const canPdf = computed(() => tienePermiso(auth.permisos, auth.role, 'facturas', 'pdf'))
  const esCliente = computed(() => auth.role === 'cliente')
  const esBodeguero = computed(() => auth.role === 'bodeguero')
  const idUsuario = computed(() => Number(auth.user?.id) || null)

  // El emisor es la empresa: el listado trae `empresa_nombre` y se muestra al
  // admin y al cliente (los únicos que pueden ver facturas de varias empresas).
  const columns = computed(() => {
    const base = [...COLUMNAS]
    if (esAdmin.value || esCliente.value) {
      base.splice(1, 0, { key: 'empresa_nombre', label: 'Empresa' })
    }
    return base
  })

  const estadoOptions = computed(() => estadosPara(esCliente.value))
  const descripcion = computed(() =>
    esAdmin.value
      ? 'Supervisa todas las facturas y el ciclo completo de entrega.'
      : 'Consulta el estado de tus facturas y gestiona la entrega.',
  )

  const rows = ref([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(10)
  const q = ref('')
  const estadoFilter = ref('')
  const loading = ref(false)
  const alert = ref(null)

  // Si la respuesta ya trae el creador, no mostramos facturas ajenas al bodeguero.
  const filasVisibles = computed(() => {
    const filas = rows.value ?? []
    if (!esBodeguero.value || !idUsuario.value) return filas
    if (!filas.some((fila) => creadorDe(fila) !== null)) return filas
    return filas.filter((fila) => creadorDe(fila) === idUsuario.value)
  })

  const detailOpen = ref(false)
  const detalle = ref(null)
  const detailLoading = ref(false)

  const formOpen = ref(false)
  const editingId = ref(null)
  const formModel = ref({})
  const formErrors = ref({})
  const saving = ref(false)
  const catalogos = ref({ clientes: [], bodegas: [], tipos: [] })

  // Búsqueda de clientes con GET /clientes/buscar?q= (mínimo 5 caracteres).
  const clienteQuery = ref('')
  const buscandoClientes = ref(false)
  let clienteTimer

  const firmaFactura = ref(null)
  const firmaOpen = ref(false)
  const firma = ref('')
  const firmaError = ref('')
  const firmaSaving = ref(false)

  const rechazoFactura = ref(null)
  const rechazoOpen = ref(false)
  const motivo = ref('')
  const rechazoError = ref('')
  const rechazoSaving = ref(false)

  const confirmOpen = ref(false)
  const deleting = ref(null)
  const removing = ref(false)

  let searchTimer

  watch([q, estadoFilter, empresaId], () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      if (page.value !== 1) page.value = 1
      else load()
    }, 300)
  })

  // El buscador de clientes no dispara por cada tecla: 300 ms y mínimo 5 letras.
  watch(clienteQuery, () => {
    clearTimeout(clienteTimer)
    clienteTimer = setTimeout(() => {
      const texto = clienteQuery.value.trim()
      if (texto.length >= 5) buscarClientes(texto)
      else catalogos.value.clientes = []
    }, 300)
  })

  async function buscarClientes(texto) {
    buscandoClientes.value = true
    try {
      const result = await facturasApi.buscarClientes(texto)
      catalogos.value.clientes = result.data ?? []
    } catch {
      catalogos.value.clientes = []
    } finally {
      buscandoClientes.value = false
    }
  }

  watch(page, () => load())

  async function load() {
    loading.value = true
    try {
      const params = { q: q.value, page: page.value, limit: limit.value }
      if (estadoFilter.value) params.estado = estadoFilter.value
      // El backend filtra por el token; si /me trae la bodega, la enviamos también.
      if (auth.role === 'bodeguero' && auth.user?.bodega_id) {
        params.bodega_id = auth.user.bodega_id
      }
      Object.assign(params, empresaParams(esAdmin.value, empresaId.value))
      const result = await facturasApi.list(params)
      rows.value = result.data ?? []
      total.value = result.total ?? 0
    } catch (error) {
      failure(error)
    } finally {
      loading.value = false
    }
  }

  function patchRow(id, patch) {
    rows.value = rows.value.map((row) => (row.id === id ? { ...row, ...patch } : row))
  }

  function success(message) {
    alert.value = { type: 'success', message }
  }

  function failure(error, fallback = 'No se pudo completar la acción.') {
    alert.value = { type: 'error', message: getErrorMessage(error) || fallback }
  }

  async function simpleAction(fn, id, patch, message) {
    try {
      await fn(id)
      patchRow(id, patch)
      success(message)
    } catch (error) {
      failure(error)
    }
  }

  function entregar(row) {
    return simpleAction(
      facturasApi.entregar,
      row.id,
      { estado: 'entregada' },
      'Factura entregada. Ya está lista para recibirse.',
    )
  }

  function recibir(row) {
    return simpleAction(
      facturasApi.recibir,
      row.id,
      { estado: 'recibida' },
      'Factura recibida. El proceso terminó correctamente.',
    )
  }

  function closeDetail() {
    detailOpen.value = false
  }

  async function openDetail(row) {
    detailLoading.value = true
    detailOpen.value = true
    detalle.value = null
    try {
      detalle.value = await facturasApi.get(row.id)
    } catch (error) {
      failure(error, 'No se pudo cargar el detalle.')
      closeDetail()
    } finally {
      detailLoading.value = false
    }
  }

  function closeFirma() {
    firmaOpen.value = false
  }

  function openAceptar(row) {
    firmaFactura.value = row
    firma.value = ''
    firmaError.value = ''
    firmaOpen.value = true
  }

  async function confirmarAceptar() {
    firmaError.value = validateFirma(firma.value)
    if (firmaError.value) return

    firmaSaving.value = true
    try {
      await facturasApi.aceptar(firmaFactura.value.id, firma.value)
      patchRow(firmaFactura.value.id, { estado: 'firmada' })
      closeFirma()
      success('Factura aceptada con firma. El estado ya cambió a firmada.')
    } catch (error) {
      failure(error, 'No se pudo aceptar la factura.')
    } finally {
      firmaSaving.value = false
    }
  }

  function closeRechazo() {
    rechazoOpen.value = false
  }

  function openRechazar(row) {
    rechazoFactura.value = row
    motivo.value = ''
    rechazoError.value = ''
    rechazoOpen.value = true
  }

  /** Contrato: `motivo_rechazo` es obligatorio, de 10 a 255 caracteres. */
  function validarMotivo() {
    const largo = motivo.value.trim().length
    if (!largo) return 'Escribe el motivo del rechazo.'
    if (largo < 10) return 'El motivo debe tener al menos 10 caracteres.'
    if (largo > 255) return 'El motivo no puede pasar de 255 caracteres.'
    return ''
  }

  async function confirmarRechazo() {
    rechazoError.value = validarMotivo()
    if (rechazoError.value) return

    rechazoSaving.value = true
    try {
      await facturasApi.rechazar(rechazoFactura.value.id, motivo.value.trim())
      patchRow(rechazoFactura.value.id, { estado: 'rechazada' })
      closeRechazo()
      success('Factura rechazada. El motivo quedó registrado.')
    } catch (error) {
      // Si el backend devuelve un 422 por campo, el aviso queda junto al motivo.
      rechazoError.value = getFieldErrors(error)?.motivo_rechazo || ''
      failure(error, 'No se pudo rechazar la factura.')
    } finally {
      rechazoSaving.value = false
    }
  }

  async function descargar(row) {
    try {
      const filename = await facturasApi.descargarPdf(row.id, row.numero)
      success(esPlataformaNativa() ? `Abriendo ${filename}.` : `Descargando ${filename}.`)
    } catch (error) {
      failure(error, 'No se pudo descargar el PDF.')
    }
  }

  async function loadCatalogos() {
    // Los clientes ya no se cargan completos: se buscan con /clientes/buscar.
    const [bodegas, tipos] = await Promise.all([
      bodegasApi.list({ page: 1, limit: 100, estado: true }),
      tiposApi.list({ page: 1, limit: 100, estado: true }),
    ])
    catalogos.value = {
      ...catalogos.value,
      bodegas: bodegas.data ?? [],
      tipos: tipos.data ?? [],
    }
  }

  function closeForm() {
    formOpen.value = false
  }

  function openCreate() {
    editingId.value = null
    formModel.value = {}
    formErrors.value = {}
    clienteQuery.value = ''
    catalogos.value.clientes = []
    formOpen.value = true
    loadCatalogos().catch((error) => failure(error, 'No se pudieron cargar los catálogos.'))
  }

  async function openEdit(row) {
    editingId.value = row.id
    formErrors.value = {}
    clienteQuery.value = ''
    formOpen.value = true
    try {
      const [factura] = await Promise.all([facturasApi.get(row.id), loadCatalogos()])
      formModel.value = aFormModel(factura)
      // El cliente actual queda visible en el selector; buscar lo reemplaza.
      catalogos.value.clientes = [
        {
          id: factura.cliente_id,
          nombre: factura.cliente_nombre || `Cliente #${factura.cliente_id}`,
        },
      ]
    } catch (error) {
      failure(error, 'No se pudo cargar la factura.')
    }
  }

  async function save(payload) {
    saving.value = true
    try {
      if (editingId.value) {
        const id = editingId.value
        const updated = await facturasApi.update(id, payload)
        patchRow(id, { ...payload, ...updated })
        success('Factura actualizada. Los cambios ya están guardados.')
      } else {
        const created = await facturasApi.create(payload)
        // La fila nueva también debe quedar visible para el bodeguero.
        const creada = esBodeguero.value && idUsuario.value
          ? { ...created, creado_por_id: created.creado_por_id ?? idUsuario.value }
          : created
        rows.value = [creada, ...rows.value]
        total.value += 1
        success(mensajeCreacion(created))
      }
      formErrors.value = {}
      closeForm()
    } catch (error) {
      formErrors.value = getFieldErrors(error)
      failure(error, 'No se pudo guardar la factura.')
    } finally {
      saving.value = false
    }
  }

  function askDelete(row) {
    deleting.value = row
    confirmOpen.value = true
  }

  function closeConfirm() {
    confirmOpen.value = false
  }

  async function confirmDelete() {
    removing.value = true
    try {
      await facturasApi.remove(deleting.value.id)
      rows.value = rows.value.filter((row) => row.id !== deleting.value.id)
      total.value = Math.max(0, total.value - 1)
      closeConfirm()
      success('Factura eliminada. Ya no aparece en la lista.')
    } catch (error) {
      failure(error, 'No se pudo eliminar la factura.')
    } finally {
      removing.value = false
    }
  }

  onMounted(() => {
    load()
    const idQuery = new URLSearchParams(window.location.search).get('id')
    if (idQuery) openDetail({ id: Number(idQuery) })
  })

  return {
    canCreate,
    canEdit,
    canDelete,
    canEntregar,
    canRecibir,
    canAceptar,
    canRechazar,
    canPdf,
    descripcion,
    estadoOptions,
    columns,
    esAdmin,
    esCliente,
    empresaId,
    empresaOpciones,
    rows,
    filasVisibles,
    total,
    page,
    limit,
    q,
    estadoFilter,
    loading,
    alert,
    entregar,
    recibir,
    detailOpen,
    detalle,
    detailLoading,
    openDetail,
    closeDetail,
    firmaFactura,
    firmaOpen,
    firma,
    firmaError,
    firmaSaving,
    openAceptar,
    confirmarAceptar,
    closeFirma,
    rechazoFactura,
    rechazoOpen,
    motivo,
    rechazoError,
    rechazoSaving,
    openRechazar,
    confirmarRechazo,
    closeRechazo,
    descargar,
    catalogos,
    clienteQuery,
    buscandoClientes,
    formOpen,
    editingId,
    formModel,
    formErrors,
    saving,
    openCreate,
    openEdit,
    save,
    closeForm,
    confirmOpen,
    deleting,
    removing,
    askDelete,
    confirmDelete,
    closeConfirm,
  }
}
