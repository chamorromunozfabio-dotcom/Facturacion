<script setup>
import { computed, ref } from 'vue'
import CrudPage from '../../../shared/ui/CrudPage.vue'
import permisosApi from '../../permisos/api/permisos'
import rolesApi from '../api/roles'
import RolPermisosField from '../components/RolPermisosField.vue'
import { useCrud } from '../composables/useCrud'
import { changedFields, errorMessage } from '../utils/crud'

const ROLES_BASE = new Set(['admin', 'bodeguero', 'empresa', 'cliente'])
const permisosBackend = ref([])
const permisosIds = ref([])

async function cargarPermisos() {
  try {
    const result = await permisosApi.list({ page: 1, limit: 100 })
    permisosBackend.value = result.data ?? []
  } catch {
    permisosBackend.value = []
  }
}

const esRolBase = computed(() => Boolean(editing.value && ROLES_BASE.has(editing.value.nombre)))

const fields = computed(() => [
  {
    key: 'nombre',
    label: 'Nombre',
    required: true,
    maxLength: 50,
    disabled: esRolBase.value,
    hint: esRolBase.value ? 'Los roles base del sistema no se pueden renombrar.' : '',
  },
  { key: 'descripcion', label: 'Descripción', type: 'textarea', maxLength: 255 },
])

const {
  canCreate,
  canEdit,
  canDelete,
  columnas: columns,
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
  askDelete,
  confirmDelete,
} = useCrud({
  modulo: 'roles',
  api: rolesApi,
  columns: [
    { key: 'nombre', label: 'Nombre' },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'permisos', label: 'Permisos' },
    { key: 'estado', label: 'Estado' },
  ],
  fields,
  createLabel: 'Nuevo rol',
  emptyForm: () => ({ nombre: '', descripcion: '' }),
  formFromRow: (row) => ({ nombre: row.nombre ?? '', descripcion: row.descripcion ?? '' }),
  alMontar: cargarPermisos,
  confirmacion: {
    titulo: 'Eliminar rol',
    mensaje: 'El rol se eliminará de forma permanente. Esta acción no se puede deshacer.',
  },
})

function abrirCrear() {
  permisosIds.value = []
  openCreate()
}

function abrirEditar(row) {
  permisosIds.value = (row.permisos ?? []).map((permiso) => Number(permiso.id))
  openEdit(row)
}

function mismosIds(a, b) {
  return a.length === b.length && b.every((id) => a.includes(id))
}

async function guardarRol(payload) {
  saving.value = true
  const clean = {
    nombre: String(payload.nombre ?? '').trim(),
    descripcion: String(payload.descripcion ?? '').trim(),
  }
  try {
    if (editing.value) {
      const changes = changedFields(clean, editing.value)
      if (esRolBase.value) delete changes.nombre
      const idsOriginales = (editing.value.permisos ?? []).map((permiso) => Number(permiso.id))
      const cambiaronPermisos = !mismosIds(permisosIds.value, idsOriginales)

      if (Object.keys(changes).length === 0 && !cambiaronPermisos) {
        modalOpen.value = false
        alert.value = { type: 'info', message: 'No hay cambios: el rol ya estaba guardado.' }
        return
      }

      let merged = { ...editing.value }
      if (Object.keys(changes).length > 0) {
        merged = { ...merged, ...(await rolesApi.update(editing.value.id, changes)) }
      }
      if (cambiaronPermisos) {
        merged = { ...merged, ...(await rolesApi.setPermisos(editing.value.id, permisosIds.value)) }
      }
      rows.value = rows.value.map((row) => (row.id === merged.id ? merged : row))
      alert.value = { type: 'success', message: 'Rol actualizado. Los cambios ya están guardados.' }
    } else {
      let created = await rolesApi.create(clean)
      if (permisosIds.value.length > 0) {
        created = { ...created, ...(await rolesApi.setPermisos(created.id, permisosIds.value)) }
      }
      rows.value = [created, ...rows.value]
      total.value += 1
      alert.value = { type: 'success', message: `Rol creado. "${created.nombre}" ya está disponible con sus permisos.` }
    }
    modalOpen.value = false
  } catch (error) {
    alert.value = {
      type: 'error',
      message: errorMessage(error, 'No se pudo guardar el rol.', 'Ya existe un rol con ese nombre. Probá con otro.'),
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <CrudPage
    titulo="Roles"
    descripcion="Crea roles con sus permisos plantilla y asígnalos a cada usuario."
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
    crear-titulo="Nuevo rol"
    editar-titulo="Editar rol"
    crear-submit-label="Crear rol"
    :confirm-open="confirmOpen"
    :confirm-titulo="confirmacion.titulo"
    :confirm-mensaje="confirmacion.mensaje"
    :deleting="deleting"
    :removing="removing"
    @update:q="q = $event"
    @update:page="page = $event"
    @create="abrirCrear"
    @edit="abrirEditar"
    @delete="askDelete"
    @update:model-value="form = $event"
    @submit="guardarRol"
    @close-modal="modalOpen = false"
    @confirm="confirmDelete"
    @cancel="confirmOpen = false"
    @close-alert="alert = null"
  >
    <template #cell-permisos="{ value }">
      <span>{{ Array.isArray(value) ? `${value.length} permisos` : '0 permisos' }}</span>
    </template>
    <template #cell-estado="{ value }">
      <span :class="value ? 'estado--activo' : 'estado--inactivo'">
        {{ value ? 'Activo' : 'Inactivo' }}
      </span>
    </template>
    <template #form-extra>
      <RolPermisosField v-model="permisosIds" :permisos-backend="permisosBackend" />
    </template>
  </CrudPage>
</template>

<style scoped>
.estado--activo { color: #047857; font-weight: 600; }
.estado--inactivo { color: #9ca3af; }
</style>
