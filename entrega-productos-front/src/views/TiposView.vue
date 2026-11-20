<script setup>
import { computed, ref, watch } from 'vue'
import AlertMessage from '../components/ui/AlertMessage.vue'
import ConfirmDelete from '../components/ui/ConfirmDelete.vue'
import DataTable from '../components/ui/DataTable.vue'
import FormModal from '../components/ui/FormModal.vue'
import bodegasApi from '../api/bodegas'
import tiposApi from '../api/tipos'
import { useAuthStore } from '../stores/auth'
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
  <section class="crud-page">
    <header class="crud-page__header">
      <div>
        <h1>Tipos de producto</h1>
        <p>Crea y edita los productos disponibles en cada bodega.</p>
      </div>
      <span class="badge">Catálogo</span>
    </header>

    <p class="notice">
      {{
        esAdmin
          ? 'Cada bodega tiene su catálogo. También podés crear un producto general sin bodega o ver "Todas las bodegas".'
          : 'Estás viendo los productos de tu bodega. Los que crees solo aparecerán aquí.'
      }}
    </p>

    <label v-if="esAdmin || bodegas.length > 1" class="filter">
      Bodega
      <select v-model="bodegaId" data-test="bodega-filter">
        <option v-if="esAdmin" value="">Todas las bodegas</option>
        <option v-for="bodega in bodegas" :key="bodega.id" :value="bodega.id">
          {{ bodega.nombre }}
        </option>
      </select>
    </label>

    <Transition name="alert">
      <AlertMessage
        v-if="alert"
        :type="alert.type"
        :message="alert.message"
        @close="alert = null"
      />
    </Transition>

    <DataTable
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
      @update:q="q = $event"
      @update:page="page = $event"
      @create="openCreate"
      @edit="openEdit"
      @delete="askDelete"
    />

    <FormModal
      :open="modalOpen"
      :title="editing ? 'Editar producto' : 'Nuevo producto'"
      :fields="fields"
      :model-value="form"
      :submit-label="editing ? 'Guardar cambios' : 'Crear producto'"
      :loading="saving"
      @update:model-value="form = $event"
      @submit="save"
      @close="modalOpen = false"
    />

    <ConfirmDelete
      :open="confirmOpen"
      :title="confirmacion.titulo"
      :message="confirmacion.mensaje"
      :item-label="deleting?.nombre || ''"
      :loading="removing"
      @confirm="confirmDelete"
      @cancel="confirmOpen = false"
    />
  </section>
</template>

<style scoped>
.crud-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.crud-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

h1 {
  margin: 0;
  font-size: 1.5rem;
}

p {
  margin: 4px 0 0;
  color: #6b7280;
}

.notice {
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  border-radius: 8px;
  padding: 10px 12px;
  color: #3730a3;
  font-size: 0.9rem;
}

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

.badge {
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.8rem;
  font-weight: 600;
}
</style>
