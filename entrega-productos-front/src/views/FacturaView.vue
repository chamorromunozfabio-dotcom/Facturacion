<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import {
  Check,
  Eye,
  FileDown,
  PackageCheck,
  Pencil,
  Trash2,
  Truck,
  X,
} from '@lucide/vue'
import AlertMessage from '../components/AlertMessage.vue'
import ConfirmDelete from '../components/ConfirmDelete.vue'
import DataTable from '../components/DataTable.vue'
import FacturaDetail from '../components/FacturaDetail.vue'
import FacturaForm from '../components/FacturaForm.vue'
import SignaturePad from '../components/SignaturePad.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { useModalA11y } from '../composables/useModalA11y'
import facturasApi, { validateFirma } from '../api/facturas'
import bodegasApi from '../api/bodegas'
import tiposApi from '../api/tipos'
import { getErrorMessage, getFieldErrors } from '../api/axios'
import { useAuthStore } from '../stores/auth'
import { tienePermiso } from '../config/permissions'

const auth = useAuthStore()
const canCreate = computed(() => tienePermiso(auth.permisos, auth.role, 'facturas', 'create'))
const canEdit = computed(() => tienePermiso(auth.permisos, auth.role, 'facturas', 'edit'))
const canDelete = computed(() => tienePermiso(auth.permisos, auth.role, 'facturas', 'delete'))
const canEntregar = computed(() => tienePermiso(auth.permisos, auth.role, 'facturas', 'entregar'))
const canRecibir = computed(() => tienePermiso(auth.permisos, auth.role, 'facturas', 'recibir'))
const canAceptar = computed(() => tienePermiso(auth.permisos, auth.role, 'facturas', 'aceptar'))
const canRechazar = computed(() => tienePermiso(auth.permisos, auth.role, 'facturas', 'rechazar'))
const canPdf = computed(() => tienePermiso(auth.permisos, auth.role, 'facturas', 'pdf'))
const esCliente = computed(() => auth.role === 'cliente')

const ESTADOS = ['emitida', 'entregada', 'firmada', 'rechazada', 'recibida']
const estadoOptions = computed(() =>
  esCliente.value ? ESTADOS.filter((estado) => estado !== 'emitida') : ESTADOS,
)

const columns = [
  { key: 'numero', label: 'Número' },
  { key: 'cliente_nombre', label: 'Cliente' },
  { key: 'estado', label: 'Estado' },
  { key: 'fecha_emision', label: 'Emisión' },
  { key: 'total', label: 'Total' },
]

const rows = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)
const q = ref('')
const estadoFilter = ref('')
const loading = ref(false)
const alert = ref(null)

const detailOpen = ref(false)
const detalle = ref(null)
const detailLoading = ref(false)

const formOpen = ref(false)
const editingId = ref(null)
const formModel = ref({})
const formErrors = ref({})
const saving = ref(false)
const catalogos = ref({ clientes: [], bodegas: [], tipos: [] })

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

const { panelRef: detailPanelRef } = useModalA11y(computed(() => detailOpen.value), () => {
  detailOpen.value = false
})
const { panelRef: firmaPanelRef } = useModalA11y(computed(() => firmaOpen.value), () => {
  firmaOpen.value = false
})
const { panelRef: rechazoPanelRef } = useModalA11y(computed(() => rechazoOpen.value), () => {
  rechazoOpen.value = false
})

const confirmOpen = ref(false)
const deleting = ref(null)
const removing = ref(false)

let searchTimer

watch([q, estadoFilter], () => {
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
    if (estadoFilter.value) params.estado = estadoFilter.value
    // El backend filtra por el token; si /me trae la bodega, la enviamos también.
    if (auth.role === 'bodeguero' && auth.user?.bodega_id) {
      params.bodega_id = auth.user.bodega_id
    }
    const result = await facturasApi.list(params)
    rows.value = result.data ?? []
    total.value = result.total ?? 0
  } catch (error) {
    alert.value = { type: 'error', message: getErrorMessage(error) }
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

function failure(error, fallback) {
  alert.value = { type: 'error', message: getErrorMessage(error) || fallback }
}

async function simpleAction(fn, id, patch, message) {
  try {
    await fn(id)
    patchRow(id, patch)
    success(message)
  } catch (error) {
    failure(error, 'No se pudo completar la acción.')
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

async function openDetail(row) {
  detailLoading.value = true
  detailOpen.value = true
  detalle.value = null
  try {
    detalle.value = await facturasApi.get(row.id)
  } catch (error) {
    failure(error, 'No se pudo cargar el detalle.')
    detailOpen.value = false
  } finally {
    detailLoading.value = false
  }
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
    firmaOpen.value = false
    success('Factura aceptada con firma. El estado ya cambió a firmada.')
  } catch (error) {
    failure(error, 'No se pudo aceptar la factura.')
  } finally {
    firmaSaving.value = false
  }
}

function openRechazar(row) {
  rechazoFactura.value = row
  motivo.value = ''
  rechazoError.value = ''
  rechazoOpen.value = true
}

async function confirmarRechazo() {
  rechazoError.value = motivo.value.trim() ? '' : 'Escribe el motivo del rechazo.'
  if (rechazoError.value) return

  rechazoSaving.value = true
  try {
    await facturasApi.rechazar(rechazoFactura.value.id, motivo.value.trim())
    patchRow(rechazoFactura.value.id, { estado: 'rechazada' })
    rechazoOpen.value = false
    success('Factura rechazada. El motivo quedó registrado.')
  } catch (error) {
    failure(error, 'No se pudo rechazar la factura.')
  } finally {
    rechazoSaving.value = false
  }
}

async function descargar(row) {
  try {
    const filename = await facturasApi.descargarPdf(row.id, row.numero)
    success(`Descargando ${filename}.`)
  } catch (error) {
    failure(error, 'No se pudo descargar el PDF.')
  }
}

async function loadCatalogos() {
  // /usuarios ya no está permitido para el bodeguero: el backend ofrece /facturas/clientes.
  const [clientes, bodegas, tipos] = await Promise.all([
    facturasApi.listClientes({ page: 1, limit: 100 }),
    bodegasApi.list({ page: 1, limit: 100 }),
    tiposApi.list({ page: 1, limit: 100, estado: true }),
  ])
  catalogos.value = {
    clientes: clientes.data ?? [],
    bodegas: bodegas.data ?? [],
    tipos: tipos.data ?? [],
  }
}

function openCreate() {
  editingId.value = null
  formModel.value = {}
  formErrors.value = {}
  formOpen.value = true
  loadCatalogos().catch((error) => failure(error, 'No se pudieron cargar los catálogos.'))
}

async function openEdit(row) {
  editingId.value = row.id
  formErrors.value = {}
  formOpen.value = true
  try {
    const [factura] = await Promise.all([facturasApi.get(row.id), loadCatalogos()])
    formModel.value = {
      cliente_id: factura.cliente_id,
      bodega_id: factura.bodega?.id ?? '',
      forma_pago: factura.forma_pago === 'crédito' ? 'credito' : (factura.forma_pago ?? ''),
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
      rows.value = [created, ...rows.value]
      total.value += 1
      success(
        `Factura creada. ${created.numero ? `La ${created.numero} ya está en la lista.` : 'Ya está en la lista.'}`,
      )
    }
    formErrors.value = {}
    formOpen.value = false
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

async function confirmDelete() {
  removing.value = true
  try {
    await facturasApi.remove(deleting.value.id)
    rows.value = rows.value.filter((row) => row.id !== deleting.value.id)
    total.value = Math.max(0, total.value - 1)
    confirmOpen.value = false
    success('Factura eliminada. Ya no aparece en la lista.')
  } catch (error) {
    failure(error, 'No se pudo eliminar la factura.')
  } finally {
    removing.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="facturas-page">
    <header class="facturas-page__header">
      <div>
        <h1>Facturas</h1>
        <p>Consulta el estado de tus facturas y gestiona la entrega.</p>
      </div>
      <span class="badge">Documentos</span>
    </header>

    <div class="alert-flotante" data-test="alert-flotante">
      <Transition name="alert">
        <AlertMessage
          v-if="alert"
          :type="alert.type"
          :message="alert.message"
          @close="alert = null"
        />
      </Transition>
    </div>

    <label class="estado-filter">
      Estado
      <select v-model="estadoFilter" data-test="estado-filter">
        <option value="">Todos</option>
        <option v-for="estado in estadoOptions" :key="estado" :value="estado">{{ estado }}</option>
      </select>
    </label>

    <DataTable
      :columns="columns"
      :rows="rows"
      :total="total"
      :page="page"
      :limit="limit"
      :q="q"
      :loading="loading"
      :can-create="canCreate"
      :can-edit="false"
      :can-delete="false"
      @update:q="q = $event"
      @update:page="page = $event"
      @create="openCreate"
    >
      <template #cell-estado="{ value }">
        <StatusBadge :estado="value" />
      </template>

      <template #actions="{ row }">
        <button data-test="ver" type="button" class="btn btn--small" @click="openDetail(row)">
          <Eye :size="14" aria-hidden="true" />
          <span>Ver</span>
        </button>
        <button
          v-if="canEdit && row.estado === 'emitida'"
          data-test="edit"
          type="button"
          class="btn btn--small"
          @click="openEdit(row)"
        >
          <Pencil :size="14" aria-hidden="true" />
          <span>Editar</span>
        </button>
        <button
          v-if="canDelete && row.estado === 'emitida'"
          data-test="delete"
          type="button"
          class="btn btn--small btn--danger"
          @click="askDelete(row)"
        >
          <Trash2 :size="14" aria-hidden="true" />
          <span>Eliminar</span>
        </button>
        <button
          v-if="canEntregar && row.estado === 'emitida'"
          data-test="entregar"
          type="button"
          class="btn btn--small"
          @click="entregar(row)"
        >
          <Truck :size="14" aria-hidden="true" />
          <span>Entregar</span>
        </button>
        <button
          v-if="canAceptar && row.estado === 'entregada'"
          data-test="aceptar"
          type="button"
          class="btn btn--small btn--primary"
          @click="openAceptar(row)"
        >
          <Check :size="14" aria-hidden="true" />
          <span>Aceptar</span>
        </button>
        <button
          v-if="canRechazar && row.estado === 'entregada'"
          data-test="rechazar"
          type="button"
          class="btn btn--small btn--danger"
          @click="openRechazar(row)"
        >
          <X :size="14" aria-hidden="true" />
          <span>Rechazar</span>
        </button>
        <button
          v-if="canRecibir && row.estado === 'firmada'"
          data-test="recibir"
          type="button"
          class="btn btn--small"
          @click="recibir(row)"
        >
          <PackageCheck :size="14" aria-hidden="true" />
          <span>Recibir</span>
        </button>
        <button
          v-if="canPdf"
          data-test="pdf"
          type="button"
          class="btn btn--small"
          @click="descargar(row)"
        >
          <FileDown :size="14" aria-hidden="true" />
          <span>PDF</span>
        </button>
      </template>
    </DataTable>

    <FacturaForm
      :open="formOpen"
      :titulo="editingId ? 'Editar factura' : 'Nueva factura'"
      :model-value="formModel"
      :clientes="catalogos.clientes"
      :bodegas="catalogos.bodegas"
      :tipos="catalogos.tipos"
      :submit-label="editingId ? 'Guardar cambios' : 'Crear factura'"
      :loading="saving"
      :server-errors="formErrors"
      @submit="save"
      @close="formOpen = false"
    />

    <Transition name="modal">
    <div v-if="detailOpen" data-test="detail-modal" class="modal">
      <div class="modal__backdrop" @click="detailOpen = false"></div>
      <div
        ref="detailPanelRef"
        tabindex="-1"
        class="modal__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Detalle de factura"
      >
        <header class="modal__header">
          <h2>Detalle de factura</h2>
          <button
            data-test="detail-close"
            type="button"
            class="modal__close"
            aria-label="Cerrar detalle"
            @click="detailOpen = false"
          >×</button>
        </header>
        <div class="modal__body">
          <p v-if="detailLoading">Cargando detalle...</p>
          <FacturaDetail v-else-if="detalle" :factura="detalle" />
        </div>
      </div>
    </div>
    </Transition>

    <Transition name="modal">
    <div v-if="firmaOpen" data-test="firma-modal" class="modal">
      <div class="modal__backdrop" @click="firmaOpen = false"></div>
      <div
        ref="firmaPanelRef"
        tabindex="-1"
        class="modal__panel modal__panel--small"
        role="dialog"
        aria-modal="true"
        aria-label="Aceptar con firma"
      >
        <header class="modal__header">
          <h2>Aceptar {{ firmaFactura?.numero }}</h2>
          <button type="button" class="modal__close" aria-label="Cerrar firma" @click="firmaOpen = false">×</button>
        </header>
        <div class="modal__body">
          <p>Firma con el mouse o el dedo para aceptar la recepción.</p>
          <SignaturePad v-model="firma" />
          <p v-if="firmaError" data-test="firma-error" class="error">{{ firmaError }}</p>
          <footer class="modal__footer">
            <button type="button" class="btn" @click="firmaOpen = false">Cancelar</button>
            <button
              data-test="firma-confirm"
              type="button"
              class="btn btn--primary"
              :disabled="firmaSaving"
              @click="confirmarAceptar"
            >
              {{ firmaSaving ? 'Guardando...' : 'Aceptar con firma' }}
            </button>
          </footer>
        </div>
      </div>
    </div>
    </Transition>

    <Transition name="modal">
    <div v-if="rechazoOpen" data-test="rechazo-modal" class="modal">
      <div class="modal__backdrop" @click="rechazoOpen = false"></div>
      <div
        ref="rechazoPanelRef"
        tabindex="-1"
        class="modal__panel modal__panel--small"
        role="dialog"
        aria-modal="true"
        aria-label="Rechazar factura"
      >
        <header class="modal__header">
          <h2>Rechazar {{ rechazoFactura?.numero }}</h2>
          <button type="button" class="modal__close" aria-label="Cerrar rechazo" @click="rechazoOpen = false">×</button>
        </header>
        <div class="modal__body">
          <label>
            Motivo del rechazo
            <textarea v-model="motivo" data-test="motivo" rows="3"></textarea>
          </label>
          <p v-if="rechazoError" data-test="rechazo-error" class="error">{{ rechazoError }}</p>
          <footer class="modal__footer">
            <button type="button" class="btn" @click="rechazoOpen = false">Cancelar</button>
            <button
              data-test="rechazo-confirm"
              type="button"
              class="btn btn--danger"
              :disabled="rechazoSaving"
              @click="confirmarRechazo"
            >
              Rechazar
            </button>
          </footer>
        </div>
      </div>
    </div>
    </Transition>

    <ConfirmDelete
      :open="confirmOpen"
      title="Eliminar factura"
      message="La factura se eliminará de forma permanente. Esta acción no se puede deshacer."
      :item-label="deleting?.numero || ''"
      :loading="removing"
      @confirm="confirmDelete"
      @cancel="confirmOpen = false"
    />
  </section>
</template>

<style scoped>
.facturas-page { display: flex; flex-direction: column; gap: 16px; }
.facturas-page__header { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
h1 { margin: 0; font-size: 1.5rem; }
p { margin: 4px 0 0; color: #6b7280; font-size: 0.9rem; }
.estado-filter { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; }
.estado-filter select { border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 10px; }
.badge { background: #e0e7ff; color: #3730a3; border-radius: 999px; padding: 4px 10px; font-size: 0.8rem; font-weight: 600; }
/* La alerta flota por encima de los modales (z-index 50). */
.alert-flotante { position: fixed; top: 16px; right: 16px; left: 16px; z-index: 100; max-width: 480px; margin-inline: auto; pointer-events: none; }
.alert-flotante :deep(.alert) { pointer-events: auto; margin-bottom: 0; box-shadow: 0 10px 30px rgb(0 0 0 / 15%); }
.modal { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 50; }
.modal__backdrop { position: absolute; inset: 0; background: rgb(17 24 39 / 50%); }
.modal__panel { position: relative; width: 100%; max-width: 860px; max-height: 92vh; overflow-y: auto; background: #fff; border-radius: 12px; box-shadow: 0 10px 30px rgb(0 0 0 / 20%); }
.modal__panel--small { max-width: 560px; }
.modal__header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
h2 { margin: 0; font-size: 1.1rem; }
.modal__close { border: 0; background: transparent; font-size: 1.6rem; cursor: pointer; color: #6b7280; }
.modal__body { padding: 20px; }
.modal__footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 18px; }
label { display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; font-weight: 600; color: #374151; }
textarea { width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 8px; font: inherit; }
.error { color: #b91c1c; background: #fef2f2; border-radius: 6px; padding: 8px 10px; font-size: 0.9rem; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid #d1d5db; background: #fff; color: #374151; border-radius: 8px; padding: 8px 12px; cursor: pointer; }
.btn--small { padding: 5px 10px; font-size: 0.85rem; }
.btn--primary { background: #4f46e5; border-color: #4f46e5; color: #fff; }
.btn--danger { color: #b91c1c; border-color: #fca5a5; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
