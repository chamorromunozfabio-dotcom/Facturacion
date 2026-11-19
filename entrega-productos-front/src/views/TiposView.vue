<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AlertMessage from '../components/AlertMessage.vue'
import ConfirmDelete from '../components/ConfirmDelete.vue'
import DataTable from '../components/DataTable.vue'
import FormModal from '../components/FormModal.vue'
import bodegasApi from '../api/bodegas'
import tiposApi from '../api/tipos'
import { getErrorMessage, isDuplicateError } from '../api/axios'
import { useAuthStore } from '../stores/auth'
import { tienePermiso } from '../config/permissions'

const auth = useAuthStore()
const canCreate = computed(() => tienePermiso(auth.permisos, auth.role, 'tipos', 'create'))
const canEdit = computed(() => tienePermiso(auth.permisos, auth.role, 'tipos', 'edit'))
const canDelete = computed(() => tienePermiso(auth.permisos, auth.role, 'tipos', 'delete'))

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

const rows = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)
const q = ref('')
const loading = ref(false)
const alert = ref(null)

const modalOpen = ref(false)
const editing = ref(null)
const form = ref({ nombre: '' })
const saving = ref(false)

const confirmOpen = ref(false)
const deleting = ref(null)
const removing = ref(false)

let searchTimer

watch(q, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    if (page.value !== 1) page.value = 1
    else load()
  }, 300)
})

watch(page, () => load())
watch(bodegaId, () => {
  if (page.value !== 1) page.value = 1
  else load()
})

async function cargarBodegas() {
  try {
    const result = await bodegasApi.list({ page: 1, limit: 100 })
    bodegas.value = result.data ?? []
  } catch {
    bodegas.value = []
  }
}

async function load() {
  loading.value = true
  try {
    const params = { q: q.value, page: page.value, limit: limit.value }
    if (bodegaId.value) params.bodega_id = bodegaId.value
    const result = await tiposApi.list(params)
    rows.value = (result.data ?? []).map((tipo) => ({
      ...tipo,
      bodega_nombre: tipo.bodega_nombre || nombreBodega(tipo.bodega_id) || 'General',
    }))
    total.value = result.total ?? 0
  } catch (error) {
    alert.value = { type: 'error', message: getErrorMessage(error) }
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  form.value = { nombre: '', bodega_id: bodegaId.value || bodegas.value[0]?.id || '' }
  modalOpen.value = true
}

function openEdit(row) {
  editing.value = row
  form.value = {
    nombre: row.nombre ?? '',
    bodega_id: row.bodega_id == null ? '' : row.bodega_id,
  }
  modalOpen.value = true
}

// El PUT acepta campos parciales: enviamos solo lo que cambió.
function changedFields(payload) {
  const actual = {
    ...editing.value,
    bodega_id: editing.value?.bodega_id ?? bodegaId.value,
  }
  return Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => {
      if (key === 'bodega_id') {
        const nuevo = value == null || value === '' ? null : String(value)
        const anterior = actual.bodega_id == null || actual.bodega_id === '' ? null : String(actual.bodega_id)
        return nuevo !== anterior
      }
      return String(value ?? '') !== String(actual[key] ?? '')
    }),
  )
}

function errorMessage(error, fallback) {
  if (isDuplicateError(error)) {
    return 'Ya existe un tipo con ese nombre en esta bodega. Probá con otro.'
  }
  return getErrorMessage(error) || fallback
}

async function save(payload) {
  saving.value = true
  const clean = { nombre: String(payload.nombre ?? '').trim() }
  const bodegaElegida = esAdmin.value ? payload.bodega_id : bodegaId.value
  const sinBodega = bodegaElegida === '' || bodegaElegida === null || bodegaElegida === undefined
  if (!sinBodega) clean.bodega_id = Number(bodegaElegida)
  // En edición, el admin también puede devolver un tipo a "general" (null).
  if (editing.value && esAdmin.value && sinBodega) clean.bodega_id = null

  try {
    if (editing.value) {
      const changes = changedFields(clean)
      if (Object.keys(changes).length === 0) {
        modalOpen.value = false
        alert.value = { type: 'info', message: 'No hay cambios: el tipo ya estaba guardado.' }
        return
      }
      const updated = await tiposApi.update(editing.value.id, changes)
      const merged = { ...editing.value, ...updated }
      rows.value = rows.value.map((row) => (row.id === merged.id ? merged : row))
      alert.value = { type: 'success', message: 'Tipo actualizado. Los cambios ya están guardados.' }
    } else {
      const created = await tiposApi.create(clean)
      rows.value = [created, ...rows.value]
      total.value += 1
      alert.value = {
        type: 'success',
        message: `Tipo creado. "${created.nombre ?? clean.nombre}" ya está en la lista.`,
      }
    }
    modalOpen.value = false
    if (esAdmin.value) {
      const vista = clean.bodega_id ?? ''
      if (String(vista) !== String(bodegaId.value)) bodegaId.value = vista
    }
  } catch (error) {
    alert.value = { type: 'error', message: errorMessage(error, 'No se pudo guardar el tipo.') }
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
    await tiposApi.remove(deleting.value.id)
    rows.value = rows.value.filter((row) => row.id !== deleting.value.id)
    total.value = Math.max(0, total.value - 1)
    confirmOpen.value = false
    alert.value = { type: 'success', message: 'Tipo eliminado. Ya no aparece en la lista.' }
  } catch (error) {
    alert.value = { type: 'error', message: getErrorMessage(error) }
  } finally {
    removing.value = false
  }
}

onMounted(() => {
  // Cargamos el listado enseguida y las bodegas en paralelo: si las bodegas
  // tardan, la tabla ya tiene datos y se recarga sola al elegir la bodega.
  load()
  cargarBodegas().then(() => {
    // El admin arranca en "Todas" para ver también los tipos generales.
    if (!esAdmin.value && !bodegaId.value && bodegas.value.length) {
      bodegaId.value = bodegas.value[0].id
    }
  })
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
          ? 'Cada bodega tiene su catálogo. También podés crear un tipo general sin bodega o ver "Todas las bodegas".'
          : 'Estás viendo los tipos de tu bodega. Los que crees solo aparecerán aquí.'
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
      create-label="Nuevo tipo"
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
      :title="editing ? 'Editar tipo' : 'Nuevo tipo'"
      :fields="fields"
      :model-value="form"
      :submit-label="editing ? 'Guardar cambios' : 'Crear tipo'"
      :loading="saving"
      @update:model-value="form = $event"
      @submit="save"
      @close="modalOpen = false"
    />

    <ConfirmDelete
      :open="confirmOpen"
      title="Eliminar tipo"
      message="El tipo se eliminará de forma permanente. Esta acción no se puede deshacer."
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
