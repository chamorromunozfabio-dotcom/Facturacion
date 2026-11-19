<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AlertMessage from '../components/AlertMessage.vue'
import ConfirmDelete from '../components/ConfirmDelete.vue'
import DataTable from '../components/DataTable.vue'
import FormModal from '../components/FormModal.vue'
import rolesApi from '../api/roles'
import usuariosApi from '../api/usuarios'
import { getErrorMessage, isDuplicateError } from '../api/axios'
import { useAuthStore } from '../stores/auth'
import { tienePermiso } from '../config/permissions'

const auth = useAuthStore()
const isBodeguero = computed(() => auth.role === 'bodeguero')
const canCreate = computed(() => tienePermiso(auth.permisos, auth.role, 'usuarios', 'create'))
const canEdit = computed(() => tienePermiso(auth.permisos, auth.role, 'usuarios', 'edit'))
const canDelete = computed(() => tienePermiso(auth.permisos, auth.role, 'usuarios', 'delete'))

// Los roles NO son fijos: el admin puede crear otros y el backend los devuelve en GET /roles.
const ROLES_POR_DEFECTO = [
  { value: 1, label: 'admin' },
  { value: 2, label: 'bodeguero' },
  { value: 3, label: 'cliente' },
]
const IDS_POR_DEFECTO = Object.fromEntries(
  ROLES_POR_DEFECTO.map((rol) => [rol.label, rol.value]),
)
const rolesDisponibles = ref([])

const roleOptions = computed(() => {
  const activos = rolesDisponibles.value
    .filter((rol) => rol.estado !== false)
    .map((rol) => ({ value: rol.id, label: rol.nombre }))
  return activos.length ? activos : ROLES_POR_DEFECTO
})

function nombreRol(id) {
  return roleOptions.value.find((rol) => rol.value === Number(id))?.label ?? ''
}

function resolveRolId(row) {
  if (row.rol_id !== undefined && row.rol_id !== null && row.rol_id !== '') return row.rol_id
  return roleOptions.value.find((rol) => rol.label === row.rol)?.value ?? IDS_POR_DEFECTO[row.rol] ?? ''
}

const documentOptions = [
  { value: 'CC', label: 'CC' },
  { value: 'NIT', label: 'NIT' },
  { value: 'CE', label: 'CE' },
  { value: 'PA', label: 'PA' },
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
  { key: 'rol_id', label: 'Rol', type: 'select', required: true },
]
// El backend los acepta como opcionales para todos los roles (PA incluido).
const clienteFields = [
  {
    key: 'tipo_documento',
    label: 'Tipo de documento',
    type: 'select',
    options: documentOptions,
  },
  { key: 'numero_documento', label: 'Número de documento', maxLength: 20 },
  { key: 'telefono', label: 'Teléfono', pattern: phonePattern, message: phoneMessage },
  { key: 'direccion', label: 'Dirección' },
  { key: 'ciudad', label: 'Ciudad' },
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
  const list = baseFields.map((field) =>
    field.key === 'rol_id' ? { ...field, options: roleOptions.value } : { ...field },
  )
  if (nombreRol(form.value.rol_id) === 'cliente') list.push(...clienteFields)
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

/** Trae los roles reales del backend, incluidos los creados después del despliegue. */
async function cargarRoles() {
  try {
    const result = await rolesApi.list({ page: 1, limit: 100 })
    if (result.data?.length) rolesDisponibles.value = result.data
  } catch {
    // Si falla, seguimos con los tres roles por defecto para no bloquear el formulario.
  }
}

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

async function openCreate() {
  await cargarRoles()
  editing.value = null
  form.value = emptyForm()
  modalOpen.value = true
}

async function openEdit(row) {
  await cargarRoles()
  editing.value = row
  form.value = {
    nombre: row.nombre ?? '',
    correo: row.correo ?? '',
    contrasena: '',
    rol_id: resolveRolId(row),
    tipo_documento: row.tipo_documento ?? '',
    numero_documento: row.numero_documento ?? '',
    telefono: row.telefono ?? '',
    direccion: row.direccion ?? '',
    ciudad: row.ciudad ?? '',
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
        alert.value = { type: 'info', message: 'No hay cambios: el usuario ya estaba guardado.' }
        return
      }
      const updated = await usuariosApi.update(editing.value.id, changes)
      rows.value = rows.value.map((row) => (row.id === updated.id ? { ...row, ...updated } : row))
      alert.value = {
        type: 'success',
        message: 'Usuario actualizado. Los cambios ya están guardados.',
      }
    } else {
      const created = await usuariosApi.create(clean)
      rows.value = [created, ...rows.value]
      total.value += 1
      alert.value = {
        type: 'success',
        message: `Usuario creado. "${clean.nombre}" ya puede iniciar sesión.`,
      }
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
    alert.value = { type: 'success', message: 'Usuario eliminado. Ya no tiene acceso.' }
  } catch (error) {
    alert.value = { type: 'error', message: getErrorMessage(error) }
  } finally {
    removing.value = false
  }
}

onMounted(() => {
  cargarRoles()
  load()
})
</script>

<template>
  <section class="crud-page">
    <header class="crud-page__header">
      <div>
        <h1>Usuarios</h1>
        <p>Crea usuarios y asigna su rol de acceso.</p>
      </div>
      <span class="badge">Accesos</span>
    </header>

    <p v-if="isBodeguero" class="notice">
      Estás viendo solo usuarios con rol <strong>cliente</strong>.
    </p>

    <label v-else class="filter">
      Filtrar por rol
      <select v-model="roleFilter" data-test="role-filter">
        <option value="">Todos</option>
        <option
          v-for="rol in roleOptions"
          :key="rol.value"
          :value="rol.label"
          :data-test="`role-filter-option-${rol.value}`"
        >
          {{ rol.label }}
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
      create-label="Nuevo usuario"
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
      :submit-label="editing ? 'Guardar cambios' : 'Crear usuario'"
      :loading="saving"
      @update:model-value="form = $event"
      @submit="save"
      @close="modalOpen = false"
    />

    <ConfirmDelete
      :open="confirmOpen"
      title="Eliminar usuario"
      message="El usuario perderá el acceso. Esta acción no se puede deshacer."
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
