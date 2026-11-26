<script setup>
import { computed } from 'vue'
import CrudPage from '../../../shared/ui/CrudPage.vue'
import usuariosApi from '../api/usuarios'
import { useCrud } from '../composables/useCrud'
import { quitarVacios } from '../utils/crud'

const emit = defineEmits(['changed'])

const columns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'correo', label: 'Correo' },
  { key: 'numero_documento', label: 'Documento' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'estado', label: 'Estado' },
]

const baseFields = [
  { key: 'nombre', label: 'Nombre', required: true, maxLength: 100 },
  {
    key: 'correo',
    label: 'Correo',
    type: 'email',
    required: true,
    noSpaces: true,
    hint: 'Ej. bodeguero@empresa.com.',
  },
  {
    key: 'contrasena',
    label: 'Contraseña',
    type: 'password',
    required: true,
    minLength: 8,
    hint: 'Mínimo 8 caracteres.',
  },
  {
    key: 'numero_documento',
    label: 'Número de documento',
    digitsOnly: true,
    maxLength: 20,
    hint: 'Solo números; se usará al asignarlo a una bodega.',
  },
  {
    key: 'telefono',
    label: 'Teléfono',
    digitsOnly: true,
    maxLength: 15,
    pattern: /^[0-9]{7,15}$/,
    message: 'Solo dígitos: entre 7 y 15.',
    hint: 'Solo números, entre 7 y 15.',
  },
]

const fields = computed(() =>
  baseFields.map((field) =>
    editing.value && field.key === 'contrasena'
      ? { ...field, required: false, label: 'Contraseña (vacía = no cambiar)' }
      : field,
  ),
)

const {
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
  confirmacion,
  openCreate,
  openEdit,
  save,
  askDelete,
  confirmDelete,
  toggleEstado,
} = useCrud({
  modulo: 'usuarios',
  api: usuariosApi,
  columns,
  fields,
  createLabel: 'Nuevo bodeguero',
  emptyForm: () => ({
    nombre: '',
    correo: '',
    contrasena: '',
    numero_documento: '',
    telefono: '',
  }),
  formFromRow: (row) => ({
    nombre: row.nombre ?? '',
    correo: row.correo ?? '',
    contrasena: '',
    numero_documento: row.numero_documento ?? '',
    telefono: row.telefono ?? '',
  }),
  cleanPayload: (payload) => {
    const clean = quitarVacios(payload)
    delete clean.rol_id
    delete clean.empresa_id
    return clean
  },
  paramsExtra: () => ({ rol: 'bodeguero' }),
  duplicateMessage: 'Ya existe un usuario con ese correo. Probá con otro.',
  mensajes: {
    creado: (clean) => `Bodeguero "${clean.nombre}" creado. Ya puedes asignarle bodegas.`,
    actualizado: 'Bodeguero actualizado. Los cambios ya están guardados.',
    eliminado: 'Bodeguero eliminado de tu equipo.',
    sinCambios: 'No hay cambios: el bodeguero ya estaba guardado.',
    fallbackGuardar: 'No se pudo guardar el bodeguero.',
  },
  confirmacion: {
    titulo: 'Eliminar bodeguero',
    mensaje: 'El bodeguero perderá el acceso. Esta acción no se puede deshacer.',
  },
  despuesDeGuardar: () => emit('changed'),
})

async function confirmarEliminar() {
  await confirmDelete()
  emit('changed')
}
</script>

<template>
  <CrudPage
    titulo="Mis bodegueros"
    descripcion="Crea, edita o elimina los bodegueros de tu empresa para asignarlos a tus bodegas."
    badge="Equipo"
    :alert="alert"
    :columns="columns"
    :rows="rows"
    :total="total"
    :page="page"
    :limit="limit"
    :q="q"
    :loading="loading"
    create-label="Nuevo bodeguero"
    :can-create="true"
    :can-edit="true"
    :can-delete="true"
    :can-toggle-estado="true"
    :modal-open="modalOpen"
    :editing="editing"
    :fields="fields"
    :form="form"
    :saving="saving"
    crear-titulo="Nuevo bodeguero"
    editar-titulo="Editar bodeguero"
    crear-submit-label="Crear bodeguero"
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
    @toggle-estado="toggleEstado"
    @update:model-value="form = $event"
    @submit="save"
    @close-modal="modalOpen = false"
    @confirm="confirmarEliminar"
    @cancel="confirmOpen = false"
    @close-alert="alert = null"
  >
    <template #cell-estado="{ value }">
      <span>{{ value === false ? 'Inactivo' : 'Activo' }}</span>
    </template>
  </CrudPage>
</template>
