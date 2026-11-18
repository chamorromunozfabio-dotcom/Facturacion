<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AlertMessage from '../components/AlertMessage.vue'
import ConfirmDelete from '../components/ConfirmDelete.vue'
import DataTable from '../components/DataTable.vue'
import FormModal from '../components/FormModal.vue'
import permisosApi from '../api/permisos'
import rolesApi from '../api/roles'
import usuariosApi from '../api/usuarios'
import { getErrorMessage, isDuplicateError } from '../api/axios'
import { useAuthStore } from '../stores/auth'
import { hasPermission } from '../config/permissions'

const auth = useAuthStore()
const canCreate = computed(() => hasPermission(auth.role, 'permisos', 'create'))
const canEdit = computed(() => hasPermission(auth.role, 'permisos', 'edit'))
const canDelete = computed(() => hasPermission(auth.role, 'permisos', 'delete'))

/* ------------------------------------------------------------------
 * 1) Asignación de permisos (lo que pide el negocio)
 * El backend no tiene permisos por usuario: los guarda en el ROL.
 * Elegimos un usuario para ver su rol y marcamos lo que ese rol puede hacer.
 * ------------------------------------------------------------------ */
const roles = ref([])
const todosLosPermisos = ref([])
const usuarios = ref([])
const rolSeleccionadoId = ref(null)
const permisosSeleccionados = ref([])
const cargandoAsignacion = ref(false)
const guardandoPermisos = ref(false)
const mensajeAsignacion = ref(null)

const rolSeleccionado = computed(
  () => roles.value.find((rol) => rol.id === rolSeleccionadoId.value) ?? null,
)
const usuariosDelRol = computed(() =>
  usuarios.value.filter((usuario) => usuario.rol_id === rolSeleccionadoId.value),
)
const idsActuales = computed(() =>
  (rolSeleccionado.value?.permisos ?? []).map((permiso) => permiso.id).sort((a, b) => a - b),
)
const idsSeleccionados = computed(() => [...permisosSeleccionados.value].sort((a, b) => a - b))
const hayCambios = computed(
  () => JSON.stringify(idsActuales.value) !== JSON.stringify(idsSeleccionados.value),
)

async function loadAssignment() {
  cargandoAsignacion.value = true
  try {
    const [listaRoles, listaPermisos, listaUsuarios] = await Promise.all([
      rolesApi.list({ page: 1, limit: 100 }),
      permisosApi.list({ q: '', page: 1, limit: 100 }),
      usuariosApi.list({ page: 1, limit: 100 }),
    ])
    roles.value = listaRoles.data ?? []
    todosLosPermisos.value = listaPermisos.data ?? []
    usuarios.value = listaUsuarios.data ?? []

    if (!rolSeleccionadoId.value && roles.value.length) {
      rolSeleccionadoId.value = roles.value[0].id
    } else {
      sincronizarPermisos()
    }
  } catch (error) {
    mensajeAsignacion.value = { type: 'error', message: getErrorMessage(error) }
  } finally {
    cargandoAsignacion.value = false
  }
}

function sincronizarPermisos() {
  permisosSeleccionados.value = (rolSeleccionado.value?.permisos ?? []).map(
    (permiso) => permiso.id,
  )
}

watch(rolSeleccionadoId, sincronizarPermisos)

function seleccionarUsuario(valor) {
  const usuario = usuarios.value.find((item) => String(item.id) === String(valor))
  if (usuario?.rol_id != null) rolSeleccionadoId.value = Number(usuario.rol_id)
}

function togglePermiso(id, marcado) {
  permisosSeleccionados.value = marcado
    ? [...permisosSeleccionados.value, Number(id)]
    : permisosSeleccionados.value.filter((permisoId) => permisoId !== Number(id))
}

async function guardarPermisos() {
  if (!rolSeleccionado.value || !hayCambios.value) return
  guardandoPermisos.value = true
  mensajeAsignacion.value = null
  try {
    const rolActualizado = await rolesApi.setPermisos(
      rolSeleccionado.value.id,
      idsSeleccionados.value,
    )
    roles.value = roles.value.map((rol) =>
      rol.id === rolActualizado.id ? { ...rol, ...rolActualizado } : rol,
    )
    sincronizarPermisos()
    mensajeAsignacion.value = {
      type: 'success',
      message: `Permisos de "${rolActualizado.nombre}" actualizados.`,
    }
  } catch (error) {
    mensajeAsignacion.value = {
      type: 'error',
      message: getErrorMessage(error) || 'No se pudieron guardar los permisos.',
    }
  } finally {
    guardandoPermisos.value = false
  }
}

/* ------------------------------------------------------------------
 * 2) CRUD de permisos (se mantiene igual)
 * ------------------------------------------------------------------ */
const columns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'estado', label: 'Estado' },
]
const fields = [
  { key: 'nombre', label: 'Nombre', required: true, maxLength: 100 },
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
    const result = await permisosApi.list({ q: q.value, page: page.value, limit: limit.value })
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
  if (isDuplicateError(error)) return 'Ya existe un permiso con ese nombre. Probá con otro.'
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
      const updated = await permisosApi.update(editing.value.id, changes)
      const merged = { ...editing.value, ...updated }
      rows.value = rows.value.map((row) => (row.id === merged.id ? merged : row))
      alert.value = { type: 'success', message: 'Permiso actualizado.' }
    } else {
      const created = await permisosApi.create(payload)
      rows.value = [created, ...rows.value]
      total.value += 1
      alert.value = { type: 'success', message: 'Permiso creado.' }
    }
    modalOpen.value = false
  } catch (error) {
    alert.value = { type: 'error', message: errorMessage(error, 'No se pudo guardar el permiso.') }
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
    await permisosApi.remove(deleting.value.id)
    rows.value = rows.value.filter((row) => row.id !== deleting.value.id)
    total.value = Math.max(0, total.value - 1)
    confirmOpen.value = false
    alert.value = { type: 'success', message: 'Permiso eliminado.' }
  } catch (error) {
    alert.value = { type: 'error', message: getErrorMessage(error) }
  } finally {
    removing.value = false
  }
}

onMounted(() => {
  load()
  loadAssignment()
})
</script>

<template>
  <section class="crud-page">
    <header class="crud-page__header">
      <div>
        <h1>Permisos</h1>
        <p>Da o quita accesos, y crea los permisos que existirán en el sistema.</p>
      </div>
      <span class="badge">Solo administrador</span>
    </header>

    <Transition name="alert">
      <AlertMessage
        v-if="alert"
        :type="alert.type"
        :message="alert.message"
        @close="alert = null"
      />
    </Transition>

    <section class="assignment">
      <header class="assignment__header">
        <div>
          <h2>Dar o quitar permisos</h2>
          <p class="assignment__hint">
            El backend guarda los permisos en el <strong>rol</strong>, no en cada usuario. Elegí un
            usuario para ver su rol; al guardar, el cambio alcanza a todos los usuarios de ese rol.
          </p>
        </div>
      </header>

      <Transition name="alert">
        <AlertMessage
          v-if="mensajeAsignacion"
          :type="mensajeAsignacion.type"
          :message="mensajeAsignacion.message"
          @close="mensajeAsignacion = null"
        />
      </Transition>

      <div class="assignment__selectors">
        <label>
          <span>Usuario</span>
          <select data-test="assignment-user" @change="seleccionarUsuario($event.target.value)">
            <option value="">Elige un usuario (opcional)</option>
            <option v-for="usuario in usuarios" :key="usuario.id" :value="usuario.id">
              {{ usuario.nombre }} — {{ usuario.rol }}
            </option>
          </select>
        </label>

        <label>
          <span>Rol</span>
          <select v-model.number="rolSeleccionadoId" data-test="assignment-role">
            <option v-for="rol in roles" :key="rol.id" :value="rol.id">
              {{ rol.nombre }}
            </option>
          </select>
        </label>
      </div>

      <p v-if="cargandoAsignacion" class="assignment__loading">Cargando roles y permisos...</p>

      <template v-else-if="rolSeleccionado">
        <p class="assignment__affected" data-test="affected-users">
          Usuarios con el rol <strong>{{ rolSeleccionado.nombre }}</strong>:
          {{ usuariosDelRol.length ? usuariosDelRol.map((u) => u.nombre).join(', ') : 'ninguno' }}.
        </p>

        <fieldset class="assignment__list">
          <legend>Permisos de {{ rolSeleccionado.nombre }}</legend>
          <p v-if="todosLosPermisos.length === 0" class="assignment__empty">
            Todavía no hay permisos creados. Creá uno en la tabla de abajo.
          </p>
          <label
            v-for="permiso in todosLosPermisos"
            :key="permiso.id"
            class="assignment__option"
            :data-test="`permiso-option-${permiso.id}`"
          >
            <input
              type="checkbox"
              :data-test="`permiso-check-${permiso.id}`"
              :checked="permisosSeleccionados.includes(permiso.id)"
              @change="togglePermiso(permiso.id, $event.target.checked)"
            />
            <span>
              <strong>{{ permiso.nombre }}</strong>
              <small v-if="permiso.descripcion">— {{ permiso.descripcion }}</small>
            </span>
          </label>
        </fieldset>

        <div class="assignment__actions">
          <button
            data-test="save-permisos"
            type="button"
            class="btn btn--primary"
            :disabled="!hayCambios || guardandoPermisos"
            @click="guardarPermisos"
          >
            {{ guardandoPermisos ? 'Guardando...' : 'Guardar permisos' }}
          </button>
          <span v-if="!hayCambios" class="assignment__note">Sin cambios por guardar.</span>
        </div>
      </template>

      <p v-else class="assignment__empty">No hay roles cargados.</p>
    </section>

    <section class="catalog">
      <h2>Catálogo de permisos</h2>
      <DataTable
        :columns="columns"
        :rows="rows"
        :total="total"
        :page="page"
        :limit="limit"
        :q="q"
        :loading="loading"
        create-label="Nuevo permiso"
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
    </section>

    <FormModal
      :open="modalOpen"
      :title="editing ? 'Editar permiso' : 'Nuevo permiso'"
      :fields="fields"
      :model-value="form"
      :submit-label="editing ? 'Guardar cambios' : 'Crear permiso'"
      :loading="saving"
      @update:model-value="form = $event"
      @submit="save"
      @close="modalOpen = false"
    />

    <ConfirmDelete
      :open="confirmOpen"
      title="Eliminar permiso"
      message="El permiso se eliminará de forma permanente. Esta acción no se puede deshacer."
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

h2 {
  margin: 0;
  font-size: 1.1rem;
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

.assignment,
.catalog {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 6%);
}

.assignment__header,
.assignment__selectors,
.assignment__actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.assignment__hint {
  max-width: 760px;
  font-size: 0.9rem;
  line-height: 1.5;
}

.assignment__selectors label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.85rem;
  color: #374151;
}

.assignment__selectors select {
  min-width: 220px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 10px;
  background: #fff;
}

.assignment__affected {
  font-size: 0.9rem;
}

.assignment__list {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px 16px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 8px;
}

.assignment__list legend {
  padding: 0 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
}

.assignment__option {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 4px;
  cursor: pointer;
  font-size: 0.95rem;
}

.assignment__option small {
  color: #6b7280;
}

.assignment__note,
.assignment__empty,
.assignment__loading {
  font-size: 0.85rem;
  color: #6b7280;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--primary {
  background: #4f46e5;
  border-color: #4f46e5;
  color: #fff;
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
