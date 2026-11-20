<script setup>
import CrudPage from '../components/ui/CrudPage.vue'
import { computed, ref } from 'vue'
import rolesApi from '../api/roles'
import usuariosApi from '../api/usuarios'
import { quitarVacios } from '../utils/crud'
import { useAuthStore } from '../stores/auth'
import { useCrud } from '../composables/useCrud'

const auth = useAuthStore()
const isBodeguero = computed(() => auth.role === 'bodeguero')
const roleFilter = ref('')

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

/** Trae los roles reales del backend, incluidos los creados después del despliegue. */
async function cargarRoles() {
  try {
    const result = await rolesApi.list({ page: 1, limit: 100 })
    if (result.data?.length) rolesDisponibles.value = result.data
  } catch {
    // Si falla, seguimos con los tres roles por defecto para no bloquear el formulario.
  }
}

function cleanPayload(payload) {
  const clean = quitarVacios(payload)
  if (clean.rol_id !== undefined) clean.rol_id = Number(clean.rol_id)
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
  openCreate,
  openEdit,
  save,
  askDelete,
  confirmDelete,
} = useCrud({
  modulo: 'usuarios',
  api: usuariosApi,
  columns,
  fields,
  createLabel: 'Nuevo usuario',
  emptyForm: () => Object.fromEntries(fields.value.map((field) => [field.key, ''])),
  formFromRow: (row) => ({
    nombre: row.nombre ?? '',
    correo: row.correo ?? '',
    contrasena: '',
    rol_id: resolveRolId(row),
    tipo_documento: row.tipo_documento ?? '',
    numero_documento: row.numero_documento ?? '',
    telefono: row.telefono ?? '',
    direccion: row.direccion ?? '',
    ciudad: row.ciudad ?? '',
  }),
  cleanPayload,
  duplicateMessage: 'Ya existe un usuario con ese correo. Probá con otro.',
  mensajes: {
    creado: (clean) => `Usuario creado. "${clean.nombre}" ya puede iniciar sesión.`,
    actualizado: 'Usuario actualizado. Los cambios ya están guardados.',
    eliminado: 'Usuario eliminado. Ya no tiene acceso.',
    sinCambios: 'No hay cambios: el usuario ya estaba guardado.',
    fallbackGuardar: 'No se pudo guardar el usuario.',
  },
  confirmacion: {
    titulo: 'Eliminar usuario',
    mensaje: 'El usuario perderá el acceso. Esta acción no se puede deshacer.',
  },
  paramsExtra: () => (effectiveRole.value ? { rol: effectiveRole.value } : {}),
  filtros: [roleFilter],
  antesDeAbrir: cargarRoles,
  alMontar: cargarRoles,
})
</script>

<template>
  <CrudPage
    titulo="Usuarios"
    descripcion="Crea usuarios y asigna su rol de acceso."
    badge="Accesos"
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
    crear-titulo="Nuevo usuario"
    editar-titulo="Editar usuario"
    crear-submit-label="Crear usuario"
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
    <template #notice>
      <p v-if="isBodeguero" class="notice">
        Estás viendo solo usuarios con rol <strong>cliente</strong>.
      </p>
    </template>

    <template #filter>
      <label v-if="!isBodeguero" class="filter">
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
    </template>
  </CrudPage>
</template>

<style scoped>
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
</style>
