<script setup>
import CrudPage from '../../../shared/ui/CrudPage.vue'
import { computed, ref, watch } from 'vue'
import bodegasApi from '../api/bodegas'
import tiposApi from '../api/tipos'
import { useAuthStore } from '../../auth/store/auth'
import { useCrud } from '../composables/useCrud'

const auth = useAuthStore()
// El admin elige la bodega; el bodeguero queda atado a la suya (la lista que
// devuelve el backend ya viene filtrada por dueño).
const esAdmin = computed(() => auth.role === 'admin')
const bodegas = ref([])
const bodegaId = ref('')

const bodegasOpciones = computed(() =>
  bodegas.value.map((bodega) => ({ value: bodega.id, label: bodega.nombre })),
)
const nombreBodega = (id) =>
  bodegas.value.find((bodega) => String(bodega.id) === String(id))?.nombre ?? ''

const columns = computed(() => [
  { key: 'nombre', label: 'Nombre' },
  ...(esAdmin.value ? [{ key: 'bodega_nombre', label: 'Bodega' }] : []),
])

const fields = computed(() => {
  const base = [{ key: 'nombre', label: 'Nombre', required: true, maxLength: 100 }]
  if (!esAdmin.value || !bodegasOpciones.value.length) return base
  return [
    ...base,
    {
      key: 'bodega_id',
      label: 'Bodega',
      type: 'select',
      options: [{ value: '', label: 'Tipo general (sin bodega)' }, ...bodegasOpciones.value],
    },
  ]
})

async function cargarBodegas() {
  try {
    const result = await bodegasApi.list({ page: 1, limit: 100 })
    bodegas.value = result.data ?? []
  } catch {
    bodegas.value = []
  }
}

function cleanPayload(payload) {
  const clean = { nombre: String(payload.nombre ?? '').trim() }
  const bodegaElegida = esAdmin.value ? payload.bodega_id : bodegaId.value
  const sinBodega = bodegaElegida === '' || bodegaElegida === null || bodegaElegida === undefined
  if (!sinBodega) clean.bodega_id = Number(bodegaElegida)
  // En edición, el admin también puede devolver un tipo a "general" (null).
  if (editing.value && esAdmin.value && sinBodega) clean.bodega_id = null
  return clean
}

const {
  canCreate,
  canEdit,
  canDelete,
  createLabel,
  confirmacion,
  rows,
  total,
  page,
  limit,
  q,
  loading,
  alert,
  modalOpen,
  editing,
  form,
  saving,
  confirmOpen,
  deleting,
  removing,
  load,
  openCreate,
  openEdit,
  save,
  askDelete,
  confirmDelete,
} = useCrud({
  modulo: 'tipos',
  api: tiposApi,
  columns,
  fields,
  createLabel: 'Nuevo producto',
  emptyForm: () => ({
    nombre: '',
    bodega_id: bodegaId.value || bodegas.value[0]?.id || '',
  }),
  formFromRow: (row) => ({
    nombre: row.nombre ?? '',
    bodega_id: row.bodega_id == null ? '' : row.bodega_id,
  }),
  cleanPayload,
  // En edición, si la fila no trae bodega, comparamos contra la bodega activa del filtro.
  actualParaCambios: (row) => ({ ...row, bodega_id: row.bodega_id ?? bodegaId.value }),
  // "" y null significan "general", así que se comparan como el mismo valor.
  normalizarCambio: (key, valor) =>
    key === 'bodega_id'
      ? valor == null || valor === ''
        ? null
        : String(valor)
      : String(valor ?? ''),
  transformarFila: (tipo) => ({
    ...tipo,
    bodega_nombre: tipo.bodega_nombre || nombreBodega(tipo.bodega_id) || 'General',
  }),
  paramsExtra: () => (bodegaId.value ? { bodega_id: bodegaId.value } : {}),
  duplicateMessage: 'Ya existe un tipo con ese nombre en esta bodega. Probá con otro.',
  mensajes: {
    creado: (clean) => `Producto creado. "${clean.nombre}" ya está en la lista.`,
    actualizado: 'Producto actualizado. Los cambios ya están guardados.',
    eliminado: 'Producto eliminado. Ya no aparece en la lista.',
    sinCambios: 'No hay cambios: el tipo ya estaba guardado.',
    fallbackGuardar: 'No se pudo guardar el tipo.',
  },
  confirmacion: {
    titulo: 'Eliminar tipo',
    mensaje: 'El tipo se eliminará de forma permanente. Esta acción no se puede deshacer.',
  },
  despuesDeGuardar: (clean) => {
    if (!esAdmin.value) return
    const vista = clean.bodega_id ?? ''
    if (String(vista) !== String(bodegaId.value)) bodegaId.value = vista
  },
  alMontar: () =>
    cargarBodegas().then(() => {
      // El admin arranca en "Todas" para ver también los tipos generales.
      if (!esAdmin.value && !bodegaId.value && bodegas.value.length) {
        bodegaId.value = bodegas.value[0].id
      }
    }),
})

// El cambio de bodega recarga enseguida: el filtro de búsqueda sí lleva debounce.
watch(bodegaId, () => {
  if (page.value !== 1) page.value = 1
  else load()
})
</script>

<template>
  <CrudPage
    titulo="Tipos de producto"
    descripcion="Crea y edita los productos disponibles en cada bodega."
    badge="Catálogo"
    :alert="alert"
    :columns="columns"
    :rows="rows"
    :total="total"
    :page="page"
    :limit="limit"
    :q="q"
    :loading="loading"
    :create-label="createLabel"
    :can-create="canCreate"
    :can-edit="canEdit"
    :can-delete="canDelete"
    :modal-open="modalOpen"
    :editing="editing"
    :fields="fields"
    :form="form"
    :saving="saving"
    crear-titulo="Nuevo producto"
    editar-titulo="Editar producto"
    crear-submit-label="Crear producto"
    :confirm-open="confirmOpen"
    :confirm-titulo="confirmacion.titulo"
    :confirm-mensaje="confirmacion.mensaje"
    :deleting="deleting"
    :removing="removing"
    @update:q="q = $event"
    @update:page="page = $event"
    @create="openCreate"
    @edit="openEdit"
    @delete="askDelete"
    @update:model-value="form = $event"
    @submit="save"
    @close-modal="modalOpen = false"
    @confirm="confirmDelete"
    @cancel="confirmOpen = false"
    @close-alert="alert = null"
  >
    <template #filter>
      <label v-if="esAdmin || bodegas.length > 1" class="filter">
        Bodega
        <select v-model="bodegaId" data-test="bodega-filter">
          <option v-if="esAdmin" value="">Todas las bodegas</option>
          <option v-for="bodega in bodegas" :key="bodega.id" :value="bodega.id">
            {{ bodega.nombre }}
          </option>
        </select>
      </label>
    </template>
  </CrudPage>
</template>

<style scoped>
.filter {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 320px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
}

.filter select {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px;
  font: inherit;
}
</style>
