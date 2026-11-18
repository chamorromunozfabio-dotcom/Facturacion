<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AlertMessage from '../components/AlertMessage.vue'
import ConfirmDelete from '../components/ConfirmDelete.vue'
import DataTable from '../components/DataTable.vue'
import FormModal from '../components/FormModal.vue'
import usuariosApi from '../api/usuarios'
import { getErrorMessage, isDuplicateError } from '../api/axios'
import { useAuthStore } from '../stores/auth'
import { hasPermission } from '../config/permissions'

const auth = useAuthStore()
const isBodeguero = computed(() => auth.role === 'bodeguero')
const canCreate = computed(() => hasPermission(auth.role, 'usuarios', 'create'))
const canEdit = computed(() => hasPermission(auth.role, 'usuarios', 'edit'))
const canDelete = computed(() => hasPermission(auth.role, 'usuarios', 'delete'))

const roleOptions = [
  { value: 1, label: 'admin' },
  { value: 2, label: 'bodeguero' },
  { value: 3, label: 'cliente' },
]
const roleIdByNombre = { admin: 1, bodeguero: 2, cliente: 3 }
const documentOptions = [
  { value: 'CC', label: 'CC' },
  { value: 'NIT', label: 'NIT' },
  { value: 'CE', label: 'CE' },
]
const phonePattern = /^[0-9+\- ]{7,20}$/
const phoneMessage = 'Usa entre 7 y 20 caracteres: dígitos, espacios, + o -.'

const columns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'correo', label: 'Correo' },
  { key: 'rol', label: 'Rol' },
  { key: 'numero_documento', label: 'Documento' },
]

const baseFields = [
  { key: 'nombre', label: 'Nombre', required: true, maxLength: 100 },
  { key: 'correo', label: 'Correo', type: 'email', required: true },
  { key: 'contrasena', label: 'Contraseña', type: 'password', required: true },
  { key: 'rol_id', label: 'Rol', type: 'select', options: roleOptions, required: true },
]
const clienteFields = [
  {
    key: 'tipo_documento',
    label: 'Tipo de documento',
    type: 'select',
    options: documentOptions,
    required: true,
  },
  { key: 'numero_documento', label: 'Número de documento', required: true, maxLength: 20 },
  { key: 'telefono', label: 'Teléfono', required: true, pattern: phonePattern, message: phoneMessage },
  { key: 'direccion', label: 'Dirección', required: true },
]

const rows = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)
const q = ref('')
const roleFilter = ref('')
const loading = ref(false)
const alert = ref(null)

const modalOpen = ref(false)
const editing = ref(null)
const form = ref({})
const saving = ref(false)

const confirmOpen = ref(false)
const deleting = ref(null)
const removing = ref(false)

const effectiveRole = computed(() => (isBodeguero.value ? 'cliente' : roleFilter.value))

const fields = computed(() => {
  const list = baseFields.map((field) => ({ ...field }))
  if (Number(form.value.rol_id) === 3) list.push(...clienteFields)
  if (editing.value) {
    const password = list.find((field) => field.key === 'contrasena')
    password.required = false
    password.label = 'Contraseña (vacía = no cambiar)'
  }
  return list
})

let searchTimer

watch([q, roleFilter], () => {
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
    if (effectiveRole.value) params.rol = effectiveRole.value
    const result = await usuariosApi.list(params)
    rows.value = result.data ?? []
    total.value = result.total ?? 0
  } catch (error) {
    alert.value = { type: 'error', message: getErrorMessage(error) }
  } finally {
    loading.value = false
  }
}

function emptyForm() {
  return Object.fromEntries(fields.value.map((field) => [field.key, '']))
}

function openCreate() {
  editing.value = null
  form.value = emptyForm()
  modalOpen.value = true
}

function openEdit(row) {
  editing.value = row
  form.value = {
    nombre: row.nombre ?? '',
    correo: row.correo ?? '',
    contrasena: '',
    rol_id: row.rol_id ?? roleIdByNombre[row.rol] ?? '',
    tipo_documento: row.tipo_documento ?? '',
    numero_documento: row.numero_documento ?? '',
    telefono: row.telefono ?? '',
    direccion: row.direccion ?? '',
  }
  modalOpen.value = true
}

function cleanPayload(payload) {
  const clean = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== '' && value !== null),
  )
  if (clean.rol_id !== undefined) clean.rol_id = Number(clean.rol_id)
  return clean
}

function changedFields(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => value !== editing.value?.[key]),
  )
}

function errorMessage(error, fallback) {
  if (isDuplicateError(error)) return 'Ya existe un usuario con ese correo. Probá con otro.'
  return getErrorMessage(error) || fallback
}

async function save(payload) {
  saving.value = true
  const clean = cleanPayload(payload)
  try {
    if (editing.value) {
      const changes = changedFields(clean)
      if (Object.keys(changes).length === 0) {
        modalOpen.value = false
        alert.value = { type: 'info', message: 'No hay cambios para guardar.' }
        return
      }
      const updated = await usuariosApi.update(editing.value.id, changes)
      rows.value = rows.value.map((row) => (row.id === updated.id ? { ...row, ...updated } : row))
      alert.value = { type: 'success', message: 'Usuario actualizado.' }
    } else {
      const created = await usuariosApi.create(clean)
      rows.value = [created, ...rows.value]
      total.value += 1
      alert.value = { type: 'success', message: 'Usuario creado.' }
    }
    modalOpen.value = false
  } catch (error) {
    alert.value = { type: 'error', message: errorMessage(error, 'No se pudo guardar el usuario.') }
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
    await usuariosApi.remove(deleting.value.id)
    rows.value = rows.value.filter((row) => row.id !== deleting.value.id)
    total.value = Math.max(0, total.value - 1)
    confirmOpen.value = false
    alert.value = { type: 'success', message: 'Usuario eliminado.' }
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
        <h1>Usuarios</h1>
        <p>Gestiona los usuarios y su rol.</p>
      </div>
      <span class="badge">Día 4</span>
    </header>

    <p v-if="isBodeguero" class="notice">
      Estás viendo solo usuarios con rol <strong>cliente</strong>.
    </p>

    <label v-else class="filter">
      Filtrar por rol
      <select v-model="roleFilter" data-test="role-filter">
        <option value="">Todos</option>
        <option value="admin">admin</option>
        <option value="bodeguero">bodeguero</option>
        <option value="cliente">cliente</option>
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
      :title="editing ? 'Editar usuario' : 'Nuevo usuario'"
      :fields="fields"
      :model-value="form"
      :loading="saving"
      @update:model-value="form = $event"
      @submit="save"
      @close="modalOpen = false"
    />

    <ConfirmDelete
      :open="confirmOpen"
      title="Eliminar usuario"
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

.filter {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
}

.filter select {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 10px;
}

.notice {
  background: #eff6ff;
  border-left: 4px solid #2563eb;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 0.9rem;
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
