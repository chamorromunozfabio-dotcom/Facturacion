<script setup>
import CrudPage from '../components/ui/CrudPage.vue'
import { computed, ref } from 'vue'
import bodegasApi from '../api/bodegas'
import usuariosApi from '../api/usuarios'
import { useAuthStore } from '../stores/auth'
import { useCrud } from '../composables/useCrud'

const auth = useAuthStore()
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

// Todos los datos son obligatorios: no filtramos vacíos para que el usuario
// vea el aviso en el campo en vez de un error raro del backend.
function cleanPayload(payload) {
  const limpio = Object.fromEntries(
    Object.entries(payload).filter(([key]) => key !== 'bodeguero_id'),
  )
  if (typeof limpio.codigo === 'string') limpio.codigo = limpio.codigo.trim().toUpperCase()
  if (esAdmin.value && payload.bodeguero_id) {
    limpio.bodeguero_id = Number(payload.bodeguero_id)
  } else if (esAdmin.value && editing.value?.bodeguero_id != null) {
    // Al dejar "Sin asignar" en una edición, quitamos el dueño actual.
    limpio.bodeguero_id = null
  }
  return limpio
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
  modulo: 'bodegas',
  api: bodegasApi,
  columns,
  fields: formFields,
  createLabel: 'Nueva bodega',
  emptyForm,
  formFromRow,
  cleanPayload,
  // El dueño puede venir como número o como string según el backend.
  normalizarCambio: (key, valor) => (key === 'bodeguero_id' ? String(valor ?? '') : valor),
  duplicateMessage: 'Ya existe una bodega con ese nombre. Probá con otro.',
  mensajes: {
    creado: (clean) => `Bodega creada. "${clean.nombre}" ya está en la lista.`,
    actualizado: 'Bodega actualizada. Los cambios ya están guardados.',
    eliminado: 'Bodega eliminada. Ya no aparece en la lista.',
    sinCambios: 'No hay cambios: la bodega ya estaba guardada.',
    fallbackGuardar: 'No se pudo guardar la bodega.',
  },
  confirmacion: {
    titulo: 'Eliminar bodega',
    mensaje: 'La bodega se eliminará de forma permanente. Esta acción no se puede deshacer.',
  },
  alMontar: loadBodegueros,
})
</script>

<template>
  <CrudPage
    titulo="Bodegas"
    descripcion="Administra las bodegas y sus datos de contacto."
    badge="Inventario"
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
    :fields="formFields"
    :form="form"
    :saving="saving"
    crear-titulo="Nueva bodega"
    editar-titulo="Editar bodega"
    crear-submit-label="Crear bodega"
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
      <p class="notice">
        {{
          esAdmin
            ? 'Puedes asignar el bodeguero dueño de cada bodega.'
            : 'Solo ves y gestionas las bodegas que te pertenecen.'
        }}
      </p>
    </template>
  </CrudPage>
</template>

<style scoped>
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
</style>
