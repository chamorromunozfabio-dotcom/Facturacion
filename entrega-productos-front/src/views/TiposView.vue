<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AlertMessage from '../components/AlertMessage.vue'
import ConfirmDelete from '../components/ConfirmDelete.vue'
import DataTable from '../components/DataTable.vue'
import FormModal from '../components/FormModal.vue'
import tiposApi from '../api/tipos'
import { getErrorMessage, isDuplicateError } from '../api/axios'
import { useAuthStore } from '../stores/auth'
import { hasPermission } from '../config/permissions'

const auth = useAuthStore()
const canCreate = computed(() => hasPermission(auth.role, 'tipos', 'create'))
const canEdit = computed(() => hasPermission(auth.role, 'tipos', 'edit'))
const canDelete = computed(() => hasPermission(auth.role, 'tipos', 'delete'))

const columns = [{ key: 'nombre', label: 'Nombre' }]
const fields = [{ key: 'nombre', label: 'Nombre', required: true, maxLength: 100 }]

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

async function load() {
  loading.value = true
  try {
    const result = await tiposApi.list({ q: q.value, page: page.value, limit: limit.value })
    rows.value = result.data ?? []
    total.value = result.total ?? 0
  } catch (error) {
    alert.value = { type: 'error', message: getErrorMessage(error) }
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  form.value = { nombre: '' }
  modalOpen.value = true
}

function openEdit(row) {
  editing.value = row
  form.value = { ...row }
  modalOpen.value = true
}

// El PUT acepta campos parciales: enviamos solo lo que cambió.
function changedFields(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => value !== editing.value?.[key]),
  )
}

function errorMessage(error, fallback) {
  if (isDuplicateError(error)) return 'Ya existe un tipo con ese nombre. Probá con otro.'
  return getErrorMessage(error) || fallback
}

async function save(payload) {
  saving.value = true
  try {
    if (editing.value) {
      const changes = changedFields(payload)
      if (Object.keys(changes).length === 0) {
        modalOpen.value = false
        alert.value = { type: 'info', message: 'No hay cambios para guardar.' }
        return
      }
      const updated = await tiposApi.update(editing.value.id, changes)
      const merged = { ...editing.value, ...updated }
      rows.value = rows.value.map((row) => (row.id === merged.id ? merged : row))
      alert.value = { type: 'success', message: 'Tipo actualizado.' }
    } else {
      const created = await tiposApi.create(payload)
      rows.value = [created, ...rows.value]
      total.value += 1
      alert.value = { type: 'success', message: 'Tipo creado.' }
    }
    modalOpen.value = false
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
    alert.value = { type: 'success', message: 'Tipo eliminado.' }
  } catch (error) {
    alert.value = { type: 'error', message: getErrorMessage(error) }
  } finally {
    removing.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="crud-page">
    <header class="crud-page__header">
      <div>
        <h1>Tipos de producto</h1>
        <p>Gestiona las categorías de los productos.</p>
      </div>
      <span class="badge">Día 3</span>
    </header>

    <AlertMessage
      v-if="alert"
      :type="alert.type"
      :message="alert.message"
      @close="alert = null"
    />

    <DataTable
      :columns="columns"
      :rows="rows"
      :total="total"
      :page="page"
      :limit="limit"
      :q="q"
      :loading="loading"
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
      :loading="saving"
      @update:model-value="form = $event"
      @submit="save"
      @close="modalOpen = false"
    />

    <ConfirmDelete
      :open="confirmOpen"
      title="Eliminar tipo"
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

.badge {
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.8rem;
  font-weight: 600;
}
</style>
