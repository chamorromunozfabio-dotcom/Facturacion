<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AlertMessage from '../components/AlertMessage.vue'
import ConfirmDelete from '../components/ConfirmDelete.vue'
import DataTable from '../components/DataTable.vue'
import FormModal from '../components/FormModal.vue'
import rolesApi from '../api/roles'
import { getErrorMessage, isDuplicateError } from '../api/axios'
import { useAuthStore } from '../stores/auth'
import { tienePermiso } from '../config/permissions'

const auth = useAuthStore()
const canCreate = computed(() => tienePermiso(auth.permisos, auth.role, 'roles', 'create'))
const canEdit = computed(() => tienePermiso(auth.permisos, auth.role, 'roles', 'edit'))
const canDelete = computed(() => tienePermiso(auth.permisos, auth.role, 'roles', 'delete'))

const columns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'estado', label: 'Estado' },
]
const fields = [
  { key: 'nombre', label: 'Nombre', required: true, maxLength: 50 },
  { key: 'descripcion', label: 'Descripción', type: 'textarea', maxLength: 255 },
]

const rows = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)
const q = ref('')
const loading = ref(false)
const alert = ref(null)

const modalOpen = ref(false)
const editing = ref(null)
const form = ref({ nombre: '', descripcion: '' })
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
    const result = await rolesApi.list({ q: q.value, page: page.value, limit: limit.value })
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
  form.value = { nombre: '', descripcion: '' }
  modalOpen.value = true
}

function openEdit(row) {
  editing.value = row
  form.value = { nombre: row.nombre ?? '', descripcion: row.descripcion ?? '' }
  modalOpen.value = true
}

function changedFields(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => value !== editing.value?.[key]),
  )
}

function errorMessage(error, fallback) {
  if (isDuplicateError(error)) return 'Ya existe un rol con ese nombre. Probá con otro.'
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
      const updated = await rolesApi.update(editing.value.id, changes)
      const merged = { ...editing.value, ...updated }
      rows.value = rows.value.map((row) => (row.id === merged.id ? merged : row))
      alert.value = { type: 'success', message: 'Rol actualizado.' }
    } else {
      const created = await rolesApi.create(payload)
      rows.value = [created, ...rows.value]
      total.value += 1
      alert.value = { type: 'success', message: 'Rol creado.' }
    }
    modalOpen.value = false
  } catch (error) {
    alert.value = { type: 'error', message: errorMessage(error, 'No se pudo guardar el rol.') }
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
    await rolesApi.remove(deleting.value.id)
    rows.value = rows.value.filter((row) => row.id !== deleting.value.id)
    total.value = Math.max(0, total.value - 1)
    confirmOpen.value = false
    alert.value = { type: 'success', message: 'Rol eliminado.' }
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
        <h1>Roles</h1>
        <p>Crea roles y asígnales permisos desde el módulo Permisos.</p>
      </div>
      <span class="badge">Accesos</span>
    </header>

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
      create-label="Nuevo rol"
      :can-create="canCreate"
      :can-edit="canEdit"
      :can-delete="canDelete"
      @update:q="q = $event"
      @update:page="page = $event"
      @create="openCreate"
      @edit="openEdit"
      @delete="askDelete"
    >
      <template #cell-estado="{ value }">
        <span :class="value ? 'estado--activo' : 'estado--inactivo'">
          {{ value ? 'Activo' : 'Inactivo' }}
        </span>
      </template>
    </DataTable>

    <FormModal
      :open="modalOpen"
      :title="editing ? 'Editar rol' : 'Nuevo rol'"
      :fields="fields"
      :model-value="form"
      :submit-label="editing ? 'Guardar cambios' : 'Crear rol'"
      :loading="saving"
      @update:model-value="form = $event"
      @submit="save"
      @close="modalOpen = false"
    />

    <ConfirmDelete
      :open="confirmOpen"
      title="Eliminar rol"
      message="El rol se eliminará de forma permanente. Esta acción no se puede deshacer."
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

.estado--activo {
  color: #047857;
  font-weight: 600;
}

.estado--inactivo {
  color: #9ca3af;
  font-weight: 600;
}
</style>
