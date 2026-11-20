<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AlertMessage from '../components/ui/AlertMessage.vue'
import ConfirmDelete from '../components/ui/ConfirmDelete.vue'
import DataTable from '../components/ui/DataTable.vue'
import FormModal from '../components/ui/FormModal.vue'
import bodegasApi from '../api/bodegas'
import usuariosApi from '../api/usuarios'
import { getErrorMessage, isDuplicateError } from '../api/axios'
import { useAuthStore } from '../stores/auth'
import { tienePermiso } from '../config/permissions'

const auth = useAuthStore()
const canCreate = computed(() => tienePermiso(auth.permisos, auth.role, 'bodegas', 'create'))
const canEdit = computed(() => tienePermiso(auth.permisos, auth.role, 'bodegas', 'edit'))
const canDelete = computed(() => tienePermiso(auth.permisos, auth.role, 'bodegas', 'delete'))
// Solo el admin asigna el dueño; el backend filtra el resto de los roles.
const esAdmin = computed(() => auth.role === 'admin')
const bodegueroOptions = ref([])

// El admin ve todas las bodegas y su dueño; los demás solo ven las suyas.
const columns = computed(() => [
  { key: 'nombre', label: 'Nombre' },
  ...(esAdmin.value ? [{ key: 'bodeguero_nombre', label: 'Bodeguero' }] : []),
  { key: 'ciudad', label: 'Ciudad' },
  { key: 'recibe_nombre', label: 'Responsable' },
  { key: 'telefono', label: 'Teléfono' },
])

const phonePattern = /^[0-9+\- ]{7,20}$/
const phoneMessage = 'Usa entre 7 y 20 caracteres: dígitos, espacios, + o -.'

// El backend exige los 11 datos. `codigo`, `recibe_documento` y `recibe_cargo`
// tenían un largo distinto en el front; aquí van con el nuevo límite.
const fields = [
  { key: 'nombre', label: 'Nombre', required: true, maxLength: 100 },
  { key: 'codigo', label: 'Código', required: true, maxLength: 30 },
  { key: 'direccion', label: 'Dirección', required: true, maxLength: 200 },
  { key: 'ciudad', label: 'Ciudad', required: true, maxLength: 100 },
  { key: 'departamento', label: 'Departamento', required: true, maxLength: 100 },
  {
    key: 'telefono',
    label: 'Teléfono',
    required: true,
    maxLength: 30,
    pattern: phonePattern,
    message: phoneMessage,
  },
  { key: 'correo', label: 'Correo de la bodega', required: true, type: 'email', maxLength: 100 },
  { key: 'recibe_nombre', label: 'Nombre de quien recibe', required: true, maxLength: 100 },
  { key: 'recibe_documento', label: 'Documento de quien recibe', required: true, maxLength: 30 },
  { key: 'recibe_cargo', label: 'Cargo de quien recibe', required: true, maxLength: 100 },
  {
    key: 'recibe_telefono',
    label: 'Teléfono de quien recibe',
    required: true,
    maxLength: 30,
    pattern: phonePattern,
    message: phoneMessage,
  },
]

// Solo el admin puede asignar/cambiar el dueño; si no, el backend se lo asigna al creador.
const formFields = computed(() =>
  esAdmin.value
    ? [
        ...fields,
        {
          key: 'bodeguero_id',
          label: 'Bodeguero dueño',
          type: 'select',
          options: [{ value: '', label: 'Sin asignar' }, ...bodegueroOptions.value],
        },
      ]
    : fields,
)

const emptyForm = () => Object.fromEntries(formFields.value.map((field) => [field.key, '']))
const formFromRow = (row) =>
  Object.fromEntries(
    formFields.value.map((field) => [
      field.key,
      field.key === 'bodeguero_id' ? String(row[field.key] ?? '') : row[field.key] ?? '',
    ]),
  )

const rows = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)
const q = ref('')
const loading = ref(false)
const alert = ref(null)

const modalOpen = ref(false)
const editing = ref(null)
const form = ref(emptyForm())
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
    const result = await bodegasApi.list({ q: q.value, page: page.value, limit: limit.value })
    rows.value = result.data ?? []
    total.value = result.total ?? 0
  } catch (error) {
    alert.value = { type: 'error', message: getErrorMessage(error) }
  } finally {
    loading.value = false
  }
}

async function loadBodegueros() {
  if (!esAdmin.value) return
  try {
    const result = await usuariosApi.list({ rol: 'bodeguero', page: 1, limit: 100 })
    bodegueroOptions.value = (result.data ?? []).map((user) => ({
      value: user.id,
      label: user.nombre,
    }))
  } catch {
    bodegueroOptions.value = []
  }
}

function openCreate() {
  editing.value = null
  form.value = emptyForm()
  modalOpen.value = true
}

function openEdit(row) {
  editing.value = row
  form.value = formFromRow(row)
  modalOpen.value = true
}

// Todos los datos son obligatorios: no filtramos vacíos para que el usuario
// vea el aviso en el campo en vez de un error raro del backend.
function cleanPayload(payload) {
  const limpio = Object.fromEntries(
    Object.entries(payload).filter(([key]) => key !== 'bodeguero_id'),
  )
  if (typeof limpio.codigo === 'string') limpio.codigo = limpio.codigo.trim().toUpperCase()
  return limpio
}

// El PUT acepta campos parciales: enviamos solo lo que cambió.
function changedFields(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => {
      if (key === 'bodeguero_id') {
        return String(value ?? '') !== String(editing.value?.[key] ?? '')
      }
      return value !== editing.value?.[key]
    }),
  )
}

function errorMessage(error, fallback) {
  if (isDuplicateError(error)) return 'Ya existe una bodega con ese nombre. Probá con otro.'
  return getErrorMessage(error) || fallback
}

async function save(payload) {
  saving.value = true
  const clean = cleanPayload(payload)
  if (esAdmin.value && payload.bodeguero_id) {
    clean.bodeguero_id = Number(payload.bodeguero_id)
  } else if (esAdmin.value && editing.value?.bodeguero_id != null) {
    // Al dejar "Sin asignar" en una edición, quitamos el dueño actual.
    clean.bodeguero_id = null
  }
  try {
    if (editing.value) {
      const changes = changedFields(clean)
      if (Object.keys(changes).length === 0) {
        modalOpen.value = false
        alert.value = { type: 'info', message: 'No hay cambios: la bodega ya estaba guardada.' }
        return
      }
      const updated = await bodegasApi.update(editing.value.id, changes)
      const merged = { ...editing.value, ...updated }
      rows.value = rows.value.map((row) => (row.id === merged.id ? merged : row))
      alert.value = { type: 'success', message: 'Bodega actualizada. Los cambios ya están guardados.' }
    } else {
      const created = await bodegasApi.create(clean)
      rows.value = [created, ...rows.value]
      total.value += 1
      alert.value = {
        type: 'success',
        message: `Bodega creada. "${created.nombre ?? payload.nombre}" ya está en la lista.`,
      }
    }
    modalOpen.value = false
  } catch (error) {
    alert.value = { type: 'error', message: errorMessage(error, 'No se pudo guardar la bodega.') }
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
    await bodegasApi.remove(deleting.value.id)
    rows.value = rows.value.filter((row) => row.id !== deleting.value.id)
    total.value = Math.max(0, total.value - 1)
    confirmOpen.value = false
    alert.value = { type: 'success', message: 'Bodega eliminada. Ya no aparece en la lista.' }
  } catch (error) {
    alert.value = { type: 'error', message: getErrorMessage(error) }
  } finally {
    removing.value = false
  }
}

onMounted(() => {
  load()
  loadBodegueros()
})
</script>

<template>
  <section class="crud-page">
    <header class="crud-page__header">
      <div>
        <h1>Bodegas</h1>
        <p>Administra las bodegas y sus datos de contacto.</p>
      </div>
      <span class="badge">Inventario</span>
    </header>

    <p class="notice">
      {{
        esAdmin
          ? 'Puedes asignar el bodeguero dueño de cada bodega.'
          : 'Solo ves y gestionas las bodegas que te pertenecen.'
      }}
    </p>

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
      create-label="Nueva bodega"
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
      :title="editing ? 'Editar bodega' : 'Nueva bodega'"
      :fields="formFields"
      :model-value="form"
      :submit-label="editing ? 'Guardar cambios' : 'Crear bodega'"
      :loading="saving"
      @update:model-value="form = $event"
      @submit="save"
      @close="modalOpen = false"
    />

    <ConfirmDelete
      :open="confirmOpen"
      title="Eliminar bodega"
      message="La bodega se eliminará de forma permanente. Esta acción no se puede deshacer."
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
  background: #fffbeb;
  border-left: 4px solid #f59e0b;
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
