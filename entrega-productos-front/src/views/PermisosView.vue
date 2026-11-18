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
 * 1) Asignación de permisos POR USUARIO (contrato publicado por el backend)
 * El rol es solo la plantilla al crear usuarios: cambiar el rol no cambia
 * los permisos de quien ya existe. Guardamos con PUT /usuarios/{id}/permisos.
 * ------------------------------------------------------------------ */
const roles = ref([])
const todosLosPermisos = ref([])
const usuarios = ref([])
const usuarioSeleccionadoId = ref(null)
const permisosSeleccionados = ref([])
const permisosIniciales = ref([])
const cargandoAsignacion = ref(false)
const guardandoPermisos = ref(false)
const mensajeAsignacion = ref(null)

const usuarioSeleccionado = computed(
  () => usuarios.value.find((usuario) => usuario.id === usuarioSeleccionadoId.value) ?? null,
)
const rolDelUsuario = computed(
  () => roles.value.find((rol) => rol.id === usuarioSeleccionado.value?.rol_id) ?? null,
)
const idsActuales = computed(() => [...permisosIniciales.value].sort((a, b) => a - b))
const idsSeleccionados = computed(() => [...permisosSeleccionados.value].sort((a, b) => a - b))
const hayCambios = computed(
  () => JSON.stringify(idsActuales.value) !== JSON.stringify(idsSeleccionados.value),
)

async function loadAssignment() {
  cargandoAsignacion.value = true
  try {
    const [listaUsuarios, listaPermisos, listaRoles] = await Promise.all([
      usuariosApi.list({ page: 1, limit: 100 }),
      permisosApi.list({ q: '', page: 1, limit: 100 }),
      rolesApi.list({ page: 1, limit: 100 }),
    ])
    usuarios.value = listaUsuarios.data ?? []
    todosLosPermisos.value = listaPermisos.data ?? []
    roles.value = listaRoles.data ?? []

    const preferido = usersPreferidos()[0]
    if (preferido) {
      usuarioSeleccionadoId.value = preferido.id
      await cargarPermisosDelUsuario()
    }
  } catch (error) {
    mensajeAsignacion.value = { type: 'error', message: getErrorMessage(error) }
  } finally {
    cargandoAsignacion.value = false
  }
}

/** Dejamos arriba al admin en turno para que vea sus propios permisos. */
function usersPreferidos() {
  const propio = usuarios.value.find((usuario) => usuario.id === auth.user?.id)
  return propio ? [propio, ...usuarios.value.filter((u) => u.id !== propio.id)] : usuarios.value
}

async function cargarPermisosDelUsuario() {
  if (!usuarioSeleccionadoId.value) {
    permisosIniciales.value = []
    permisosSeleccionados.value = []
    return
  }
  try {
    const resultado = await usuariosApi.listPermisos(usuarioSeleccionadoId.value)
    const ids = (resultado.data ?? []).map((permiso) => permiso.id)
    permisosIniciales.value = ids
    permisosSeleccionados.value = [...ids]
  } catch (error) {
    mensajeAsignacion.value = { type: 'error', message: getErrorMessage(error) }
  }
}

function seleccionarUsuario(valor) {
  usuarioSeleccionadoId.value = valor === '' ? null : Number(valor)
  cargarPermisosDelUsuario()
}

function togglePermiso(id, marcado) {
  permisosSeleccionados.value = marcado
    ? [...permisosSeleccionados.value, Number(id)]
    : permisosSeleccionados.value.filter((permisoId) => permisoId !== Number(id))
}

async function guardarPermisos() {
  if (!usuarioSeleccionado.value || !hayCambios.value) return
  guardandoPermisos.value = true
  mensajeAsignacion.value = null
  try {
    const usuarioActualizado = await usuariosApi.setPermisos(
      usuarioSeleccionado.value.id,
      idsSeleccionados.value,
    )
    usuarios.value = usuarios.value.map((usuario) =>
      usuario.id === usuarioActualizado.id ? { ...usuario, ...usuarioActualizado } : usuario,
    )
    const ids = (usuarioActualizado.permisos ?? []).map((permiso) => permiso.id)
    permisosIniciales.value = ids
    permisosSeleccionados.value = [...ids]
    mensajeAsignacion.value = {
      type: 'success',
      message: `Permisos de "${usuarioActualizado.nombre}" actualizados.`,
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
            Los permisos son de <strong>cada usuario</strong>. El rol solo es la plantilla al crearlo:
            cambiar el rol después no modifica los permisos de usuarios que ya existen.
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
          <select
            data-test="assignment-user"
            :value="usuarioSeleccionadoId ?? ''"
            @change="seleccionarUsuario($event.target.value)"
          >
            <option value="">Elige un usuario</option>
            <option v-for="usuario in usuarios" :key="usuario.id" :value="usuario.id">
              {{ usuario.nombre }} — {{ usuario.rol }}
            </option>
          </select>
        </label>
      </div>

      <p v-if="cargandoAsignacion" class="assignment__loading">Cargando usuarios y permisos...</p>

      <template v-else-if="usuarioSeleccionado">
        <p class="assignment__affected" data-test="assignment-affected">
          Editando los permisos de <strong>{{ usuarioSeleccionado.nombre }}</strong>
          <template v-if="rolDelUsuario"> (rol {{ rolDelUsuario.nombre }})</template>.
        </p>

        <fieldset class="assignment__list">
          <legend>Permisos de {{ usuarioSeleccionado.nombre }}</legend>
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

      <p v-else class="assignment__empty">No hay usuarios cargados.</p>
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
